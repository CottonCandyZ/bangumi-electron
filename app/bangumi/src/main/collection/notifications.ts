import type { CollectionChange } from '../../shared/collection-sync'

/** Coalesce bursts without postponing updates indefinitely during a long sync. */
export class CollectionNotifications {
  private changes = new Map<number, Set<number> | null>()
  private progressUsers = new Set<number>()
  private changeTimer?: ReturnType<typeof setTimeout>
  private progressTimer?: ReturnType<typeof setTimeout>

  constructor(
    private emitChange: (change: CollectionChange) => void,
    private emitProgress: (userId: number) => void,
  ) {}

  collections(userId: number, subjectIds: number[] | null, immediate = false) {
    const previous = this.changes.get(userId)
    this.changes.set(
      userId,
      subjectIds === null || previous === null
        ? null
        : new Set([...(previous ?? []), ...subjectIds]),
    )
    this.progress(userId)
    if (immediate) this.flushChanges()
    else this.changeTimer ??= setTimeout(() => this.flushChanges(), 250)
  }

  progress(userId: number) {
    this.progressUsers.add(userId)
    this.progressTimer ??= setTimeout(() => {
      this.progressTimer = undefined
      const ids = [...this.progressUsers]
      this.progressUsers.clear()
      ids.forEach(this.emitProgress)
    }, 100)
  }

  private flushChanges() {
    clearTimeout(this.changeTimer)
    this.changeTimer = undefined
    const changes = [...this.changes]
    this.changes.clear()
    for (const [userId, ids] of changes) this.emitChange({ userId, subjectIds: ids && [...ids] })
  }

  dispose() {
    clearTimeout(this.changeTimer)
    clearTimeout(this.progressTimer)
    this.changes.clear()
    this.progressUsers.clear()
  }
}
