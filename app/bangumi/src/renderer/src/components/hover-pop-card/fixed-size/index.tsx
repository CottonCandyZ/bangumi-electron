import { calculatePopCardPosition } from '@renderer/components/hover-pop-card/utils'
import { Card } from '@renderer/components/ui/card'
import { cn } from '@renderer/lib/utils'
import { activeHoverPopCardAtom } from '@renderer/state/hover-pop-card'
import { AnimatePresence, HTMLMotionProps, motion } from 'motion/react'
import { createPortal } from 'react-dom'
import { useAtomValue, useSetAtom } from 'jotai'
import { createContext, MutableRefObject, ReactNode, useContext, useEffect, useRef } from 'react'

const HoverPopCardContext = createContext<{
  layoutId: string
  activeId: string | null
  delay: number
  widthRatio: number
  heightRatio: number
  minHeight: number
  minWidth: number
  portal: boolean
  hoverInset: MutableRefObject<{
    left: number
    top: number
    height: number
    width: number
  }>
  isActive: (isActive: boolean) => void
} | null>(null)

import { FC, PropsWithChildren } from 'react'

type HoverPopCardProps = {
  layoutId: string
  delay?: number
  widthRatio?: number
  heightRatio?: number
  minHeight?: number
  minWidth?: number
  portal?: boolean
  isActive?: (isActive: boolean) => void
}

export const HoverPopCard: FC<PropsWithChildren<HoverPopCardProps>> = ({
  layoutId,
  children,
  delay = 700,
  widthRatio = 2,
  heightRatio = 1.05,
  minHeight = 270,
  minWidth = 150,
  portal = false,
  isActive = () => {},
}) => {
  const activeId = useAtomValue(activeHoverPopCardAtom)
  const hoverInset = useRef({ left: 0, top: 0, height: 0, width: 0 })

  return (
    <HoverPopCardContext.Provider
      value={{
        layoutId,
        activeId,
        delay,
        widthRatio,
        heightRatio,
        minHeight,
        minWidth,
        portal,
        hoverInset,
        isActive,
      }}
    >
      <div className="relative">{children}</div>
    </HoverPopCardContext.Provider>
  )
}

export const HoverCardContent: FC<
  PropsWithChildren<HTMLMotionProps<'div'> & { CardContent: ReactNode; Description?: ReactNode }>
> = ({ CardContent, Description = null, className, ...props }) => {
  const hoverCardContext = useContext(HoverPopCardContext)
  if (!hoverCardContext) throw Error('HoverCardContent need to be wrapped in HoverPopCard')
  const {
    layoutId,
    delay,
    widthRatio,
    heightRatio,
    minHeight,
    minWidth,
    hoverInset,
    isActive,
    activeId,
    portal,
  } = hoverCardContext
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const setActiveId = useSetAtom(activeHoverPopCardAtom)
  const hoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current)
      setActiveId(null)
    }
  }, [setActiveId])

  return (
    <motion.div key={layoutId} layoutId={layoutId} ref={hoverRef} className={className} {...props}>
      <Card
        className="relative overflow-hidden border-none hover:-translate-x-0 hover:-translate-y-0.5 hover:shadow-xl hover:duration-700"
        onMouseOver={() => {
          if (activeId === layoutId) return
          setActiveId(null)
          timeoutRef.current = setTimeout(() => {
            if (!hoverRef.current) return
            const bounding = hoverRef.current.getBoundingClientRect()
            hoverInset.current = calculatePopCardPosition(
              bounding,
              {
                widthRatio,
                heightRatio,
                minHeight,
                minWidth,
              },
              undefined,
              portal,
            )
            isActive(true)
            setActiveId(layoutId)
          }, delay)
        }}
        onMouseOut={() => clearTimeout(timeoutRef.current)}
      >
        {CardContent}
      </Card>
      {Description}
    </motion.div>
  )
}

export const PopCardContent: FC<PropsWithChildren<HTMLMotionProps<'div'>>> = ({
  children,
  className,
  ...props
}) => {
  const hoverCardContext = useContext(HoverPopCardContext)
  if (!hoverCardContext) throw Error('HoverCardContent need to be wrapped in HoverPopCard')
  const { layoutId, activeId, hoverInset, isActive, portal } = hoverCardContext
  const setActiveId = useSetAtom(activeHoverPopCardAtom)
  const popRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!portal || activeId !== layoutId) return
    const dismiss = (event: Event) => {
      if (event.target instanceof Node && popRef.current?.contains(event.target)) return
      setActiveId(null)
    }
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    return () => {
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
    }
  }, [portal, activeId, layoutId, setActiveId])
  const content = (
    <AnimatePresence onExitComplete={() => isActive(false)}>
      {activeId === layoutId && (
        <motion.div
          ref={popRef}
          key={layoutId}
          layoutId={layoutId}
          className={cn(
            portal ? 'fixed z-40 cursor-default' : 'absolute z-10 cursor-default',
            className,
          )}
          style={{
            left: `${hoverInset.current.left}px`,
            top: `${hoverInset.current.top}px`,
            height: `${hoverInset.current.height}px`,
            width: `${hoverInset.current.width}px`,
          }}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
  return portal ? createPortal(content, document.body) : content
}
