import { MonoPhotoDetail } from '@renderer/modules/main/mono/photo-detail'
import { useParams } from 'react-router-dom'

export function Component() {
  const { personId, photoId } = useParams()
  return <MonoPhotoDetail monoId={personId ?? ''} monoType="person" photoId={Number(photoId)} />
}
