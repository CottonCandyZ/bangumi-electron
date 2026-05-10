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
  style?: React.CSSProperties
  viewTransitionName?: string
}

export const ViewTransitionElement = memo(function ViewTransitionElement({
  active,
  cacheKey,
  children,
  className,
  initialInView = true,
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
  }, [cacheKey, inView, setter])

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
      style={style}
      viewTransitionName={viewTransitionName}
    >
      <Image {...imageProps} className={cn('h-full w-full', imageContainerClassName)} />
    </ViewTransitionElement>
  )
})
