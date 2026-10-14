import { HoverEpisodeDetail } from '@renderer/modules/common/episodes/grid/hover-content'
import {
  closeHoverCardImmediatelyAtomAction,
  hoverCardEpisodeContentAtom,
  hoverCardOpenAtom,
} from '@renderer/state/hover-card'
import { AnimatePresence } from 'motion/react'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export function HoverCard() {
  const content = useAtomValue(hoverCardEpisodeContentAtom)
  const open = useAtomValue(hoverCardOpenAtom)
  const closeImmediately = useSetAtom(closeHoverCardImmediatelyAtomAction)
  const { pathname } = useLocation()
  const previousPathnameRef = useRef(pathname)

  // 路由切换时统一关闭（代替每个 trigger 各自监听路由）
  useEffect(() => {
    if (previousPathnameRef.current === pathname) return
    previousPathnameRef.current = pathname
    closeImmediately()
  }, [closeImmediately, pathname])

  return (
    <AnimatePresence>
      {open && content !== null && content.id === 'episode-content' && (
        <HoverEpisodeDetail content={content} />
      )}
    </AnimatePresence>
  )
}
