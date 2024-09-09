import { useEffect } from 'react'

export const useResizeObserver = <T extends Element>({
  ref,
  callback,
  deps = [],
}: {
  ref: React.RefObject<T>
  callback: (entry: ResizeObserverEntry) => void
  deps?: React.DependencyList
}) => {
  useEffect(() => {
    const element = ref.current
    if (!element) return

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        callback(entries[0])
      }
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [ref, callback, ...deps])
}
