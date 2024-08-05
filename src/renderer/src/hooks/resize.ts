import { useEffect } from 'react'

export const useResizeOb = <T extends Element>({
  ref,
  callback,
  deps,
}: {
  ref: React.RefObject<T>
  callback: (entries: ResizeObserverEntry[]) => void
  deps?: React.DependencyList
}) => {
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      callback(entries)
    })
    if (ref.current) resizeObserver.observe(ref.current)
    return () => {
      if (ref.current) resizeObserver.unobserve(ref.current)
    }
  }, [ref, ...(deps || [])])
}
