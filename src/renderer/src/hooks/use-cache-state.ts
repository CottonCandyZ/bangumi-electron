import { otherCache } from '@renderer/state/global-var'
import { useLocation } from 'react-router-dom'

export function useStateHook({ key }: { key: string }) {
  const { pathname } = useLocation()

  if (otherCache.get(pathname) === undefined) {
    otherCache.set(pathname, new Map<string, number>())
  }
  return {
    init: otherCache.get(pathname)?.get(key),
    setter: otherCache.get(pathname),
  }
}
