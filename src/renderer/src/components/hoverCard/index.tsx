import { useActiveHoverCard } from '@renderer/components/hoverCard/state'
import { cPopSizeByC } from '@renderer/components/hoverCard/utils'
import { cn } from '@renderer/lib/utils'
import { AnimatePresence, HTMLMotionProps, motion } from 'framer-motion'
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

const HoverPopCardContext = createContext<{
  hoverRef: React.RefObject<HTMLDivElement> | null
  layoutId: string
  timeoutRef: React.MutableRefObject<NodeJS.Timeout | undefined>
  delay: number
  setActiveId: (activeId: string | null) => void
  activeId: string | null
} | null>(null)

type HoverCardProps = {
  layoutId: string
  delay?: number
}

export const HoverPopCard: FC<PropsWithChildren<HoverCardProps>> = ({
  children,
  layoutId,
  delay = 700,
}) => {
  const hoverRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const setActiveId = useActiveHoverCard((state) => state.setActiveId) // 全局 activeId 唯一
  const activeId = useActiveHoverCard((state) => state.activeId)

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current)
      setActiveId(null)
    }
  }, [])

  return (
    <HoverPopCardContext.Provider
      value={{
        hoverRef,
        layoutId,
        timeoutRef,
        delay,
        activeId,
        setActiveId
      }}
    >
      <div className="relative">{children}</div>
    </HoverPopCardContext.Provider>
  )
}

export const HoverCardContent: FC<
  PropsWithChildren<HTMLMotionProps<'div'> & { mouseEnterCallBack?: () => void }>
> = ({ children, className, mouseEnterCallBack, ...props }) => {
  const hoverCardContext = useContext(HoverPopCardContext)
  if (!hoverCardContext) throw Error('HoverCardContent need to be wrapped in HoverPopCard')

  return (
    <motion.div
      ref={hoverCardContext.hoverRef}
      layoutId={hoverCardContext.layoutId}
      className={className}
      onMouseEnter={() => {
        hoverCardContext.setActiveId(null)
        hoverCardContext.timeoutRef.current = setTimeout(() => {
          hoverCardContext.setActiveId(hoverCardContext.layoutId)
          mouseEnterCallBack && mouseEnterCallBack()
        }, hoverCardContext.delay)
      }}
      onMouseLeave={() => clearTimeout(hoverCardContext.timeoutRef.current)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const PopCardContent: FC<
  PropsWithChildren<HTMLMotionProps<'div'> & { updateDeps?: boolean[] }>
> = ({ children, className, updateDeps, ...props }) => {
  const hoverCardContext = useContext(HoverPopCardContext)
  if (!hoverCardContext) throw Error('PopCardContent need to be wrapped in HoverPopCard')

  return (
    <AnimatePresence>
      {hoverCardContext.activeId === hoverCardContext.layoutId && (
        <PopCardInnerContent
          layoutId={hoverCardContext.layoutId}
          hover={hoverCardContext.hoverRef?.current?.getBoundingClientRect()}
          className={className}
          updateDeps={updateDeps}
          {...props}
        >
          {children}
        </PopCardInnerContent>
      )}
    </AnimatePresence>
  )
}

export const PopCardInnerContent: FC<
  PropsWithChildren<HTMLMotionProps<'div'>> & {
    hover: DOMRect | undefined
    layoutId: string
    updateDeps?: boolean[]
  }
> = ({ children, layoutId, className, hover, updateDeps, ...props }) => {
  if (!hover) throw Error('PopCardContent need to be aside HoverCardContent')
  const hoverRef = useRef(hover)
  const [popCod, setPopCod] = useState({ top: 0, left: 0 })
  const popRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const pop = popRef.current!.getBoundingClientRect()
    const { topOffset, leftOffset } = cPopSizeByC(pop, hoverRef.current)
    setPopCod({ top: topOffset, left: leftOffset })
  }, [])
  useEffect(() => {
    if (updateDeps != undefined && updateDeps.some((item) => item)) {
      const pop = popRef.current!.getBoundingClientRect()
      const { topOffset, leftOffset } = cPopSizeByC(pop, hoverRef.current)
      setPopCod({ top: topOffset, left: leftOffset })
    }
  }, updateDeps)
  return (
    <motion.div
      layoutId={layoutId}
      ref={popRef}
      className={cn('absolute z-30', className)}
      style={{
        top: `${popCod.top}px`,
        left: `${popCod.left}px`,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
