import EmblaCarousel, { type EmblaOptionsType, type EmblaPluginType } from 'embla-carousel'
import { areOptionsEqual, arePluginsEqual } from 'embla-carousel-reactive-utils'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export function useLayoutCarousel(options: EmblaOptionsType = {}, plugins: EmblaPluginType[] = []) {
  const [api, setApi] = useState<ReturnType<typeof EmblaCarousel>>()
  const instanceRef = useRef<ReturnType<typeof EmblaCarousel> | undefined>(undefined)
  const configuration = useRef({ options, plugins })

  useLayoutEffect(() => {
    const previous = configuration.current
    if (areOptionsEqual(previous.options, options) && arePluginsEqual(previous.plugins, plugins)) {
      return
    }
    configuration.current = { options, plugins }
    instanceRef.current?.reInit(options, plugins)
  }, [options, plugins])

  // Restore the transform before paint, so consumers can measure the same layout for their masks.
  const carouselRef = useCallback((viewport: HTMLElement | null) => {
    if (!viewport) return
    const instance = EmblaCarousel(
      viewport,
      configuration.current.options,
      configuration.current.plugins,
    )
    instanceRef.current = instance
    setApi(instance)
    return () => {
      instance.destroy()
      instanceRef.current = undefined
      setApi(undefined)
    }
  }, [])

  return [carouselRef, api] as const
}
