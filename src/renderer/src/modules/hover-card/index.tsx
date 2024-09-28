import { HoverEpisodeDetail } from '@renderer/modules/common/episodes/grid/hover-content'
import { hoverCardEpisodeContentAtom, hoverCardOpenAtom } from '@renderer/state/hover-card'
import { AnimatePresence } from 'framer-motion'
import { useAtomValue } from 'jotai'

export function HoverCard() {
  const content = useAtomValue(hoverCardEpisodeContentAtom)
  const open = useAtomValue(hoverCardOpenAtom)
  return (
    <AnimatePresence>
      {open && content !== null && content.id === 'episode-content' && <HoverEpisodeDetail />}
    </AnimatePresence>
  )
}
