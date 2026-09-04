import type { CollectionData, CollectionType, EpisodeCollectionType } from './types/collection'
import type { Episode } from './types/episode'
import type { SlimSubject } from './types/subject'

export type CollectionFields = Pick<
  CollectionData,
  'type' | 'rate' | 'comment' | 'tags' | 'private'
>
export const collectionFields = ['type', 'rate', 'comment', 'tags', 'private'] as const
export type CollectionField = (typeof collectionFields)[number]
// Missing = never observed; null = confirmed absent. Neither means an empty collection.
export type CollectionSnapshot = {
  collection?: CollectionFields | null
  episodes: Record<string, EpisodeCollectionType>
  episodesComplete: boolean
}
export type CollectionCommand = {
  actionId: string
  userId: number
  subjectId: number
  subject?: SlimSubject
} & (
  | { kind: 'edit'; patch: Partial<CollectionFields> }
  | { kind: 'remove' }
  | { kind: 'episodes'; episodes: Record<string, EpisodeCollectionType> }
)
export type LocalAction = { sequence: number; command: CollectionCommand }
export type ConflictField = { path: string; base: unknown; local: unknown; remote: unknown }
export type CollectionConflict = {
  revision: number
  remote: CollectionSnapshot
  fields: ConflictField[]
}
export type SyncAttempt = {
  revision: number
  target: CollectionSnapshot
  remote: CollectionSnapshot
}
export type CollectionSyncStatus =
  | 'clean'
  | 'pending'
  | 'syncing'
  | 'conflict'
  | 'error'
  | 'auth-required'
