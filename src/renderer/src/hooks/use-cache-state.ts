import { otherCache } from '@renderer/state/global-var'
import { useLocation } from 'react-router-dom'

export function useStateHook<T extends number | string | boolean>({ key }: { key: string }) {
  const { pathname } = useLocation()

  if (otherCache.get(pathname) === undefined) {
    otherCache.set(pathname, new Map<string, T>())
  }
  return {
    init: otherCache.get(pathname)?.get(key),
    setter: (value: T) => otherCache.get(pathname)?.set(key, value),
  }
}
