import { HoverEpisodeDetail } from '@renderer/modules/episodes/grid/hover-content'
import { hoverCardEpisodeContentAtom, hoverCardOpenAtom } from '@renderer/state/hover-card'
import { useAtomValue } from 'jotai'

export function HoverCard() {
  const content = useAtomValue(hoverCardEpisodeContentAtom)
  const open = useAtomValue(hoverCardOpenAtom)
  return open && content !== null && content.id === 'episode-content' && <HoverEpisodeDetail />
}
