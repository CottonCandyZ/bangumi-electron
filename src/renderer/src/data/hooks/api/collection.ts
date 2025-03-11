import {
  AddOrModifySubjectCollectionById,
  getEpisodesCollectionBySubjectId,
  getSubjectCollectionBySubjectIdAndUsername,
  getSubjectCollectionsByUsername,
  ModifyEpisodeCollectionBySubjectId,
} from '@renderer/data/fetch/api/collection'
import {
  useInfinityQueryOptionalAuth,
  useMutationMustAuth,
  useQueryMustAuth,
  useQueryOptionalAuth,
} from '@renderer/data/hooks/factory'
import { SubjectId } from '@renderer/data/types/bgm'
import { EpisodeType } from '@renderer/data/types/episode'
import { UserInfo } from '@renderer/data/types/user'
import { MutationKey, UseMutationOptions } from '@tanstack/react-query'

type OmitInfinityQFP<P> = Omit<P, 'token' | 'offset'>

export const useInfinityQueryCollectionsByUsername = ({
  username,
  subjectType,
  collectionType,
  limit = 10,
  initialPageParam = 0,
  enabled,
  needKeepPreviousData,
}: OmitInfinityQFP<Parameters<typeof getSubjectCollectionsByUsername>[0]> & {
  username: UserInfo['username'] | undefined
  initialPageParam?: number
  enabled?: boolean
  needKeepPreviousData?: boolean
}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getSubjectCollectionsByUsername,
    queryKey: ['collection-subjects'],
    queryProps: { username, collectionType, subjectType },
    qFLimit: limit,
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.limit
      if (next >= lastPage.total) return null
      else return next
    },
    initialPageParam: initialPageParam,
    enabled,
    needKeepPreviousData,
  })

export const useQueryCollectionEpisodesInfoBySubjectId = ({
  subjectId,
  limit = 100,
  offset = 0,
  episodeType,
  enabled,
}: {
  subjectId: SubjectId | undefined
  limit?: number
  offset?: number
  episodeType?: EpisodeType
  enabled?: boolean
}) =>
  useQueryMustAuth({
    queryFn: getEpisodesCollectionBySubjectId,
    queryKey: ['collection-episodes'],
    queryProps: { subjectId, limit, offset, episodeType },
    enabled,
    staleTime: 0,
  })

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
}) =>
  useQueryOptionalAuth({
    queryFn: getSubjectCollectionBySubjectIdAndUsername,
    queryKey: ['collection-subject'],
    queryProps: { subjectId, username },
    enabled: enabled,
    needKeepPreviousData,
  })

export const useMutationSubjectCollection = ({
  mutationKey,
  onSuccess,
  onMutate,
  onSettled,
  onError,
}: {
  mutationKey?: MutationKey
} & UseMutationOptions<
  Awaited<ReturnType<typeof AddOrModifySubjectCollectionById>>,
  Error,
  Omit<Parameters<typeof AddOrModifySubjectCollectionById>[0], 'token'>
>) =>
  useMutationMustAuth({
    mutationKey,
    mutationFn: AddOrModifySubjectCollectionById,
    onSuccess,
    onMutate,
    onSettled,
    onError,
  })

export const useMutationEpisodesCollectionBySubjectId = ({
  mutationKey,
  onSuccess,
  onMutate,
  onSettled,
  onError,
}: {
  mutationKey?: MutationKey
} & UseMutationOptions<
  Awaited<ReturnType<typeof ModifyEpisodeCollectionBySubjectId>>,
  Error,
  Omit<Parameters<typeof ModifyEpisodeCollectionBySubjectId>[0], 'token'>
>) =>
  useMutationMustAuth({
    mutationKey,
    mutationFn: ModifyEpisodeCollectionBySubjectId,
    onSuccess,
    onMutate,
    onSettled,
    onError,
  })
