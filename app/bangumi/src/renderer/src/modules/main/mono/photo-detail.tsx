import { CommentBox, CommentSkeleton } from '@renderer/components/comment/comment-box'
import { Image } from '@renderer/components/image/image'
import { usePageScrollRestoreReady } from '@renderer/components/scroll/page-scroll-wrapper'
import { Badge } from '@renderer/components/ui/badge'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useMonoPhotoCommentsQuery, useMonoPhotoQuery } from '@renderer/data/hooks/api/photo'
import type { MonoType } from '@renderer/data/types/mono'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import dayjs from 'dayjs'

export function MonoPhotoDetail({
  monoId,
  monoType,
  photoId,
}: {
  monoId: string
  monoType: MonoType
  photoId: number
}) {
  const enabled = !!monoId && Number.isInteger(photoId) && photoId > 0
  const photoQuery = useMonoPhotoQuery({ enabled, monoId, monoType, photoId })
  const commentsQuery = useMonoPhotoCommentsQuery({ enabled, monoId, monoType, photoId })
  const photo = photoQuery.data
  const replyTarget = {
    id: photoId,
    monoId,
    title: photo?.title,
    type: monoType === 'person' ? 'person-photo' : 'character-photo',
  } as const

  usePageScrollRestoreReady(!enabled || !photoQuery.isPending || photoQuery.isError)

  if (!enabled || photoQuery.isError)
    return <p className="text-muted-foreground p-10 text-center text-sm">暂时无法读取照片。</p>
  if (!photo) return <MonoPhotoDetailSkeleton />

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-7 px-10 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{photo.title || '照片'}</h1>
        <time
          className="text-muted-foreground text-xs"
          dateTime={dayjs.unix(photo.createdAt).toISOString()}
        >
          {dayjs.unix(photo.createdAt).format('YYYY-MM-DD HH:mm')}
        </time>
      </header>
      <Image
        className="bg-muted/20 mx-auto max-h-[70vh] max-w-full overflow-hidden rounded-lg border"
        imageClassName="max-h-[70vh] w-auto max-w-full object-contain"
        imageSrc={photo.images.large || photo.target}
      />
      {photo.comment && (
        <div className="bbcode text-sm leading-7">{renderBBCode(photo.comment)}</div>
      )}
      {photo.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {photo.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <CommentBox
        comments={commentsQuery.data}
        error={commentsQuery.isError}
        replyTarget={replyTarget}
        title="评论"
        virtual={false}
      />
    </main>
  )
}

function MonoPhotoDetailSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-7 px-10 py-8">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-32" />
      </header>
      <Skeleton className="mx-auto h-[min(60vh,38rem)] w-full max-w-3xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <section className="flex flex-col gap-5">
        <Skeleton className="h-8 w-24" />
        {Array.from({ length: 3 }, (_, index) => (
          <CommentSkeleton key={index} />
        ))}
      </section>
    </main>
  )
}
