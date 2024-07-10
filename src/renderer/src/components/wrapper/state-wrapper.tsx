import { createContext, PropsWithChildren, useRef } from 'react'

export const SateContext = createContext<{
  scrollCache: Map<string, number>
  carouselCache: Map<string, Map<string, number>>
} | null>(null)

export default function InitStateContextWrapper({ children }: PropsWithChildren) {
  const scrollCache = useRef(new Map<string, number>())
  const carouselCache = useRef(new Map<string, Map<string, number>>())
  return (
    <SateContext.Provider
      value={{ scrollCache: scrollCache.current, carouselCache: carouselCache.current }}
    >
      {children}
    </SateContext.Provider>
  )
}
