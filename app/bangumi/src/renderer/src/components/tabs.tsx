import { cn } from '@renderer/lib/utils'
import { type ReactNode, useLayoutEffect, useRef } from 'react'

type TabsOnlyProps = {
  currentSelect: string
  setCurrentSelect: (id: string, value: string) => void
  tabsContent: Set<string>
  /** 标签组 id，也作为 setCurrentSelect 的第一个参数 */
  layoutId: string
  className?: string
  tabClassName?: string
  renderTab?: (value: string) => ReactNode
  getTabLabel?: (value: string) => string
  'aria-label'?: string
  /** pill：带底色的分段控件；underline：纯文字 + 下划线指示，适合放在区块标题旁 */
  variant?: 'pill' | 'underline'
}

const INDICATOR_ANIMATION: KeyframeAnimationOptions = {
  duration: 260,
  easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
}

/**
 * 指示器直接渲染在当前选中的按钮里，不使用 motion 的 layoutId：
 * layoutId 节点在卸载时会强制测量布局，路由切换（view transition）时会造成明显卡顿。
 * 只有用户点击切换时才用 FLIP 做一次滑动动画。
 */
export function Tabs({
  currentSelect,
  setCurrentSelect,
  tabsContent,
  className,
  layoutId,
  tabClassName,
  renderTab,
  getTabLabel,
  'aria-label': ariaLabel,
  variant = 'pill',
}: TabsOnlyProps) {
  const underline = variant === 'underline'
  const indicatorRef = useRef<HTMLDivElement>(null)
  const previousRectRef = useRef<DOMRect | null>(null)

  useLayoutEffect(() => {
    const previous = previousRectRef.current
    const indicator = indicatorRef.current
    previousRectRef.current = null
    if (!previous || !indicator) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const next = indicator.getBoundingClientRect()
    if (next.width === 0 || next.height === 0) return
    const dx = previous.left - next.left
    const dy = previous.top - next.top
    const sx = previous.width / next.width
    const sy = previous.height / next.height
    indicator.animate(
      [
        {
          transformOrigin: 'top left',
          transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
        },
        { transformOrigin: 'top left', transform: 'none' },
      ],
      INDICATOR_ANIMATION,
    )
  }, [currentSelect])

  return (
    <div
      className={cn(
        'text-muted-foreground inline-flex flex-wrap items-center',
        underline
          ? 'justify-end gap-x-4 gap-y-1'
          : 'bg-muted min-h-8 justify-center rounded-lg p-1',
        className,
      )}
      role="group"
      aria-label={ariaLabel}
    >
      {[...tabsContent].map((item) => {
        const active = item === currentSelect
        return (
          <button
            className={cn(
              'relative inline-flex items-center justify-center text-sm whitespace-nowrap transition-colors focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50',
              underline
                ? 'focus-visible:text-foreground hover:text-foreground py-1'
                : 'ring-offset-background focus-visible:ring-ring rounded-md px-2.5 py-1 font-medium focus-visible:ring-2 focus-visible:ring-offset-2',
              active && 'text-foreground cursor-default',
              tabClassName,
            )}
            type="button"
            aria-pressed={active}
            aria-label={getTabLabel?.(item)}
            title={getTabLabel?.(item)}
            key={item}
            onClick={() => {
              if (active) return
              previousRectRef.current = indicatorRef.current?.getBoundingClientRect() ?? null
              setCurrentSelect(layoutId, item)
            }}
          >
            {active && (
              <div
                ref={indicatorRef}
                className={cn(
                  'absolute',
                  underline
                    ? 'bg-foreground inset-x-0 bottom-0 h-px'
                    : 'bg-background inset-0 rounded-md shadow-sm',
                )}
              />
            )}
            <span className="z-10">{renderTab ? renderTab(item) : item}</span>
          </button>
        )
      })}
    </div>
  )
}
