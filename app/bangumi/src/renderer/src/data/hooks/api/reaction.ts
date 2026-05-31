import {
  toggleReaction,
  type ReactionTarget,
  type ToggleReactionInput,
} from '@renderer/data/fetch/api/reaction'
import { useMutationMustAuth } from '@renderer/data/hooks/factory'
import type { CommentReaction, CommentReactionUser } from '@renderer/data/types/comment'
import type { QueryKey } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

type ReactionSnapshot = Array<{
  data: unknown
  queryKey: QueryKey
}>

type OptimisticReactionContext = {
  snapshots: ReactionSnapshot
}

export const useToggleReactionMutation = () => {
  const queryClient = useQueryClient()

  return useMutationMustAuth<ToggleReactionInput, Record<string, never>>({
    mutationFn: toggleReaction,
    mutationKey: ['toggle-reaction'],
    onMutate: async (variables) => {
      const user = variables.user
      const snapshots: ReactionSnapshot = []

      for (const queryKey of getReactionInvalidationKeys(variables.target)) {
        await queryClient.cancelQueries({ queryKey })
        const matchedQueries = queryClient.getQueriesData({ queryKey })
        snapshots.push(
          ...matchedQueries.map(([matchedQueryKey, data]) => ({ data, queryKey: matchedQueryKey })),
        )

        queryClient.setQueriesData({ queryKey }, (data) =>
          updateReactionData(data, variables, user),
        )
      }

      return { snapshots } satisfies OptimisticReactionContext
    },
    onError: (_error, _variables, context) => {
      const snapshots = (context as OptimisticReactionContext | undefined)?.snapshots ?? []
      for (const snapshot of snapshots) {
        queryClient.setQueryData(snapshot.queryKey, snapshot.data)
      }
    },
    onSuccess: (_, variables: ToggleReactionInput) => {
      toast.success(variables.active ? '已取消贴贴' : '贴贴成功')
      for (const queryKey of getReactionInvalidationKeys(variables.target)) {
        queryClient.invalidateQueries({ queryKey })
      }
    },
  })
}

function updateReactionData(
  data: unknown,
  variables: ToggleReactionInput,
  user?: CommentReactionUser,
): unknown {
  if (!data) return data

  if (Array.isArray(data)) {
    let changed = false
    const next = data.map((item) => {
      const updated = updateReactionData(item, variables, user)
      changed ||= updated !== item
      return updated
    })
    return changed ? next : data
  }

  if (!isRecord(data)) return data

  let changed = false
  let next: Record<string, unknown> = data

  if (isReactableItem(data, variables)) {
    next = {
      ...next,
      reactions: updateReactions(data.reactions as CommentReaction[] | undefined, variables, user),
    }
    changed = true
  }

  for (const key of ['data', 'pages', 'replies']) {
    if (!(key in next)) continue

    const current = next[key]
    const updated = updateReactionData(current, variables, user)
    if (updated === current) continue

    if (!changed) {
      next = { ...next }
      changed = true
    }
    next[key] = updated
  }

  return changed ? next : data
}

function updateReactions(
  reactions: CommentReaction[] | undefined,
  variables: ToggleReactionInput,
  user?: CommentReactionUser,
): CommentReaction[] {
  const nextReactions = (reactions ?? [])
    .map((reaction) => ({
      ...reaction,
      users: user
        ? reaction.users.filter((reactionUser) => !isSameReactionUser(reactionUser, user))
        : reaction.users,
    }))
    .filter((reaction) => reaction.users.length > 0)

  if (variables.active || !user) return nextReactions

  const targetReaction = nextReactions.find((reaction) => reaction.value === variables.value)
  if (targetReaction) {
    return nextReactions.map((reaction) =>
      reaction.value === variables.value
        ? { ...reaction, users: [...reaction.users, user] }
        : reaction,
    )
  }

  return [...nextReactions, { users: [user], value: variables.value }]
}

function isReactableItem(data: Record<string, unknown>, variables: ToggleReactionInput) {
  return (
    (data.id === variables.commentId ||
      isTimelineSubjectCollectItem(data, variables.commentId, variables.target)) &&
    (variables.target.type === 'timeline-status' ||
      'content' in data ||
      'comment' in data ||
      'reactions' in data ||
      isTimelineSubjectCollectItem(data, variables.commentId, variables.target)) &&
    !('pages' in data)
  )
}

function isTimelineSubjectCollectItem(
  data: Record<string, unknown>,
  collectId: number,
  target: ReactionTarget,
) {
  if (target.type !== 'subject-collect') return false

  const memo = data.memo
  if (!isRecord(memo)) return false

  const subjects = memo.subject
  if (!Array.isArray(subjects)) return false

  return subjects.some((subject) => isRecord(subject) && subject.collectID === collectId)
}

function isRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null
}

function isSameReactionUser(a: CommentReactionUser, b: CommentReactionUser) {
  return a.id === b.id || (a.username.length > 0 && a.username === b.username)
}

function getReactionInvalidationKeys(target: ReactionTarget) {
  switch (target.type) {
    case 'group-topic':
      return [['community-group-topic']]
    case 'subject-topic':
      return [['community-subject-topic']]
    case 'episode':
      return [['episode-comments', target.id.toString()]]
    case 'subject-collect':
      return [
        ['subject-comments'],
        ['site-timeline-v1'],
        ['site-timeline-infinite-v1'],
        ['user-timeline'],
        ['user-timeline-infinite'],
      ]
    case 'timeline-status':
      return [
        ['site-timeline-v1'],
        ['site-timeline-infinite-v1'],
        ['user-timeline'],
        ['user-timeline-infinite'],
      ]
    case 'timeline':
      return [
        ['site-timeline-v1'],
        ['site-timeline-infinite-v1'],
        ['user-timeline'],
        ['user-timeline-infinite'],
      ]
    case 'person':
      return [['person-comments', target.id]]
    case 'character':
      return [['character-comments', target.id]]
    case 'blog':
      return [['blog-comments', target.id]]
    case 'index':
      return [['index-comments', target.id]]
  }
}
