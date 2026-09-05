import { useEffect, useState, type ReactNode } from 'react'

/** Fast local reads should go straight to content, without a one-frame skeleton flash. */
export function DelayedLoading({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200)
    return () => clearTimeout(timer)
  }, [])
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-busy="true">
      {visible ? children : null}
    </div>
  )
}
