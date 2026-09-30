import { HeaderButton } from '@renderer/components/tooltip-button/header-button'
import { cn } from '@renderer/lib/utils'
import { createContext, useContext, useEffect, useState } from 'react'
import type { Dispatch, PropsWithChildren, SetStateAction } from 'react'

type LocateAction = (() => void) | null

const LocateActionContext = createContext<LocateAction>(null)
const RegisterLocateActionContext = createContext<Dispatch<SetStateAction<LocateAction>> | null>(
  null,
)

export function ListLocateProvider({ children }: PropsWithChildren) {
  const [locate, setLocate] = useState<LocateAction>(null)

  return (
    <RegisterLocateActionContext.Provider value={setLocate}>
      <LocateActionContext.Provider value={locate}>{children}</LocateActionContext.Provider>
    </RegisterLocateActionContext.Provider>
  )
}

export function useListLocateAction(locate: LocateAction) {
  const register = useContext(RegisterLocateActionContext)

  useEffect(() => {
    if (!register) return
    register(() => locate)
    return () => register(null)
  }, [locate, register])
}

export function ListLocateButton({ className }: { className?: string }) {
  const locate = useContext(LocateActionContext)
  if (!locate) return null

  return (
    <HeaderButton
      Button={
        <button
          aria-label="定位当前项目"
          className={cn(
            'text-muted-foreground no-drag-region hover:bg-accent hover:text-foreground flex size-6 shrink-0 items-center justify-center rounded-md',
            className,
          )}
          onClick={locate}
        >
          <LocateCurrentIcon className="size-3.5" />
        </button>
      }
      Content={<p>定位当前项目</p>}
    />
  )
}

/**
 * 「定位当前项目」图标：一个列表，中间一行用实心圆点标出当前项。
 * 沿用 lucide 的 24 网格 / 2px 描边 / 圆角端点，和旁边的刷新、设置图标风格一致。
 */
function LocateCurrentIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M11 6h9" />
      <path d="M11 12h9" />
      <path d="M11 18h9" />
      <path d="M5 6h.01" />
      <path d="M5 18h.01" />
      <circle cx="5.5" cy="12" fill="currentColor" r="2.5" stroke="none" />
    </svg>
  )
}
