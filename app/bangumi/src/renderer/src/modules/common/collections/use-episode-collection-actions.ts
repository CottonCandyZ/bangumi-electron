import { EpisodeCollectionAction } from '@renderer/constant/collection'
import {
  useMutationEpisodesCollectionBySubjectId,
  useMutationEpisodesWatchedThrough,
} from '@renderer/data/hooks/api/collection'
import { SubjectId } from '@renderer/data/types/bgm'
import {
  CollectionEpisode,
  CollectionType,
  EpisodeCollectionType,
} from '@renderer/data/types/collection'
import { ModifyEpisodeCollectionOptType } from '@renderer/data/types/modify'
import { EPISODE_COLLECTION_ACTION_MAP, EPISODE_COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'
import { checkEpisodeFinished } from '@renderer/modules/common/collections/check-episode-finished'
import { subjectCollectionSheetFormAtom } from '@renderer/state/dialog/sheet'
import { useSetAtom } from 'jotai'
import { toast } from 'sonner'

type Props = {
  index: number
  subjectId: SubjectId
  episodes: CollectionEpisode[] | undefined
  onProgressSaved?: (count: number) => void
} & Partial<ModifyEpisodeCollectionOptType>

export function useEpisodeCollectionActions({
  index,
  subjectId,
  episodes,
  onProgressSaved,
}: Props) {
  const openCollectionSheet = useSetAtom(subjectCollectionSheetFormAtom)
  const episodeCollectionType = episodes?.[index]?.type
  const currentAction =
    episodeCollectionType === undefined
      ? null
      : (EPISODE_COLLECTION_TYPE_MAP[episodeCollectionType] ?? null)
  const mutationOptions = {
    mutationKey: ['subject-collection'],
    async onSuccess() {
      try {
        const checkResult = await checkEpisodeFinished({ subjectId })
        if (!checkResult) return
        toast('已看完全部章节', {
          action: {
            label: '标记为看过',
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
    onError(error: Error) {
      toast.error(error.message || '进度更新失败，请重试')
    },
  }
  const episodeCollectionMutation = useMutationEpisodesCollectionBySubjectId(mutationOptions)
  const watchedThroughMutation = useMutationEpisodesWatchedThrough({
    ...mutationOptions,
    onSuccess(count) {
      onProgressSaved?.(count)
      return mutationOptions.onSuccess()
    },
  })
  const isPending = episodeCollectionMutation.isPending || watchedThroughMutation.isPending

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
    const currentEpisode = episodes?.[index]?.episode
    if (!currentEpisode) return
    watchedThroughMutation.mutate({
      subjectId,
      episodeId: currentEpisode.id,
    })
  }

  const mutateByAction = (action: EpisodeCollectionAction) => {
    if (!episodes?.[index] || isPending) return
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
    if (isPending) return
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
    isPending,
    episodeCollectionType,
    mutateByAction,
    mutateNotCollected,
  }
}
