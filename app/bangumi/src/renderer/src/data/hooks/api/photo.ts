import {
  getMonoPhoto,
  getMonoPhotoComments,
  getMonoPhotoPreview,
  getMonoPhotos,
} from '@renderer/data/fetch/api/photo'
import { useAuthQuery, useInfinityQueryOptionalAuth } from '@renderer/data/hooks/factory'
import type { MonoType } from '@renderer/data/types/mono'

export const useMonoPhotoPreviewQuery = ({
  enabled,
  monoId,
  monoType,
}: {
  enabled?: boolean
  monoId: string
  monoType: MonoType
}) =>
  useAuthQuery({
    queryFn: getMonoPhotoPreview,
    queryKey: ['mono-photo-preview'],
    queryProps: { monoId, monoType },
    enabled,
  })

export const useMonoPhotosQuery = ({
  enabled,
  limit = 24,
  monoId,
  monoType,
}: {
  enabled?: boolean
  limit?: number
  monoId: string
  monoType: MonoType
}) =>
  useInfinityQueryOptionalAuth({
    queryFn: getMonoPhotos,
    queryKey: ['mono-photos'],
    queryProps: { monoId, monoType },
    qFLimit: limit,
    enabled,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((sum, page) => sum + page.data.length, 0)
      return lastPage.data.length > 0 && nextOffset < lastPage.total ? nextOffset : undefined
    },
  })

export const useMonoPhotoQuery = ({
  enabled,
  monoId,
  monoType,
  photoId,
}: {
  enabled?: boolean
  monoId: string
  monoType: MonoType
  photoId: number
}) =>
  useAuthQuery({
    queryFn: getMonoPhoto,
    queryKey: ['mono-photo'],
    queryProps: { monoId, monoType, photoId },
    enabled,
  })

export const useMonoPhotoCommentsQuery = ({
  enabled,
  monoId,
  monoType,
  photoId,
}: {
  enabled?: boolean
  monoId: string
  monoType: MonoType
  photoId: number
}) =>
  useAuthQuery({
    queryFn: getMonoPhotoComments,
    queryKey: ['mono-photo-comments', monoType, monoId, photoId],
    queryProps: { monoId, monoType, photoId },
    enabled,
  })
