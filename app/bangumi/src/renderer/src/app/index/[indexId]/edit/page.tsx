import { EditIndexPage } from '@renderer/modules/main/catalog/editor'
import { useParams } from 'react-router-dom'

export function Component() {
  const { indexId } = useParams()
  return <EditIndexPage indexId={Number(indexId)} />
}
