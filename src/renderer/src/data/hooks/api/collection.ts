import {
  AddOrModifySubjectCollectionById,
  getEpisodesCollectionBySubjectId,
  getSubjectCollectionBySubjectIdAndUsername,
  getSubjectCollectionsByUsername,
  ModifyEpisodeCollectionBySubjectId,
} from '@renderer/data/fetch/api/collection'
import {
  useAuthQuery,
  useInfinityQueryOptionalAuth,
  useMutationMustAuth,
  useQueryOptionalAuth,
} from '@renderer/data/hooks/factory'
import { SubjectId } from '@renderer/data/types/bgm'
import { EpisodeType } from '@renderer/data/types/episode'
import { UserInfo } from '@renderer/data/types/user'
import { UseMutationOptions } from '@tanstack/react-query'

type OmitInfinityQFP<P> = Omit<P, 'token' | 'offset'>

type ApiMutationOptionsWithoutToken<TFunction> = TFunction extends (arg: infer P) => infer R
  ? Omit<UseMutationOptions<Awaited<R>, Error, Omit<P, 'token'>>, 'mutationFn'>
  : never

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
}) =>
  useAuthQuery({
    queryFn: getEpisodesCollectionBySubjectId,
    queryKey: ['collection-episodes'],
    queryProps: { subjectId, limit, offset, episodeType },
    staleTime: 0,
    enabled,
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
}: ApiMutationOptionsWithoutToken<typeof AddOrModifySubjectCollectionById>) =>
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
}: ApiMutationOptionsWithoutToken<typeof ModifyEpisodeCollectionBySubjectId>) =>
  useMutationMustAuth({
    mutationKey,
    mutationFn: ModifyEpisodeCollectionBySubjectId,
    onSuccess,
    onMutate,
    onSettled,
    onError,
  })
