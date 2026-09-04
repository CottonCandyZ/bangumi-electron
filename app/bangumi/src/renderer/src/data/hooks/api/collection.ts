import { client } from '@renderer/lib/client'
import { useSession } from '@renderer/data/hooks/session'
import { userIdAtom } from '@renderer/state/session'
import { useAtomValue } from 'jotai'
import { useMutation } from '@tanstack/react-query'
import { editLocalCollection, editLocalEpisodes } from '@renderer/data/collection/client'
import {
  getCharacterCollectionByIdAndUsername,
  getP1Collections,
  getPersonCollectionByIdAndUsername,
  getSubjectCollectionBySubjectIdAndUsername,
  getSubjectCollectionsByUsernameMustAuth,
  setResourceCollection,
} from '@renderer/data/fetch/api/collection'
import {
  useAuthQuery,
  useInfinityQueryOptionalAuth,
  useMutationMustAuth,
} from '@renderer/data/hooks/factory'
import { CharacterId, PersonId, SubjectId } from '@renderer/data/types/bgm'
import { EpisodeType } from '@renderer/data/types/episode'
import { UserInfo } from '@renderer/data/types/user'
import { useQueryClient, UseMutationOptions } from '@tanstack/react-query'

type OmitInfinityQFP<P> = Omit<P, 'offset'>

type ApiMutationOptionsWithoutToken<TFunction> = TFunction extends (arg: infer P) => infer R
  ? Omit<UseMutationOptions<Awaited<R>, Error, P>, 'mutationFn'>
  : never

export const useInfinityQueryCollectionsByUsername = ({
  username,
  subjectType,
  collectionType,
  limit = 10,
  initialPageParam = 0,
  enabled,
  needKeepPreviousData,
  refetchPageLimit,
}: OmitInfinityQFP<Parameters<typeof getSubjectCollectionsByUsernameMustAuth>[0]> & {
  username: UserInfo['username'] | undefined
  initialPageParam?: number
  enabled?: boolean
  needKeepPreviousData?: boolean
  refetchPageLimit?: number
}) => {
  const userId = Number(useAtomValue(userIdAtom))
  const profile = useSession()
  const own = !!userId && (username === profile?.username || username === String(userId))
  return useInfinityQueryOptionalAuth({
    queryFn: localOrRemoteList,
    networkMode: own ? 'always' : 'offlineFirst',
    persister: undefined,
    queryKey: ['collection-subjects'],
    queryProps: { username, collectionType, subjectType, own, userId },
    qFLimit: limit,
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.limit
      if (next >= lastPage.total) return null
      else return next
    },
    initialPageParam: initialPageParam,
    enabled,
    needKeepPreviousData,
    refetchPageLimit,
  })
}

export const useInfinityQueryP1Collections = ({
  collectionType,
  enabled,
  initialPageParam = 0,
  limit = 20,
  needKeepPreviousData,
  refetchPageLimit,
  resourceType,
  subjectType,
  username,
}: OmitInfinityQFP<Parameters<typeof getP1Collections>[0]> & {
  initialPageParam?: number
  enabled?: boolean
  needKeepPreviousData?: boolean
  refetchPageLimit?: number
}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getP1Collections,
    queryKey: ['p1-collections'],
    queryProps: { username, resourceType, subjectType, collectionType },
    qFLimit: limit,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
    initialPageParam,
    enabled,
    needKeepPreviousData,
    refetchPageLimit,
  })

export const useCharacterCollectionQuery = ({
  characterId,
  enabled,
  username,
}: {
  characterId: CharacterId | undefined
  enabled?: boolean
  username: UserInfo['username'] | undefined
}) =>
  useAuthQuery({
    queryFn: getCharacterCollectionByIdAndUsername,
    queryKey: ['collection-character'],
    queryProps: { characterId, username },
    enabled,
    needKeepPreviousData: false,
  })

