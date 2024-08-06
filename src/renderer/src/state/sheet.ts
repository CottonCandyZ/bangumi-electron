import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { Subject, SubjectType } from '@renderer/data/types/subject'
import { atom } from 'jotai'

type SheetContentName = 'subject-collection'

export const openSheetAtom = atom(false)

export const sheetContentNameAtom = atom<SheetContentName>('subject-collection')

/** 条目收藏 */
type SubjectCollectionSheetProps = {
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

export const subjectCollectionSheetFormPropsAtom = atom<SubjectCollectionSheetProps | null>(null)

export const subjectCollectionSheetFormActionAtom = atom(
  null,
  (_get, set, settings: SubjectCollectionSheetProps) => {
    set(openSheetAtom, true)
    set(subjectCollectionSheetFormPropsAtom, { ...settings })
  },
)
