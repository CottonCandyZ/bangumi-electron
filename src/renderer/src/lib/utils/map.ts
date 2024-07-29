import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'

export const RATING_MAP = {
  1: '不忍直视',
  2: '很差',
  3: '差',
  4: '较差',
  5: '不过不失',
  6: '还行',
  7: '推荐',
  8: '力荐',
  9: '神作',
  10: '超神作',
} as const

export const EPISODE_TYPE_MAP = {
  0: '本篇',
  1: 'SP',
  2: 'OP',
  3: 'ED',
} as const

export const COLLECTION_ACTION = {
  [SubjectType.anime]: '看',
  [SubjectType.real]: '看',
  [SubjectType.book]: '读',
  [SubjectType.music]: '听',
  [SubjectType.game]: '玩',
}

export const COLLECTION_TYPE_MAP = (subjectType: SubjectType) => {
  const action = COLLECTION_ACTION[subjectType]
  return {
    [CollectionType.wantToWatch]: `想${action}`,
    [CollectionType.watched]: `${action}过`,
    [CollectionType.watching]: `在${action}`,
    [CollectionType.aside]: `搁置`,
    [CollectionType.abandoned]: `抛弃`,
  }
}
