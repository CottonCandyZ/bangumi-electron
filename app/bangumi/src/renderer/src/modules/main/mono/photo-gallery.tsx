import { MyLink } from '@renderer/components/my-link'
import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useMonoPhotosQuery } from '@renderer/data/hooks/api/photo'
import type { MonoType } from '@renderer/data/types/mono'
import { MonoPhotoTile, PHOTO_GRID_CLASS } from '@renderer/modules/main/mono/photo-preview'

export function MonoPhotoGallery({ monoId, monoType }: { monoId: string; monoType: MonoType }) {
  const query = useMonoPhotosQuery({ enabled: !!monoId, monoId, monoType })
  const photos = query.data?.pages.flatMap((page) => page.data)
  const title = monoType === 'person' ? '人物照片' : '角色照片'

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-10 py-8">
      <header>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          共 {query.data?.pages[0]?.total ?? 0} 张
        </p>
      </header>
      {query.isError ? (
        <p className="text-muted-foreground text-sm">暂时无法读取照片。</p>
      ) : !photos ? (
        <div className={PHOTO_GRID_CLASS}>
          {Array.from({ length: 10 }, (_, index) => (
            <Skeleton className="aspect-3/4 rounded-md" key={index} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <p className="text-muted-foreground text-sm">还没有照片。</p>
      ) : (
        <div className={PHOTO_GRID_CLASS}>
          {photos.map((photo) => (
            <MyLink
              className="group cursor-default"
              key={photo.id}
              title={photo.title || undefined}
              to={`/${monoType}/${monoId}/photos/${photo.id}`}
            >
              <MonoPhotoTile photo={photo} />
            </MyLink>
          ))}
        </div>
      )}
      {query.hasNextPage && (
        <Button
          className="self-center"
          disabled={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
          variant="outline"
        >
          {query.isFetchingNextPage ? '加载中…' : '加载更多'}
        </Button>
      )}
    </main>
  )
}
