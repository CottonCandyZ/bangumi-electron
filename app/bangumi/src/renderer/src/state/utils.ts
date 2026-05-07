import { atom, createStore } from 'jotai'

export const store = createStore()

export const dialogAtomFactory = <T extends object>() => {
  const dialogContentAtom = atom<T | null>(null)
  const open = atom(false)
  return atom(
    (get) => {
      return { content: get(dialogContentAtom), open: get(open) }
    },
    (_, set, props: { open: boolean; content?: T }) => {
      if (props.open) {
        if (props.content) set(dialogContentAtom, props.content)
        set(open, true)
      } else {
        set(open, false)
      }
    },
  )
}
