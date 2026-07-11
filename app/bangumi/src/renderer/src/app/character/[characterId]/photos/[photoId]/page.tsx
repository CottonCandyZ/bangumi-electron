import { MonoPhotoDetail } from '@renderer/modules/main/mono/photo-detail'
import { useParams } from 'react-router-dom'

export function Component() {
  const { characterId, photoId } = useParams()
  return (
    <MonoPhotoDetail monoId={characterId ?? ''} monoType="character" photoId={Number(photoId)} />
  )
}