export type LocalCollectionRecord = {
  userId: number
  subjectId: number
  subject: SlimSubject
  base: CollectionSnapshot
  local: CollectionSnapshot
  retained: CollectionFields | null
  revision: number
  status: CollectionSyncStatus
  conflict: CollectionConflict | null
  attempt: SyncAttempt | null
  error: string | null
  updatedAt: number
  syncedAt: number | null
  epStatus: number
  volStatus: number
}
export type RemoteCollection = {
  snapshot: CollectionSnapshot
  updatedAt?: number
  subject?: SlimSubject
  episodes: Episode[]
  epStatus: number
  volStatus: number
}
export type LocalAccount = {
  id: number
  username: string
  nickname: string
  avatar: { large: string; medium: string; small: string }
  sign: string
  user_group: number
  url: string
  time_offset: number
}
export type SyncPhase = 'reading' | 'uploading' | 'verifying'
export type SyncSubject = { id: number; title: string; cover: string | undefined }
export type SyncResult = {
  subject: SyncSubject
  status: 'synced' | 'pending' | 'conflict' | 'error'
  error: string | null
}
// Transient, account-scoped progress. Counts belong to the current stage, not a guessed total.
export type SyncProgress = {
  stage: 'changes' | 'list' | 'episodes'
  completed: number
  total: number | null
  current: { subject: SyncSubject; phase: SyncPhase } | null
  recent: SyncResult[]
  finishedAt: number | null
}
export type SyncOverview = {
  authRequired: boolean
  pending: number
  conflicts: LocalCollectionRecord[]
  errors: LocalCollectionRecord[]
  running: boolean
  lastSyncedAt: number | null
  listComplete: boolean
  error: string | null
  progress: SyncProgress | null
}
export type ConflictResolution = {
  userId: number
  subjectId: number
  revision: number
  choices: Record<string, 'local' | 'remote'>
}
export function emptySnapshot(): CollectionSnapshot {
  return { episodes: {}, episodesComplete: false }
}
export function defaultCollection(type: CollectionType = 3): CollectionFields {
  return { type, rate: 0, comment: '', tags: [], private: false }
}
export function equalValue(a: unknown, b: unknown, path = ''): boolean {
  if (path === 'tags') {
    return (
      JSON.stringify([...new Set((a as string[] | undefined) ?? [])].sort()) ===
      JSON.stringify([...new Set((b as string[] | undefined) ?? [])].sort())
    )
  }
  if (path === 'comment') return (a ?? '') === (b ?? '')
  return JSON.stringify(a) === JSON.stringify(b)
}
export function applyCommand(
  snapshot: CollectionSnapshot,
  command: CollectionCommand,
  retained: CollectionFields | null = null,
): CollectionSnapshot {
  const result = structuredClone(snapshot)
  if (command.kind === 'remove') result.collection = null
  if (command.kind === 'edit')
    result.collection = {
      ...(result.collection ?? retained ?? defaultCollection()),
      ...command.patch,
    }
  if (command.kind === 'episodes') result.episodes = { ...result.episodes, ...command.episodes }
  return result
}
export function mergeCollection(
  base: CollectionSnapshot,
  local: CollectionSnapshot,
  remote: CollectionSnapshot,
  touched: Set<string>,
): { target: CollectionSnapshot; conflicts: ConflictField[] } {
  const target = structuredClone(remote)
  const conflicts: ConflictField[] = []
  const conflict = (path: string, b: unknown, l: unknown, r: unknown) => {
    conflicts.push({ path, base: b, local: l, remote: r })
    return l
  }
  const choose = (path: string, b: unknown, l: unknown, r: unknown) => {
    if (equalValue(l, r, path)) return r
    if (b === undefined) return touched.has(path) ? conflict(path, b, l, r) : r
    if (equalValue(l, b, path)) return r
    if (equalValue(r, b, path)) return l
    return conflict(path, b, l, r)
  }
  const changed = (a: CollectionSnapshot, b: CollectionSnapshot) =>
    collectionFields.some((key) => !equalValue(a.collection?.[key], b.collection?.[key], key)) ||
    Object.keys({ ...a.episodes, ...b.episodes }).some(
      (id) => !equalValue(a.episodes[id] ?? 0, b.episodes[id] ?? 0),
    )
  const localRemoved = local.collection === null && base.collection !== null
  const remoteRemoved = remote.collection === null && base.collection != null
  if (
    (localRemoved &&
      remote.collection != null &&
      (base.collection === undefined || changed(base, remote))) ||
    (remoteRemoved && local.collection != null && changed(base, local))
  ) {
    conflict('collection', base.collection, local.collection, remote.collection)
    return { target: structuredClone(local), conflicts }
  }
  if (base.collection === null && local.collection === null) return { target, conflicts }
  if (
    base.collection === null &&
    local.collection &&
    remote.collection &&
    touched.has('collection') &&
    changed(local, remote)
  ) {
    conflict('collection', base.collection, local.collection, remote.collection)
    return { target: structuredClone(local), conflicts }
  }
  if (base.collection === null && local.collection && remote.collection === null) {
    // Restoring a removed collection explicitly restores its retained episode backup,
    // including episodes the server no longer returns after deletion.
    return {
      target: {
        ...target,
        collection: structuredClone(local.collection),
        episodes: { ...remote.episodes, ...local.episodes },
      },
      conflicts,
    }
  }
  if (local.collection === null && touched.has('collection')) {
    target.collection = null
    target.episodes = structuredClone(local.episodes)
    target.episodesComplete = local.episodesComplete
    return { target, conflicts }
  }
  if (remoteRemoved && !changed(base, local)) return { target, conflicts }
  if (local.collection != null && remote.collection == null) {
    if (base.collection === undefined && !touched.has('collection'))
      conflict('collection', base.collection, local.collection, remote.collection)
    target.collection = structuredClone(local.collection)
  } else if (local.collection != null && remote.collection != null) {
    for (const key of collectionFields) {
      Object.assign(target.collection!, {
        [key]: choose(key, base.collection?.[key], local.collection[key], remote.collection[key]),
      })
    }
  }
  for (const id of Object.keys(local.episodes)) {
    const path = `episodes.${id}`
    if (!touched.has(path) && base.episodes[id] === undefined) continue
    target.episodes[id] = choose(
      path,
      base.episodes[id],
      local.episodes[id],
      remote.episodes[id],
    ) as EpisodeCollectionType
  }
  return { target, conflicts }
}
export function touchedBy(actions: LocalAction[]): Set<string> {
  const paths = new Set<string>()
  for (const { command } of actions) {
    if (command.kind === 'remove') paths.add('collection')
    if (command.kind === 'edit') {
      paths.add('collection')
      Object.keys(command.patch).forEach((key) => paths.add(key))
    }
    if (command.kind === 'episodes')
      Object.keys(command.episodes).forEach((id) => paths.add(`episodes.${id}`))
  }
  return paths
}
export function snapshotMatches(a: CollectionSnapshot, b: CollectionSnapshot): boolean {
  if ((a.collection == null) !== (b.collection == null)) return false
  if (a.collection === null && b.collection === null) return true
  if (
    a.collection &&
    collectionFields.some((key) => !equalValue(a.collection?.[key], b.collection?.[key], key))
  )
    return false
  return Object.keys(a.episodes).every((id) => equalValue(a.episodes[id], b.episodes[id]))
}
