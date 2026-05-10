import { Image } from '@renderer/components/image/image'
import { useStateHook } from '@renderer/hooks/use-cache-state'
import { cn } from '@renderer/lib/utils'
import { memo, useEffect, type ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'

type ViewTransitionElementProps = {
  active: boolean
  cacheKey?: string
  children?: ReactNode
  className?: string
  initialInView?: boolean
  onInViewChange?: (inView: boolean) => void
  style?: React.CSSProperties
  viewTransitionName?: string
}

export const ViewTransitionElement = memo(function ViewTransitionElement({
  active,
  cacheKey,
  children,
  className,
  initialInView = true,
  onInViewChange,
  style,
  viewTransitionName,
}: ViewTransitionElementProps) {
  const { init, setter } = useStateHook({ key: cacheKey ?? 'viewTransitionElementInView' })
  const { ref, inView } = useInView({
    threshold: 1,
    initialInView: cacheKey ? ((init as boolean | undefined) ?? initialInView) : initialInView,
  })

  useEffect(() => {
    if (cacheKey) setter(inView)
    onInViewChange?.(inView)
  }, [cacheKey, inView, onInViewChange, setter])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        viewTransitionName: active && inView ? viewTransitionName : undefined,
      }}
    >
      {children}
    </div>
  )
})

type ViewTransitionImageProps = Omit<React.ComponentProps<typeof Image>, 'className' | 'style'> &
  Omit<ViewTransitionElementProps, 'children'> & {
    imageContainerClassName?: string
  }

export const ViewTransitionImage = memo(function ViewTransitionImage({
  active,
  cacheKey,
  className,
  imageContainerClassName,
  initialInView,
  onInViewChange,
  style,
  viewTransitionName,
  ...imageProps
}: ViewTransitionImageProps) {
  return (
    <ViewTransitionElement
      active={active}
      cacheKey={cacheKey}
      className={className}
      initialInView={initialInView}
      onInViewChange={onInViewChange}
      style={style}
      viewTransitionName={viewTransitionName}
    >
      <Image {...imageProps} className={cn('h-full w-full', imageContainerClassName)} />
    </ViewTransitionElement>
  )
})
