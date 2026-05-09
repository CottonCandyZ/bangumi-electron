import { MonoContent } from '@renderer/modules/main/mono/content'
import { useParams } from 'react-router-dom'

export function Component() {
  const characterId = useParams().characterId
  if (!characterId) throw Error('Get Params Error')

  return <MonoContent monoType="character" monoId={characterId} />
}
