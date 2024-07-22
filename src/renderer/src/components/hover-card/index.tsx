import { useActiveHoverCard } from '@renderer/components/hover-card/state'
import { cPopSizeByC } from '@renderer/components/hover-card/utils'
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
  activeId: string | null
  finished: boolean
  delay: number
  setFinished: React.Dispatch<React.SetStateAction<boolean>>
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
  const activeId = useActiveHoverCard((state) => state.activeId)
  const [finished, setFinished] = useState(true)

  return (
    <HoverPopCardContext.Provider
      value={{
        hoverRef,
        layoutId,
        activeId,
        finished,
        delay,
        setFinished,
      }}
    >
      <div className={cn('relative', activeId === layoutId && 'z-30')}>{children}</div>
    </HoverPopCardContext.Provider>
  )
}

export const HoverCardContent: FC<PropsWithChildren<HTMLMotionProps<'div'>>> = ({
  children,
  className,
  ...props
}) => {
  const hoverCardContext = useContext(HoverPopCardContext)
  if (!hoverCardContext) throw Error('HoverCardContent need to be wrapped in HoverPopCard')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const setActiveId = useActiveHoverCard((state) => state.setActiveId) // 全局 activeId 唯一

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current)
      setActiveId(null)
    }
  }, [])

  return (
    <motion.div
      ref={hoverCardContext.hoverRef}
      layoutId={hoverCardContext.layoutId}
      className={className}
      onMouseEnter={() => {
        timeoutRef.current = setTimeout(() => {
          setActiveId(hoverCardContext.layoutId)
          hoverCardContext.setFinished(false)
        }, hoverCardContext.delay)
      }}
      onMouseLeave={() => clearTimeout(timeoutRef.current)}
      transition={{
        duration:
          hoverCardContext.activeId !== hoverCardContext.layoutId && hoverCardContext.finished
            ? 0
            : undefined,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const PopCardContent: FC<PropsWithChildren<HTMLMotionProps<'div'>>> = ({
  children,
  className,
  ...props
}) => {
  const hoverCardContext = useContext(HoverPopCardContext)
  if (!hoverCardContext) throw Error('PopCardContent need to be wrapped in HoverPopCard')

  return (
    <AnimatePresence onExitComplete={() => hoverCardContext.setFinished(true)}>
      {hoverCardContext.activeId === hoverCardContext.layoutId && (
        <PopCardInnerContent
          layoutId={hoverCardContext.layoutId}
          hover={hoverCardContext.hoverRef?.current?.getBoundingClientRect()}
          className={className}
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
  }
> = ({ children, layoutId, className, hover, ...props }) => {
  if (!hover) throw Error('PopCardContent need to be aside HoverCardContent')
  const hoverRef = useRef(hover)
  const [popCod, setPopCod] = useState({ top: 0, left: 0 })
  const popRef = useRef<HTMLDivElement>(null)
  const timeOutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useLayoutEffect(() => {
    const pop = popRef.current!.getBoundingClientRect()
    const { topOffset, leftOffset } = cPopSizeByC(pop, hoverRef.current)
    setPopCod({ top: topOffset, left: leftOffset })
    const ob = new ResizeObserver(() => {
      if (!popRef.current) return
      const pop = popRef.current!.getBoundingClientRect()
      const { topOffset, leftOffset } = cPopSizeByC(pop, hoverRef.current)
      setPopCod({ top: topOffset, left: leftOffset })
    })
    timeOutRef.current = setTimeout(() => {
      ob.observe(popRef.current!)
    }, 400)
    return () => {
      clearTimeout(timeOutRef.current)
      popRef.current && ob.unobserve(popRef.current)
    }
  }, [])
  return (
    <motion.div
      layoutId={layoutId}
      ref={popRef}
      className={cn('absolute z-10', className)}
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
