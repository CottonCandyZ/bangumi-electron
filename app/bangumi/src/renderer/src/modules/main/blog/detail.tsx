import { CommentBox, CommentSkeleton } from '@renderer/components/comment/comment-box'
import { BBCodeImage, BBCodeImagePreviewProvider } from '@renderer/components/comment/bbcode-image'
import { MyLink } from '@renderer/components/my-link'
import { usePageScrollRestoreReady } from '@renderer/components/scroll/page-scroll-wrapper'
import { Badge } from '@renderer/components/ui/badge'
import { Card } from '@renderer/components/ui/card'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { ReportButton } from '@renderer/components/report-button'
import {
  useBlogCommentsQuery,
  useBlogPhotosQuery,
  useBlogQuery,
  useBlogSubjectsQuery,
} from '@renderer/data/hooks/api/blog'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import { MainCommentFab } from '@renderer/modules/main/comment-fab'
import { blogTitleInViewAtom } from '@renderer/state/in-view'
import dayjs from 'dayjs'
import { useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'

export function BlogDetail({ entryId }: { entryId: number }) {
  const enabled = Number.isInteger(entryId) && entryId > 0
  const blogQuery = useBlogQuery({ enabled, entryId })
  const photosQuery = useBlogPhotosQuery({ enabled, entryId })
  const subjectsQuery = useBlogSubjectsQuery({ enabled, entryId })
  const commentsQuery = useBlogCommentsQuery({ enabled, entryId })
  const blog = blogQuery.data
  const replyTarget = { id: entryId, type: 'blog' } as const
  const setTitleInView = useSetAtom(blogTitleInViewAtom)
  const { ref: titleRef, inView: titleInView } = useInView({
    initialInView: true,
    threshold: 0,
  })
  usePageScrollRestoreReady(!blogQuery.isPending || blogQuery.isError)

  useEffect(() => {
    setTitleInView(titleInView)
  }, [entryId, setTitleInView, titleInView])

  useEffect(
    () => () => {
      setTitleInView(true)
    },
    [entryId, setTitleInView],
  )

  if (!enabled || blogQuery.isError) {
    return <p className="text-muted-foreground p-10 text-center text-sm">暂时无法读取这篇日志。</p>
  }
  if (!blog) return <BlogDetailSkeleton />

  return (
    <>
      <article className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-10 py-8">
        <header className="flex flex-col gap-3 border-b pb-6">
          <h1 className="text-3xl leading-tight font-semibold" ref={titleRef}>
            {blog.title}
          </h1>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <MyLink
              className="hover:text-primary"
              to={`/user/${encodeURIComponent(blog.user.username)}`}
            >
              {blog.user.nickname || blog.user.username}
            </MyLink>
            <span>·</span>
            <time dateTime={dayjs.unix(blog.createdAt).toISOString()}>
              {dayjs.unix(blog.createdAt).format('YYYY-MM-DD HH:mm')}
            </time>
            <span>·</span>
            <span>{blog.views} 浏览</span>
          </div>
          <div>
            <ReportButton id={entryId} type={14} />
          </div>
          {blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {blog.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </header>

        <BBCodeImagePreviewProvider>
          <div className="bbcode text-sm leading-7 whitespace-pre-line">
            {renderBBCode(blog.content)}
          </div>

          {(photosQuery.data?.data.length ?? 0) > 0 && (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {photosQuery.data!.data.map((photo) => (
                <BBCodeImage alt={blog.title} key={photo.id} src={photo.icon} />
              ))}
            </section>
          )}
        </BBCodeImagePreviewProvider>

        {(subjectsQuery.data?.length ?? 0) > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">关联条目</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {subjectsQuery.data!.map((subject) => (
                <MyLink key={subject.id} to={`/subject/${subject.id}`}>
                  <Card className="hover:bg-accent p-3 shadow-none transition-colors">
                    {subject.nameCN || subject.name}
                  </Card>
                </MyLink>
              ))}
            </div>
          </section>
        )}

        <CommentBox
          comments={commentsQuery.data}
          error={commentsQuery.isError}
          replyTarget={replyTarget}
          showReplyEntry={false}
          title="评论"
          titleCount={blog.replies}
          virtual={false}
        />
      </article>
      <MainCommentFab replyTarget={replyTarget} />
    </>
  )
}

function BlogDetailSkeleton() {
  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-10 py-8">
      <header className="flex flex-col gap-3 border-b pb-6">
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-8 w-20" />
        <div className="flex gap-1.5">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </header>
      <section className="flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
      </section>
      <section className="flex flex-col gap-5">
        <Skeleton className="h-8 w-24" />
        {Array.from({ length: 4 }, (_, index) => (
          <CommentSkeleton key={index} />
        ))}
      </section>
    </article>
  )
}
