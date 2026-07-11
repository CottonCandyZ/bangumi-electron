import { BlogDetail } from '@renderer/modules/main/blog/detail'
import { useParams } from 'react-router-dom'

export function Component() {
  const { entryId } = useParams()
  return <BlogDetail entryId={Number(entryId)} />
}
