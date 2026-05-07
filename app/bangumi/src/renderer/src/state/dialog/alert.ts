import { SubjectId } from '@renderer/data/types/bgm'
import { dialogAtomFactory } from '@renderer/state/utils'

// delete account
export type DeleteLoginAccountProps = {
  email: string
  onDeleted: () => void
}

export const deleteLoginAccountDialogAtom = dialogAtomFactory<DeleteLoginAccountProps>()

// delete collection
export type DeleteCollectionProps = {
  subjectId: SubjectId
}

export const deleteCollectionDialogAtom = dialogAtomFactory<DeleteCollectionProps>()
