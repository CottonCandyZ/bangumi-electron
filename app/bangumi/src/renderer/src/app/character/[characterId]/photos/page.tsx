import { MonoPhotoGallery } from '@renderer/modules/main/mono/photo-gallery'
import { useParams } from 'react-router-dom'

export function Component() {
  const { characterId } = useParams()
  return <MonoPhotoGallery monoId={characterId ?? ''} monoType="character" />
}
