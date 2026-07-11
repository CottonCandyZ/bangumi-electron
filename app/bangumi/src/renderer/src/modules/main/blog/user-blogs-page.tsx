import { MyLink } from '@renderer/components/my-link'
import { usePageScrollRestoreReady } from '@renderer/components/scroll/page-scroll-wrapper'
import { Button } from '@renderer/components/ui/button'
import { UserBlogList } from './blog-list'

export function UserBlogsPage({ username }: { username: string | undefined }) {
  usePageScrollRestoreReady(!!username)

  if (!username) return <p className="text-muted-foreground p-10 text-sm">缺少用户名。</p>

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-10 py-8">
      <header className="flex items-center gap-3">
        <MyLink to={`/user/${encodeURIComponent(username)}`}>
          <Button aria-label="返回用户页" size="icon" variant="ghost">
            <span className="i-mingcute-left-line text-lg" />
          </Button>
        </MyLink>
        <div>
          <h1 className="text-3xl font-semibold">日志</h1>
          <p className="text-muted-foreground mt-1 text-sm">@{username}</p>
        </div>
      </header>
      <UserBlogList username={username} />
    </main>
  )
}
