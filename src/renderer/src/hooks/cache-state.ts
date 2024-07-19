import { SateContext } from '@renderer/components/wrapper/SateContext'
import { useContext } from 'react'
import { useLocation } from 'react-router-dom'

export default function useStateHook({ key }: { key: string }) {
  const initState = useContext(SateContext)
  const { pathname } = useLocation()

  if (initState?.otherCache.get(pathname) === undefined) {
    initState?.otherCache.set(pathname, new Map<string, number>())
  }
  return {
    init: initState?.otherCache.get(pathname)?.get(key),
    setter: initState?.otherCache.get(pathname),
  }
}
