import { NEXT_BLOGS, NEXT_USERS, nextFetchWithOptionalAuth } from '@renderer/data/fetch/config'
import type {
  BlogComments,
  BlogEntry,
  BlogListPage,
  BlogPhotoPage,
  BlogSubjects,
} from '@renderer/data/types/blog'
import { FetchParamError } from '@renderer/lib/utils/error'

export function getUserBlogs({
  limit,
  offset,
  username,
}: {
  limit?: number
  offset: number
  username: string | undefined
}) {
  if (!username) throw new FetchParamError('未获得 username')
  return nextFetchWithOptionalAuth<BlogListPage>(NEXT_USERS.BLOGS_BY_USERNAME(username), {
    query: { limit, offset },
  })
}

export const getBlog = ({ entryId }: { entryId: number }) =>
  nextFetchWithOptionalAuth<BlogEntry>(NEXT_BLOGS.BY_ID(entryId))

export const getBlogPhotos = ({ entryId }: { entryId: number }) =>
  nextFetchWithOptionalAuth<BlogPhotoPage>(NEXT_BLOGS.PHOTOS_BY_ID(entryId))

export const getBlogSubjects = ({ entryId }: { entryId: number }) =>
  nextFetchWithOptionalAuth<BlogSubjects>(NEXT_BLOGS.SUBJECTS_BY_ID(entryId))

export const getBlogComments = ({ entryId }: { entryId: number }) =>
  nextFetchWithOptionalAuth<BlogComments>(NEXT_BLOGS.COMMENTS_BY_ID(entryId))
