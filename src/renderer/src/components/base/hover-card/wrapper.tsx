import HoverEpisodeDetail from '@renderer/components/episodes/grid/hover-content'
import { hoverCardContentTypeAtom, hoverCardOpenAtom } from '@renderer/state/hover-card'
import { useAtomValue } from 'jotai'

export default function HoverCard() {
  const type = useAtomValue(hoverCardContentTypeAtom)
  const open = useAtomValue(hoverCardOpenAtom)
  return open && type === 'episode' && <HoverEpisodeDetail />
}
