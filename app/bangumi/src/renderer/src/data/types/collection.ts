export * from '@shared/types/collection'
import type { P1SlimMono, SlimIndex } from './index'
import type { P1SlimSubject } from './subject'
export type P1CollectionResourceType = 'subject' | 'character' | 'person' | 'index'
export type P1ToggleCollectionResourceType = Exclude<P1CollectionResourceType, 'subject'>

export type MonoResourceCollection = {
  created_at: string
  id: number
  name: string
  type: number
}

export type P1CollectionItemMap = {
  subject: P1SlimSubject
  character: P1SlimMono
  person: P1SlimMono
  index: SlimIndex
}

export type P1CollectionPage<T extends P1CollectionResourceType> = {
  data: P1CollectionItemMap[T][]
  total: number
}
