import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useMonoPhotoPreviewQuery } from '@renderer/data/hooks/api/photo'
import type { MonoType } from '@renderer/data/types/mono'
import type { MonoPhoto } from '@renderer/data/types/photo'

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
          <Button className="text-muted-foreground" size="sm" variant="ghost">
            查看全部
            <i className="i-mingcute-right-line" />
          </Button>
        </MyLink>
      </div>
      <div className={PHOTO_GRID_CLASS}>
        {photos.map((photo) => (
          <MyLink
            className="group cursor-default"
            contextMenuTitle={photo.title || undefined}
            key={photo.id}
            state={{ sourceTitle }}
            title={photo.title || undefined}
            to={`/${monoType}/${monoId}/photos/${photo.id}`}
          >
            <MonoPhotoTile photo={photo} />
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
      <div className={PHOTO_GRID_CLASS}>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="aspect-3/4 rounded-md" key={index} />
        ))}
      </div>
    </section>
  )
}

/** 卡片宽度固定在一个范围里，照片少时不会被拉成整行的大方块 */
export const PHOTO_GRID_CLASS = 'grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3'

/**
 * 角色 / 人物照片多是竖长的立绘，grid 尺寸是站点裁好的低清方图，
 * 这里用 medium 竖向裁切并从顶部对齐，保证脸在画面里。
 */
export function MonoPhotoTile({ photo }: { photo: MonoPhoto }) {
  return (
    <Image
      className="bg-muted ring-border/60 group-hover:ring-primary/50 aspect-3/4 overflow-hidden rounded-md ring-1 transition-shadow"
      imageClassName="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
      imageSrc={photo.images.medium || photo.images.common || photo.images.grid}
    />
  )
}
