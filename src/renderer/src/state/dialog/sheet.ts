import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { Subject, SubjectType } from '@renderer/data/types/subject'
import { dialogAtomFactory } from '@renderer/state/utils'

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

export const subjectCollectionSheetFormAtom = dialogAtomFactory<SubjectCollectionSheetProps>()
