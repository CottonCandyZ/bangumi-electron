import { calculatePopSizePosition } from '@renderer/components/hover-pop-card/utils'
import { cn } from '@renderer/lib/utils'
import { activeHoverPopCardAtom } from '@renderer/state/hover-pop-card'
import { AnimatePresence, HTMLMotionProps, motion } from 'motion/react'
import { useAtomValue, useSetAtom } from 'jotai'
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
  hoverRef: React.RefObject<HTMLDivElement | null>
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
  const hoverRef = useRef<HTMLDivElement | null>(null)
  const activeId = useAtomValue(activeHoverPopCardAtom)
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
      <div
        key={layoutId}
        className={cn('relative z-30', (activeId === layoutId || !finished) && 'z-40')}
      >
        {children}
      </div>
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
  const setActiveId = useSetAtom(activeHoverPopCardAtom) // 全局 activeId 唯一

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current)
      setActiveId(null)
    }
  }, [setActiveId])

  return (
    <motion.div
      key={hoverCardContext.layoutId}
      ref={hoverCardContext.hoverRef}
      layoutId={hoverCardContext.layoutId}
      className={cn(
        hoverCardContext.activeId === hoverCardContext.layoutId && 'opacity-0',
        className,
      )}
      onMouseEnter={() => {
        setActiveId(null)
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
  const [popCod, setPopCod] = useState({ top: 0, left: 0, right: 0, bottom: 0 })
  const popRef = useRef<HTMLDivElement>(null)
  const timeOutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useLayoutEffect(() => {
    if (!popRef.current) return
    const pop = popRef.current.getBoundingClientRect()
    setPopCod(calculatePopSizePosition(pop, hoverRef.current))
    const ob = new ResizeObserver(() => {
      if (!popRef.current) return
      const pop = popRef.current.getBoundingClientRect()
      setPopCod(calculatePopSizePosition(pop, hoverRef.current))
    })
    timeOutRef.current = setTimeout(() => {
      if (popRef.current) ob.observe(popRef.current)
    }, 500)
    return () => {
      clearTimeout(timeOutRef.current)
      ob.disconnect()
    }
  }, [])
  return (
    <motion.div
      layoutId={layoutId}
      className={cn('absolute z-50 overflow-hidden', className)}
      style={{
        top: `${popCod.top}px`,
        left: `${popCod.left}px`,
        right: `${popCod.right}px`,
        bottom: `${popCod.bottom}px`,
      }}
      {...props}
    >
      <div ref={popRef}>{children}</div>
    </motion.div>
  )
}
