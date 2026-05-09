import { MonoContent } from '@renderer/modules/main/mono/content'
import { useParams } from 'react-router-dom'

export function Component() {
  const personId = useParams().personId
  if (!personId) throw Error('Get Params Error')

  return <MonoContent monoType="person" monoId={personId} />
}
