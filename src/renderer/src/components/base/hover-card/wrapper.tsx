import HoverEpisodeDetail from '@renderer/components/episodes/grid/hover-content'
import { hoverCardEpisodeContentAtom, hoverCardOpenAtom } from '@renderer/state/hover-card'
import { useAtomValue } from 'jotai'

export default function HoverCard() {
  const content = useAtomValue(hoverCardEpisodeContentAtom)
  const open = useAtomValue(hoverCardOpenAtom)
  return open && content !== null && content.id === 'episode-content' && <HoverEpisodeDetail />
}
