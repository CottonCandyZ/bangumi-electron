import type {
  LocalCollectionRecord,
  SyncPhase,
  SyncProgress,
  SyncResult,
  SyncSubject,
} from '../../shared/collection-sync'

function subjectInfo(record: LocalCollectionRecord): SyncSubject {
  return {
    id: record.subjectId,
    title: record.subject.name_cn || record.subject.name || `条目 #${record.subjectId}`,
    cover: record.subject.images?.small || record.subject.images?.grid,
  }
}

export class CollectionSyncProgress {
  readonly value: SyncProgress = {
    stage: 'changes',
    completed: 0,
    total: null,
    current: null,
    recent: [],
    finishedAt: null,
  }

  constructor(private changed: () => void) {}

  stage(stage: SyncProgress['stage'], total: number | null) {
    Object.assign(this.value, { stage, total, completed: 0, current: null })
    this.changed()
  }

  downloaded(completed: number, total: number) {
    Object.assign(this.value, { completed, total })
    this.changed()
  }

  subject(record: LocalCollectionRecord, phase: SyncPhase) {
    this.value.current = { subject: subjectInfo(record), phase }
    this.changed()
  }

  settled(record: LocalCollectionRecord, failed: boolean) {
    const status: SyncResult['status'] = failed
      ? 'error'
      : record.status === 'clean'
        ? 'synced'
        : record.status === 'conflict'
          ? 'conflict'
          : 'pending'
    this.value.completed += 1
    this.value.current = null
    this.value.recent = [
      { subject: subjectInfo(record), status, error: record.error },
      ...this.value.recent.filter((item) => item.subject.id !== record.subjectId),
    ].slice(0, 5)
    this.changed()
  }

  finish() {
    this.value.current = null
    this.value.finishedAt = Date.now()
    this.changed()
  }
}
