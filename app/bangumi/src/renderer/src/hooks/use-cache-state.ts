import { otherCache } from '@renderer/state/global-var'
import { useLocation } from 'react-router-dom'

export function useStateHook<T extends number | string | boolean>({ key }: { key: string }) {
  const { pathname } = useLocation()

  if (otherCache.get(pathname) === undefined) {
    otherCache.set(pathname, new Map<string, T>())
  }
  const cache = otherCache.get(pathname) as Map<string, T> | undefined

  return {
    init: cache?.get(key),
    setter: (value: T) => cache?.set(key, value),
  }
}
