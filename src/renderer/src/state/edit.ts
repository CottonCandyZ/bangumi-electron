import { create } from 'zustand'

type EditTags = {
  edit: boolean
  setEdit: (edit: boolean) => void
}

export const useEditTags = create<EditTags>()((set) => ({
  edit: false,
  setEdit: (edit) => set({ edit }),
}))
