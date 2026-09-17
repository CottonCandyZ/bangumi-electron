import type { CollectionRepository } from './repository'
import type { createCollectionService } from './service-core'
import type {
  CollectionCommand,
  ConflictResolution,
  LocalAccount,
} from '../../shared/collection-sync'

export function createCollectionApi(
  service: ReturnType<typeof createCollectionService>,
  repository: CollectionRepository,
) {
  return {
    collectionActivate: (input: { userId: number | null }) =>
      service.activateCollections(input.userId),
    collectionCredentialsChanged: (input: { userId: number }) =>
      service.collectionCredentialsChanged(input.userId),
    collectionEpisodeResource: (input: { episodeId: number }) =>
      repository.episodeResource(input.episodeId),
    collectionState: (input: { userId: number; subjectId: number }) => {
      const record = repository.get(input.userId, input.subjectId)
      return record
        ? {
            status: record.status,
            error: record.error,
            local: record.local,
            retained: record.retained,
            subject: record.subject,
          }
        : null
    },
    collectionAccount: (input: { userId: number }) =>
      repository.account(input.userId)?.profile ?? null,
    collectionSaveAccount: (input: LocalAccount) => repository.saveAccount(input),
    collectionCommand: (input: CollectionCommand) => {
      repository.command(input)
      service.notifyCollections(input.userId, [input.subjectId], true)
      service.scheduleCollections()
    },
    collectionRead: (input: { userId: number; subjectId: number }) => {
      service.requestCollection(input.subjectId, input.userId)
      return repository.collection(input.userId, input.subjectId)
    },
    collectionList: (input: Parameters<typeof service.readCollectionPage>[0]) =>
      service.readCollectionPage(input),
    collectionReadEpisodes: (input: Parameters<typeof repository.episodes>[0]) => {
      service.requestCollection(input.subjectId, input.userId)
      return repository.episodes(input)
    },
    collectionOverview: (input: { userId: number }) => service.collectionOverview(input.userId),
    collectionSync: (input: { userId: number; full?: boolean }) =>
      service.syncCollections(input.userId, input.full),
    collectionResolve: (input: ConflictResolution) => service.resolveCollection(input),
    collectionRemoved: (input: { userId: number }) => repository.removed(input.userId),
  }
}
export type CollectionApi = ReturnType<typeof createCollectionApi>
