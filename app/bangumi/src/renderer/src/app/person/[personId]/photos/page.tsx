import { MonoPhotoGallery } from '@renderer/modules/main/mono/photo-gallery'
import { useParams } from 'react-router-dom'

export function Component() {
  const { personId } = useParams()
  return <MonoPhotoGallery monoId={personId ?? ''} monoType="person" />
}
