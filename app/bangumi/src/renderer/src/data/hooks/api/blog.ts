import {
  getBlog,
  getBlogComments,
  getBlogPhotos,
  getBlogSubjects,
  getUserBlogs,
} from '@renderer/data/fetch/api/blog'
import { useAuthQuery, useInfinityQueryOptionalAuth } from '@renderer/data/hooks/factory'

export const useUserBlogsQuery = ({
  enabled,
  limit = 20,
  username,
}: {
  enabled?: boolean
  limit?: number
  username: string | undefined
}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getUserBlogs,
    queryKey: ['user-blogs'],
    queryProps: { username },
    qFLimit: limit,
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
  })

export const useBlogQuery = ({ enabled, entryId }: { enabled?: boolean; entryId: number }) =>
  useAuthQuery({ queryFn: getBlog, queryKey: ['blog'], queryProps: { entryId }, enabled })

export const useBlogPhotosQuery = ({ enabled, entryId }: { enabled?: boolean; entryId: number }) =>
  useAuthQuery({
    queryFn: getBlogPhotos,
    queryKey: ['blog-photos'],
    queryProps: { entryId },
    enabled,
  })

export const useBlogSubjectsQuery = ({
  enabled,
  entryId,
}: {
  enabled?: boolean
  entryId: number
}) =>
  useAuthQuery({
    queryFn: getBlogSubjects,
    queryKey: ['blog-subjects'],
    queryProps: { entryId },
    enabled,
  })

export const useBlogCommentsQuery = ({
  enabled,
  entryId,
}: {
  enabled?: boolean
  entryId: number
}) =>
  useAuthQuery({
    queryFn: getBlogComments,
    queryKey: ['blog-comments', entryId],
    queryProps: { entryId },
    enabled,
  })
