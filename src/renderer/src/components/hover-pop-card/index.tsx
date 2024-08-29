import { cPopSizeByC } from '@renderer/components/hover-pop-card/utils'
import { cn } from '@renderer/lib/utils'
import {
  activeHoverPopCardAtom,
  hoverPopCardViewTransitionStatusAtom,
} from '@renderer/state/hover-pop-card'
import { HTMLMotionProps, motion } from 'framer-motion'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  createContext,
  FC,
  HTMLAttributes,
  PropsWithChildren,
  RefObject,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { flushSync } from 'react-dom'

const HoverPopCardContext = createContext<{
  hoverRef: RefObject<HTMLDivElement> | null
  layoutId: string
  activeId: string | null
  delay: number
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
  const activeId = useAtomValue(activeHoverPopCardAtom)

  return (
    <HoverPopCardContext.Provider
      value={{
        hoverRef,
        layoutId,
        activeId,
        delay,
      }}
    >
      <div key={layoutId} className={cn('relative', activeId === layoutId && 'z-30')}>
        {children}
      </div>
    </HoverPopCardContext.Provider>
  )
}

export const HoverCardContent: FC<PropsWithChildren<HTMLAttributes<HTMLDivElement>>> = ({
  children,
  className,
  ...props
}) => {
  const hoverCardContext = useContext(HoverPopCardContext)
  if (!hoverCardContext) throw Error('HoverCardContent need to be wrapped in HoverPopCard')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const setActiveId = useSetAtom(activeHoverPopCardAtom) // 全局 activeId 唯一
  const activeId = useAtomValue(activeHoverPopCardAtom)
  // const viewTransitionStatus = useViewTransitionStatusState((state) => state.status)
  const [viewTransitionStatus, setViewTransitionStatus] = useAtom(
    hoverPopCardViewTransitionStatusAtom,
  )

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current)
      setActiveId(null)
    }
  }, [])

  return (
    <div
      ref={hoverCardContext.hoverRef}
      className={cn(hoverCardContext.layoutId === activeId && 'invisible', className)}
      style={{
        viewTransitionName: viewTransitionStatus === hoverCardContext.layoutId ? 'pop-card' : '',
      }}
      onMouseEnter={() => {
        setActiveId(null)
        timeoutRef.current = setTimeout(() => {
          flushSync(() => setViewTransitionStatus(hoverCardContext.layoutId))
          document.startViewTransition(() => {
            flushSync(() => {
              setViewTransitionStatus(null)
              setActiveId(hoverCardContext.layoutId)
            })
          })
        }, hoverCardContext.delay)
      }}
      onMouseLeave={() => clearTimeout(timeoutRef.current)}
      {...props}
    >
      {children}
    </div>
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
    hoverCardContext.activeId === hoverCardContext.layoutId && (
      <PopCardInnerContent
        viewTransitionName="pop-card"
        hover={hoverCardContext.hoverRef?.current?.getBoundingClientRect()}
        className={className}
        {...props}
      >
        {children}
      </PopCardInnerContent>
    )
  )
}

export const PopCardInnerContent: FC<
  PropsWithChildren<HTMLMotionProps<'div'>> & {
    hover: DOMRect | undefined
    viewTransitionName: string
  }
> = ({ children, viewTransitionName, className, hover, ...props }) => {
  if (!hover) return
  const hoverRef = useRef(hover)
  const popRef = useRef<HTMLDivElement>(null)
  const [popCod, setPopCod] = useState({ top: 0, left: 0 })
  useLayoutEffect(() => {
    const pop = popRef.current!.getBoundingClientRect()
    const { topOffset, leftOffset } = cPopSizeByC(pop, hoverRef.current)
    // 这里如果用状态管理的话，第一次会有 bug
    popRef.current!.style.top = `${topOffset}px`
    popRef.current!.style.left = `${leftOffset}px`
    const ob = new ResizeObserver(() => {
      if (!popRef.current) return
      const pop = popRef.current!.getBoundingClientRect()
      const { topOffset, leftOffset } = cPopSizeByC(pop, hoverRef.current)
      setPopCod({ top: topOffset, left: leftOffset })
    })
    ob.observe(popRef.current!)
    return () => {
      popRef.current && ob.unobserve(popRef.current)
    }
  }, [])
  return (
    <motion.div
      layout
      ref={popRef}
      className={cn('absolute z-50', className)}
      style={{
        top: `${popCod.top}px`,
        left: `${popCod.left}px`,
        viewTransitionName,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const HoverCardItem: FC<
  PropsWithChildren<HTMLAttributes<HTMLDivElement> & { layoutId: string }>
> = ({ children, layoutId, className, ...props }) => {
  const hoverCardContext = useContext(HoverPopCardContext)
  if (!hoverCardContext) throw Error('HoverCardContent need to be wrapped in HoverPopCard')
  const viewTransitionStatus = useAtomValue(hoverPopCardViewTransitionStatusAtom)

  return (
    <div
      className={className}
      style={{
        viewTransitionName: viewTransitionStatus === hoverCardContext.layoutId ? layoutId : '',
      }}
      {...props}
    >
      {children}
    </div>
  )
}