export const usePersonCollectionQuery = ({
  enabled,
  personId,
  username,
}: {
  enabled?: boolean
  personId: PersonId | undefined
  username: UserInfo['username'] | undefined
}) =>
  useAuthQuery({
    queryFn: getPersonCollectionByIdAndUsername,
    queryKey: ['collection-person'],
    queryProps: { personId, username },
    enabled,
    needKeepPreviousData: false,
  })

export const useResourceCollectionMutation = () => {
  const queryClient = useQueryClient()

  return useMutationMustAuth({
    mutationFn: setResourceCollection,
    mutationKey: ['resource-collection'],
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['p1-collections'] })
      if (variables.resourceType === 'character') {
        queryClient.invalidateQueries({ queryKey: ['collection-character'] })
        queryClient.invalidateQueries({ queryKey: ['characterDetail'] })
      } else if (variables.resourceType === 'person') {
        queryClient.invalidateQueries({ queryKey: ['collection-person'] })
        queryClient.invalidateQueries({ queryKey: ['person-detail'] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['index-detail'] })
      }
    },
  })
}

/** 用条目 ID 获得 章节收藏, must auth */
export const useCollectionEpisodesInfoBySubjectIdQuery = ({
  subjectId,
  limit = 100,
  offset = 0,
  episodeType,
  enabled,
}: {
  subjectId: SubjectId
  limit?: number
  offset?: number
  episodeType?: EpisodeType
  enabled?: boolean
}) => {
  const userId = Number(useAtomValue(userIdAtom))
  return useAuthQuery({
    queryFn: localEpisodes,
    queryKey: ['collection-episodes'],
    queryProps: { subjectId, limit, offset, episodeType, userId },
    enabled: !!userId && (enabled ?? true),
    networkMode: 'always',
    persister: undefined,
    staleTime: Infinity,
    needKeepPreviousData: false,
  })
}

export const useQuerySubjectCollection = ({
  subjectId,
  username,
  enabled,
  needKeepPreviousData,
}: {
  subjectId: SubjectId | undefined
  username: UserInfo['username'] | undefined
  enabled?: boolean
  needKeepPreviousData?: boolean
}) => {
  const userId = Number(useAtomValue(userIdAtom))
  const profile = useSession()
  const own = !!userId && (username === profile?.username || username === String(userId))
  return useAuthQuery({
    queryFn: localOrRemoteSubject,
    queryKey: ['collection-subject'],
    queryProps: { subjectId, username, own, userId },
    enabled: !!subjectId && !!username && (enabled ?? true),
    networkMode: own ? 'always' : 'offlineFirst',
    persister: undefined,
    needKeepPreviousData: own ? false : needKeepPreviousData,
  })
}

export const useMutationSubjectCollection = (
  options: ApiMutationOptionsWithoutToken<typeof editLocalCollection>,
) =>
  useMutation({ ...options, mutationFn: editLocalCollection, networkMode: 'always', retry: false })

export const useMutationEpisodesCollectionBySubjectId = (
  options: ApiMutationOptionsWithoutToken<typeof editLocalEpisodes>,
) => useMutation({ ...options, mutationFn: editLocalEpisodes, networkMode: 'always', retry: false })

function localOrRemoteList(
  props: Parameters<typeof getSubjectCollectionsByUsernameMustAuth>[0] & {
    own: boolean
    userId: number
  },
) {
  return props.own ? client.collectionList(props) : getSubjectCollectionsByUsernameMustAuth(props)
}
function localOrRemoteSubject(props: {
  own: boolean
  userId: number
  subjectId: string | undefined
  username: string | undefined
}) {
  return props.own
    ? client.collectionRead({ userId: props.userId, subjectId: Number(props.subjectId) })
    : getSubjectCollectionBySubjectIdAndUsername(props)
}
function localEpisodes(props: {
  userId: number
  subjectId: string
  limit: number
  offset: number
  episodeType: EpisodeType | undefined
}) {
  return client.collectionReadEpisodes({ ...props, subjectId: Number(props.subjectId) })
}
