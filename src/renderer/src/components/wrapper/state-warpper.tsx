import {
  createContext,
  MutableRefObject,
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

type State = {
  carouselState: Map<string, number>
}

export const SateContext = createContext<{
  currentState: MutableRefObject<State>
  stateStack: State[]
} | null>(null)

export default function InitStateContextWrapper({ children }: PropsWithChildren) {
  const [stateStack, setStateStack] = useState<State[]>([])
  const location = useLocation()
  const navigationType = useNavigationType()
  const currentState = useRef<State>({ carouselState: new Map() })
  useEffect(() => {
    if (navigationType === 'POP') {
      if (stateStack.length !== 0) {
        currentState.current = stateStack.at(-1)!
        setStateStack((stateStack) => {
          return [...stateStack.slice(0, stateStack.length - 1)]
        })
      }
      return
    }
    setStateStack((stateStack) => [
      ...stateStack,
      {
        carouselState: new Map(currentState.current.carouselState),
      },
    ])
  }, [location])

  return (
    <SateContext.Provider value={{ currentState, stateStack }}>{children}</SateContext.Provider>
  )
}
