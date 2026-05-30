import { useEffect, useRef, useState } from 'react'
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
  const [, forceRender] = useState(0)

  useEffect(() => {
    if (!isHome || !outlet) return
    if (homeOutletRef.current) return

    homeOutletRef.current = outlet
    forceRender((value) => value + 1)
  }, [isHome, outlet])

  if (isHome) {
    return homeOutletRef.current ?? outlet
  }

  return (
    <>
      {homeOutletRef.current && <div className="hidden">{homeOutletRef.current}</div>}
      {outlet}
    </>
  )
}
