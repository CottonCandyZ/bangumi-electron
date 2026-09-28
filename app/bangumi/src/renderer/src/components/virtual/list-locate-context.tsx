import { HeaderButton } from '@renderer/components/tooltip-button/header-button'
import { LocateFixedIcon } from 'lucide-react'
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

export function ListLocateButton() {
  const locate = useContext(LocateActionContext)
  if (!locate) return null

  return (
    <HeaderButton
      Button={
        <button
          aria-label="定位当前项目"
          className="text-muted-foreground no-drag-region hover:bg-accent hover:text-foreground flex size-6 shrink-0 items-center justify-center rounded-md"
          onClick={locate}
        >
          <LocateFixedIcon className="size-3.5" />
        </button>
      }
      Content={<p>定位当前项目</p>}
    />
  )
}
