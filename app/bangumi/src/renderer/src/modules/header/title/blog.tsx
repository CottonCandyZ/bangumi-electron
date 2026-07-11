import { useBlogQuery } from '@renderer/data/hooks/api/blog'
import { StaticHeaderTitle } from '@renderer/modules/header/title/static'
import { blogTitleInViewAtom } from '@renderer/state/in-view'
import { useAtomValue } from 'jotai'

export function BlogHeaderTitle({ entryId }: { entryId: number }) {
  const query = useBlogQuery({ enabled: Number.isInteger(entryId) && entryId > 0, entryId })
  const titleInView = useAtomValue(blogTitleInViewAtom)
  const blog = query.data

  if (!blog) return null

  return (
    <StaticHeaderTitle
      image={blog.icon}
      imageFallback="日"
      name={blog.user.nickname || blog.user.username}
      nameCn={blog.title}
      presenceKey={`blog-${entryId}`}
      visible={!titleInView}
    />
  )
}
