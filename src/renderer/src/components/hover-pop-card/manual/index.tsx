import { calculatePopSizePosition } from '@renderer/components/hover-pop-card/utils'
import { cn } from '@renderer/lib/utils'
import { activeHoverPopCardAtom } from '@renderer/state/hover-pop-card'
import { animate } from 'framer-motion'
import { useAtomValue, useSetAtom } from 'jotai'
import {
  createContext,
  FC,
  HTMLProps,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

const HoverPopCardContext = createContext<{
  layoutId: string
  delay: number
  isActive: boolean
  isAnimate: boolean
  setIsAnimate: React.Dispatch<React.SetStateAction<boolean>>
  setBox: React.Dispatch<React.SetStateAction<Record<'height' | 'width', string | 'auto'>>>
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
  const activeId = useAtomValue(activeHoverPopCardAtom)
  const isActive = activeId === layoutId
  const [isAnimate, setIsAnimate] = useState(false)
  const [box, setBox] = useState<Record<'height' | 'width', 'auto' | string>>({
    height: 'auto',
    width: 'auto',
  })

  return (
    <HoverPopCardContext.Provider
      value={{
        layoutId,
        isActive,
        delay,
        isAnimate,
        setIsAnimate,
        setBox,
      }}
    >
      <div className={cn('relative z-30', (isActive || isAnimate) && 'z-40')} style={{ ...box }}>
        {children}
      </div>
    </HoverPopCardContext.Provider>
  )
}

import React, { forwardRef } from 'react'

export const HoverCardContent = forwardRef<HTMLDivElement, HTMLProps<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  },
)
HoverCardContent.displayName = 'HoverCardContent'

export const PopCardContent = forwardRef<HTMLDivElement, HTMLProps<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  },
)
PopCardContent.displayName = 'PopCardContent'

type HoverCardWrapperProps = HTMLProps<HTMLDivElement> & {
  hoverContent: React.ReactNode
  popContent: React.ReactNode
}

export const HoverCardWrapper: FC<HoverCardWrapperProps> = ({
  className,
  hoverContent,
  popContent,
  ...props
}) => {
  const hoverCardContext = useContext(HoverPopCardContext)
  if (!hoverCardContext) throw Error('HoverCardWrapper needs to be wrapped in HoverPopCard')
  const { layoutId, isActive, delay, setBox, isAnimate, setIsAnimate } = hoverCardContext
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const popRef = useRef<HTMLDivElement>(null)
  const hoverSizeRef = useRef<DOMRect | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const hoverRef = useRef<HTMLDivElement>(null)
  const [hoverBox, setHoverBox] = useState<Record<'height' | 'width', string | 'auto'>>({
    height: 'auto',
    width: 'auto',
  })

  const setActiveId = useSetAtom(activeHoverPopCardAtom)
  const preActive = useRef(isActive)

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current)
      setActiveId(null)
    }
  }, [setActiveId])

  useEffect(() => {
    if (!wrapperRef.current) return
    let ob: ResizeObserver | undefined
    // 展开
    if (!preActive.current && isActive && hoverSizeRef.current && popRef.current) {
      ob = new ResizeObserver(() => {
        if (!wrapperRef.current || !hoverSizeRef.current || !popRef.current) return
        animate(
          wrapperRef.current,
          {
            ...calculatePopSizePosition(
              popRef.current.getBoundingClientRect(),
              hoverSizeRef.current,
            ),
            boxShadow:
              'rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.1) 0px 8px 10px -6px',
          },
          {
            ease: [0.165, 0.84, 0.44, 1.0],
          },
        )
      })
      ob.observe(popRef.current)
    }
    // 收起
    if (preActive.current && !isActive) {
      ob?.disconnect()
      animate(
        wrapperRef.current,
        {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          boxShadow: '0px 0px 0px rgba(0, 0, 0, 0)',
        },
        {
          ease: [0.165, 0.84, 0.44, 1.0],
        },
      ).then(() => {
        setIsAnimate(false)
        setBox({ height: 'auto', width: 'auto' })
        setHoverBox({ height: 'auto', width: 'auto' })
      })
    }
    preActive.current = isActive
  }, [isActive, setBox, setIsAnimate])

  return (
    <div
      ref={wrapperRef}
      className={cn(
        isAnimate
          ? 'absolute'
          : 'h-full hover:-translate-y-0.5 hover:!shadow-xl hover:duration-700',
        'inset-0 overflow-hidden',
        isActive && 'z-10',
        className,
      )}
      onMouseLeave={() => {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = undefined
      }}
      {...props}
    >
      {isActive ? (
        <PopCardContent ref={popRef} className="w-max">
          {popContent}
        </PopCardContent>
      ) : (
        <HoverCardContent
          ref={hoverRef}
          style={{ height: hoverBox.height, width: hoverBox.width }}
          onMouseEnter={() => {
            setActiveId(null)
            timeoutRef.current = setTimeout(() => {
              if (!hoverRef.current || !wrapperRef.current) return
              const { x, y, width, height } = wrapperRef.current.getBoundingClientRect()

              // 弹起之前设定父元素的宽高
              setBox({ height: `${height}px`, width: `${width}px` })
              const { width: hoverWidth, height: hoverHeight } =
                hoverRef.current.getBoundingClientRect()
              hoverSizeRef.current = new DOMRect(x, y, width, height)
              setHoverBox({ height: `${hoverHeight}px`, width: `${hoverWidth}px` })

              // 开始动画
              setIsAnimate(true)
              setActiveId(layoutId)
            }, delay)
          }}
        >
          {hoverContent}
        </HoverCardContent>
      )}
    </div>
  )
}
