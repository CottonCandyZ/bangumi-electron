import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useMonoPhotoPreviewQuery } from '@renderer/data/hooks/api/photo'
import type { MonoType } from '@renderer/data/types/mono'

export function MonoPhotoPreview({
  monoId,
  monoType,
  sourceTitle,
}: {
  monoId: string
  monoType: MonoType
  sourceTitle: string
}) {
  const query = useMonoPhotoPreviewQuery({ enabled: !!monoId, monoId, monoType })
  const photos = query.data?.data
  if (query.isError || photos?.length === 0) return null
  if (!photos) return <MonoPhotoPreviewSkeleton />

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl font-medium">照片</h2>
          <span className="text-muted-foreground text-sm">{query.data?.total}</span>
        </div>
        <MyLink to={`/${monoType}/${monoId}/photos`}>
          <Button size="sm" variant="ghost">
            查看全部
          </Button>
        </MyLink>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {photos.map((photo) => (
          <MyLink
            key={photo.id}
            state={{ sourceTitle }}
            to={`/${monoType}/${monoId}/photos/${photo.id}`}
          >
            <Image
              className="aspect-square overflow-hidden rounded-lg border"
              imageClassName="h-full w-full object-cover"
              imageSrc={photo.images.grid || photo.images.medium}
            />
          </MyLink>
        ))}
      </div>
    </section>
  )
}

function MonoPhotoPreviewSkeleton() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-6" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="aspect-square" key={index} />
        ))}
      </div>
    </section>
  )
}
