import { IndexDetail } from '@renderer/modules/main/catalog'
import { useParams } from 'react-router-dom'

export function Component() {
  const { indexId } = useParams()

  return <IndexDetail indexId={Number(indexId)} />
}
