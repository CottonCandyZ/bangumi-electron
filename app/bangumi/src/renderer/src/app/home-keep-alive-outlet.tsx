import { cn } from '@renderer/lib/utils'
import { useRef } from 'react'
import type { ReactElement } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'

function isHomePath(pathname: string) {
  return pathname === '/'
}

export function HomeKeepAliveOutlet() {
  const location = useLocation()
  const outlet = useOutlet()
  const isHome = isHomePath(location.pathname)
  const homeOutletRef = useRef<ReactElement | null>(isHome ? outlet : null)

  if (isHome && outlet && !homeOutletRef.current) {
    homeOutletRef.current = outlet
  }

  return (
    <>
      {homeOutletRef.current && (
        <div className={cn(!isHome && 'hidden')}>{homeOutletRef.current}</div>
      )}
      {!isHome && outlet}
    </>
  )
}
