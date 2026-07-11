import {
  NEXT_CHARACTERS,
  NEXT_PERSONS,
  nextFetchWithOptionalAuth,
} from '@renderer/data/fetch/config'
import type { MonoType } from '@renderer/data/types/mono'
import type { MonoPhoto, MonoPhotoComments, MonoPhotoPage } from '@renderer/data/types/photo'

type PhotoTarget = { monoId: string; monoType: MonoType }
type PhotoDetailTarget = PhotoTarget & { photoId: number }

function getPaths({ monoId, monoType }: PhotoTarget) {
  return monoType === 'person'
    ? {
        preview: NEXT_PERSONS.PHOTO_PREVIEW_BY_ID(monoId),
        list: NEXT_PERSONS.PHOTOS_BY_ID(monoId),
        detail: (photoId: number) => NEXT_PERSONS.PHOTO_BY_ID(monoId, photoId),
        comments: (photoId: number) => NEXT_PERSONS.PHOTO_COMMENTS_BY_ID(monoId, photoId),
      }
    : {
        preview: NEXT_CHARACTERS.PHOTO_PREVIEW_BY_ID(monoId),
        list: NEXT_CHARACTERS.PHOTOS_BY_ID(monoId),
        detail: (photoId: number) => NEXT_CHARACTERS.PHOTO_BY_ID(monoId, photoId),
        comments: (photoId: number) => NEXT_CHARACTERS.PHOTO_COMMENTS_BY_ID(monoId, photoId),
      }
}

export function getMonoPhotoPreview(target: PhotoTarget) {
  return nextFetchWithOptionalAuth<MonoPhotoPage>(getPaths(target).preview)
}

export function getMonoPhotos({
  limit,
  offset,
  ...target
}: PhotoTarget & { limit?: number; offset: number }) {
  return nextFetchWithOptionalAuth<MonoPhotoPage>(getPaths(target).list, {
    query: { limit, offset },
  })
}

export function getMonoPhoto({ photoId, ...target }: PhotoDetailTarget) {
  return nextFetchWithOptionalAuth<MonoPhoto>(getPaths(target).detail(photoId))
}

export function getMonoPhotoComments({ photoId, ...target }: PhotoDetailTarget) {
  return nextFetchWithOptionalAuth<MonoPhotoComments>(getPaths(target).comments(photoId))
}
