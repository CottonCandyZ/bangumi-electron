import { EpisodeCollectionAction } from '@renderer/constant/collection'
import { useMutationEpisodesCollectionBySubjectId } from '@renderer/data/hooks/api/collection'
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
} & ModifyEpisodeCollectionOptType

export function useEpisodeCollectionActions({ index, subjectId, episodes }: Props) {
  const openCollectionSheet = useSetAtom(subjectCollectionSheetFormAtom)
  const episodeCollectionType = episodes?.[index]?.type
  const currentAction =
    episodeCollectionType === undefined
      ? null
      : (EPISODE_COLLECTION_TYPE_MAP[episodeCollectionType] ?? null)
  const episodeCollectionMutation = useMutationEpisodesCollectionBySubjectId({
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
    onError(error) {
      toast.error(error.message || '进度更新失败，请重试')
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
