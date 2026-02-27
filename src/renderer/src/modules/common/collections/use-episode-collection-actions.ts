import { EpisodeCollectionAction } from '@renderer/constant/collection'
import { useMutationEpisodesCollectionBySubjectId } from '@renderer/data/hooks/api/collection'
import { useQueryKeyWithUserId } from '@renderer/data/hooks/factory'
import { useSessionUsername } from '@renderer/data/hooks/session'
import { SubjectId } from '@renderer/data/types/bgm'
import {
  CollectionEpisode,
  CollectionEpisodes,
  CollectionType,
  EpisodeCollectionType,
} from '@renderer/data/types/collection'
import { ModifyEpisodeCollectionOptType } from '@renderer/data/types/modify'
import { EPISODE_COLLECTION_ACTION_MAP, EPISODE_COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'
import { checkEpisodeFinished } from '@renderer/modules/common/collections/check-episode-finished'
import { subjectCollectionSheetFormAtom } from '@renderer/state/dialog/sheet'
import { useQueryClient } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { toast } from 'sonner'

type Props = {
  index: number
  subjectId: SubjectId
  episodes: CollectionEpisode[] | undefined
} & ModifyEpisodeCollectionOptType

export function useEpisodeCollectionActions({
  index,
  subjectId,
  episodes,
  modifyEpisodeCollectionOpt,
}: Props) {
  const username = useSessionUsername()
  const openCollectionSheet = useSetAtom(subjectCollectionSheetFormAtom)
  const queryClient = useQueryClient()
  const episodeCollectionType = episodes?.[index]?.type
  const currentAction =
    episodeCollectionType === undefined
      ? null
      : (EPISODE_COLLECTION_TYPE_MAP[episodeCollectionType] ?? null)
  const queryKey = useQueryKeyWithUserId(['collection-episodes'], {
    subjectId,
    limit: modifyEpisodeCollectionOpt.limit,
    offset: modifyEpisodeCollectionOpt.offset,
    episodeType: undefined,
  })
  const subjectCollectionQueryKey = useQueryKeyWithUserId(['collection-subject'], {
    subjectId,
    username,
  })
  const subjectInfoQueryKey = useQueryKeyWithUserId(['subject-info'], { id: Number(subjectId) })
  const collectionSubjectsQueryKey = useQueryKeyWithUserId(['collection-subjects'])

  const episodeCollectionMutation = useMutationEpisodesCollectionBySubjectId({
    mutationKey: ['subject-collection'],
    async onSuccess() {
      toast.success('修改成功')
      try {
        const checkResult = await checkEpisodeFinished({
          queryClient,
          subjectId,
          username,
          episodesQueryKey: queryKey,
          subjectCollectionQueryKey,
          subjectInfoQueryKey,
        })
        if (!checkResult) return
        toast('观察到你已经看完了', {
          action: {
            label: '标记',
            onClick: () => {
              openCollectionSheet({
                open: true,
                content: {
                  sheetTitle: '修改收藏',
                  collectionType: CollectionType.watched,
                  subjectId: checkResult.subjectCollection.subject_id.toString(),
                  subjectTags: checkResult.subjectInfo.tags,
                  subjectType: checkResult.subjectCollection.subject_type,
                  comment: checkResult.subjectCollection.comment ?? '',
                  isPrivate: checkResult.subjectCollection.private,
                  rate: checkResult.subjectCollection.rate,
                  tags: checkResult.subjectCollection.tags,
                  modify: true,
                },
              })
            },
          },
        })
      } catch {
        // 检查仅用于提示，不影响章节收藏主流程。
      }
    },
    onError(_error, _variable, context) {
      toast.error('呀，出了点错误...')
      const pre = (context as { pre: CollectionEpisodes }).pre
      queryClient.setQueryData<CollectionEpisodes>(queryKey, pre)
    },
    onMutate(variable) {
      queryClient.cancelQueries({
        queryKey,
      })
      const { episodesId, episodeCollectionType } = variable
      const pre = queryClient.getQueryData<CollectionEpisodes>(queryKey)
      if (episodes) {
        queryClient.setQueryData<CollectionEpisodes>(queryKey, (previousData) => {
          if (!previousData) return
          return {
            ...previousData,
            data: episodes.map((item) => {
              if (episodesId.includes(item.episode.id)) {
                return { ...item, type: episodeCollectionType }
              }
              return item
            }),
          }
        })
      }
      return { pre }
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey,
      })
      queryClient.invalidateQueries({
        queryKey: collectionSubjectsQueryKey,
      })
      queryClient.invalidateQueries({
        queryKey: subjectCollectionQueryKey,
      })
    },
  })

  const mutateWatchedAction = () => {
    const currentEpisode = episodes?.[index]?.episode
    if (!currentEpisode) return
    episodeCollectionMutation.mutate({
      episodeCollectionType: EpisodeCollectionType.watched,
      subjectId,
      episodesId: [currentEpisode.id],
    })
  }

  const mutateSeenAction = () => {
    if (!episodes) return
    const start = episodes.findIndex((episode) => episode.type !== EpisodeCollectionType.watched)
    if (start < 0 || start > index) return
    const episodesId = episodes.slice(start, index + 1).map((episode) => episode.episode.id)
    if (episodesId.length === 0) return
    episodeCollectionMutation.mutate({
      episodeCollectionType: EpisodeCollectionType.watched,
      subjectId,
      episodesId,
    })
  }

  const mutateByAction = (action: EpisodeCollectionAction) => {
    if (!episodes?.[index]) return
    if (action === '看到') {
      mutateSeenAction()
      return
    }
    if (action === '看过') {
      mutateWatchedAction()
      return
    }
    episodeCollectionMutation.mutate({
      episodeCollectionType: EPISODE_COLLECTION_ACTION_MAP[action],
      subjectId,
      episodesId: [episodes[index].episode.id],
    })
  }

  const mutateNotCollected = () => {
    const currentEpisode = episodes?.[index]?.episode
    if (!currentEpisode) return
    episodeCollectionMutation.mutate({
      episodeCollectionType: EpisodeCollectionType.notCollected,
      subjectId,
      episodesId: [currentEpisode.id],
    })
  }

  return {
    currentAction,
    episodeCollectionType,
    mutateByAction,
    mutateNotCollected,
  }
}
