import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { Subject, SubjectType } from '@renderer/data/types/subject'
import { atom } from 'jotai'

/** 条目收藏 */
export type SubjectCollectionSheetProps = {
  sheetTitle: string
  subjectId: SubjectId
  subjectType: SubjectType
  subjectTags: Subject['tags']
  collectionType: CollectionType
  rate?: CollectionData['rate']
  comment?: string
  isPrivate?: boolean
  tags?: CollectionData['tags']
  modify?: boolean
}

const subjectCollectionSheetContentAtom = atom<SubjectCollectionSheetProps | null>(null)
const subjectCollectionSheetOpenAtom = atom(false)

export const subjectCollectionSheetFormAtom = atom(
  (get) => ({
    content: get(subjectCollectionSheetContentAtom),
    open: get(subjectCollectionSheetOpenAtom),
  }),
  (_get, set, props: { open: boolean; content?: SubjectCollectionSheetProps | null }) => {
    if (props.content !== undefined) set(subjectCollectionSheetContentAtom, props.content)

    set(subjectCollectionSheetOpenAtom, props.open)
  },
)
