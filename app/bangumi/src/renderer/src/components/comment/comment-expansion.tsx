import {
  createContext,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
  type SetStateAction,
} from 'react'
import { createCommentExpansionStore } from './comment-expansion-store'

const ExpansionContext = createContext<ReturnType<typeof createCommentExpansionStore> | null>(null)

export function CommentExpansionProvider({ children }: PropsWithChildren) {
  const [store] = useState(createCommentExpansionStore)
  return <ExpansionContext.Provider value={store}>{children}</ExpansionContext.Provider>
}

export function useCommentExpansion(key: string, revision = '') {
  const shared = useContext(ExpansionContext)
  const [local] = useState(createCommentExpansionStore)
  const store = shared ?? local
  const snapshot = () => store.get(key, revision)
  const expanded = useSyncExternalStore(store.subscribe, snapshot, snapshot)
  const setExpanded = useCallback(
    (value: SetStateAction<boolean>) => {
      store.set(
        key,
        revision,
        typeof value === 'function' ? value(store.get(key, revision)) : value,
      )
    },
    [key, revision, store],
  )
  return [expanded, setExpanded] as const
}
