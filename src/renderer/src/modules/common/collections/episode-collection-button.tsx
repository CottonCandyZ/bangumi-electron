import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { EPISODE_COLLECTION_ACTION } from '@renderer/constant/collection'
import {
  useMutationEpisodesCollectionBySubjectId,
  useCollectionEpisodesInfoBySubjectIdQuery,
} from '@renderer/data/hooks/api/collection'
import { SubjectId } from '@renderer/data/types/bgm'
import {
  CollectionEpisodes,
  CollectionType,
  EpisodeCollectionType,
} from '@renderer/data/types/collection'
import { ModifyEpisodeCollectionOptType } from '@renderer/data/types/modify'
import { SubjectType } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { EPISODE_COLLECTION_ACTION_MAP, EPISODE_COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useQueryKeyWithUserId } from '@renderer/data/hooks/factory'
import { useSessionUsername } from '@renderer/data/hooks/session'

type Props = {
  index: number
  subjectId: SubjectId
  subjectType: SubjectType
  setEnabledForm: (enabled: boolean) => void
} & ModifyEpisodeCollectionOptType

export function EpisodeCollectionButton({
  index,
  subjectId,
  subjectType,
  modifyEpisodeCollectionOpt,
  setEnabledForm,
}: Props) {
  const username = useSessionUsername()
  const collectionEpisodesQuery = useCollectionEpisodesInfoBySubjectIdQuery({
    ...modifyEpisodeCollectionOpt,
    subjectId,
    enabled: !!username,
  })
  const collectionEpisodes = collectionEpisodesQuery.data
  const episodes = collectionEpisodes?.data
  const queryClient = useQueryClient()
  const episodeCollectionType = episodes?.[index].type
  const [hover, setHover] = useState<(typeof EPISODE_COLLECTION_ACTION)[number] | null>(
    episodeCollectionType ? (EPISODE_COLLECTION_TYPE_MAP[episodeCollectionType] ?? null) : null,
  )
  useEffect(() => {
    setHover(
      episodeCollectionType ? (EPISODE_COLLECTION_TYPE_MAP[episodeCollectionType] ?? null) : null,
    )
  }, [episodeCollectionType])
  const queryKey = useQueryKeyWithUserId([
    'collection-episodes',
    {
      subjectId,
      limit: modifyEpisodeCollectionOpt.limit,
      offset: modifyEpisodeCollectionOpt.offset,
      episodeType: undefined,
    },
  ])
  const invalidateQueryKey = ['collection-subject', { subjectId, username }]

  const episodeCollectionMutation = useMutationEpisodesCollectionBySubjectId({
    mutationKey: ['subject-collection'],
    onSuccess() {
      toast.success('修改成功')
      setEnabledForm(true)
    },
    onError(_error, _variable, context) {
      toast.error('呀，出了点错误...')
      const pre = (context as { pre: CollectionEpisodes }).pre
      queryClient.setQueryData<CollectionEpisodes>(queryKey, pre)
    },
    onMutate(variable) {
      setEnabledForm(false)
      queryClient.cancelQueries({
        queryKey,
      })
      const { episodesId, episodeCollectionType } = variable
      const pre = queryClient.getQueryData<CollectionEpisodes>(queryKey)
      if (episodes)
        queryClient.setQueryData<CollectionEpisodes>(queryKey, (pre) => {
          if (!pre) return
          return {
            ...pre,
            data: episodes.map((item) => {
              if (episodesId.includes(item.episode.id)) {
                return { ...item, type: episodeCollectionType }
              } else return item
            }),
          }
        })
      return { pre }
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey,
      })
      if (episodes)
        queryClient.invalidateQueries({
          queryKey: [
            'collection-subjects',
            { username, collectionType: CollectionType.watching, subjectType },
          ],
        })
      queryClient.invalidateQueries({
        queryKey: invalidateQueryKey,
      })
    },
  })

  if (episodes === undefined || episodeCollectionType == undefined)
    return <Skeleton className="h-9 w-52" />
  if (!episodes) return null

  return (
    <div className="flex h-9 flex-row gap-1">
      <div
        className={cn(
          'bg-muted text-muted-foreground inline-flex h-9 w-fit flex-wrap items-center justify-center rounded-md',
        )}
        onMouseLeave={() => setHover(EPISODE_COLLECTION_TYPE_MAP[episodeCollectionType] ?? null)}
      >
        {EPISODE_COLLECTION_ACTION.map((item) => {
          if (episodeCollectionType === EpisodeCollectionType.watched && item === '看到')
            return null
          return (
            <button
              className={cn(
                `ring-offset-background hover:border-border hover:bg-background hover:text-foreground focus-visible:ring-ring relative inline-flex h-full cursor-pointer items-center justify-center rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50`,
                hover === item && 'border-border bg-background text-foreground',
                EPISODE_COLLECTION_TYPE_MAP[episodeCollectionType] == item && 'cursor-default',
              )}
              key={item}
              onClick={(e) => {
                if (item === EPISODE_COLLECTION_TYPE_MAP[episodeCollectionType]) return
                if (item !== '看到') {
                  const action = EPISODE_COLLECTION_ACTION_MAP[item]
                  episodeCollectionMutation.mutate({
                    episodeCollectionType: action,
                    subjectId,
                    episodesId: [episodes[index].episode.id],
                  })
                } else {
                  const start = episodes.findIndex(
                    (item) => item.type !== EpisodeCollectionType.watched,
                  )
                  episodeCollectionMutation.mutate({
                    episodeCollectionType: EpisodeCollectionType.watched,
                    subjectId,
                    episodesId: episodes.slice(start, index + 1).map((item) => item.episode.id),
                  })
                }
                e.preventDefault()
              }}
              onMouseEnter={() => setHover(item)}
            >
              {item}
            </button>
          )
        })}
      </div>
      {episodeCollectionType !== EpisodeCollectionType.notCollected && (
        <Button
          className="px-3 py-1"
          variant="outline"
          onClick={(e) => {
            episodeCollectionMutation.mutate({
              episodeCollectionType: EpisodeCollectionType.notCollected,
              subjectId,
              episodesId: [episodes[index].episode.id],
            })
            e.preventDefault()
          }}
        >
          撤销
        </Button>
      )}
    </div>
  )
}
