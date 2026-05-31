import { createReply, deleteReply, updateReply } from '@renderer/data/fetch/api/reply'
import { useMutationMustAuth } from '@renderer/data/hooks/factory'
import type {
  CreateReplyInput,
  DeleteReplyInput,
  UpdateReplyInput,
} from '@renderer/data/fetch/api/reply'
import type { ReplyTarget } from '@shared/reply'
import { useQueryClient } from '@tanstack/react-query'

export const useCreateReplyMutation = () => {
  const queryClient = useQueryClient()

  return useMutationMustAuth({
    mutationFn: createReply,
    mutationKey: ['create-reply'],
    onSuccess: (_, variables: CreateReplyInput) => {
      for (const queryKey of getReplyInvalidationKeys(variables.target)) {
        queryClient.invalidateQueries({ queryKey })
      }
    },
  })
}

export const useDeleteReplyMutation = () => {
  const queryClient = useQueryClient()

  return useMutationMustAuth({
    mutationFn: deleteReply,
    mutationKey: ['delete-reply'],
    onSuccess: (_, variables: DeleteReplyInput) => {
      for (const queryKey of getReplyInvalidationKeys(variables.target)) {
        queryClient.invalidateQueries({ queryKey })
      }
    },
  })
}

export const useUpdateReplyMutation = () => {
  const queryClient = useQueryClient()

  return useMutationMustAuth({
    mutationFn: updateReply,
    mutationKey: ['update-reply'],
    onSuccess: (_, variables: UpdateReplyInput) => {
      for (const queryKey of getReplyInvalidationKeys(variables.target)) {
        queryClient.invalidateQueries({ queryKey })
      }
    },
  })
}

export function getReplyInvalidationKeys(target: ReplyTarget) {
  switch (target.type) {
    case 'group-topic':
      return [['community-group-topic']]
    case 'subject-topic':
      return [['community-subject-topic']]
    case 'episode':
      return [['episode-comments', target.id.toString()]]
    case 'person':
      return [['person-comments', target.id]]
    case 'character':
      return [['character-comments', target.id]]
    case 'timeline':
      return [['site-timeline-v1'], ['site-timeline-infinite-v1'], ['user-timeline']]
    case 'blog':
      return [['blog-comments', target.id]]
    case 'index':
      return [['index-comments', target.id]]
  }
}
