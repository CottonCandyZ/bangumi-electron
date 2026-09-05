import { t } from './_init'
import {
  activateCollections,
  collectionCredentialsChanged,
  collectionOverview,
  collectionRepository,
  notifyCollections,
  requestCollection,
  resolveCollection,
  scheduleCollections,
  syncCollections,
} from '../collection/service'
import type {
  CollectionCommand,
  ConflictResolution,
  LocalAccount,
} from '../../shared/collection-sync'
export const collectionIPC = {
  collectionCredentialsChanged: t.procedure
    .input<{ userId: number }>()
    .action(async ({ input }) => collectionCredentialsChanged(input.userId)),
  collectionEpisodeResource: t.procedure
    .input<{ episodeId: number }>()
    .action(async ({ input }) => collectionRepository.episodeResource(input.episodeId)),
  collectionState: t.procedure
    .input<{ userId: number; subjectId: number }>()
    .action(async ({ input }) => collectionRepository.get(input.userId, input.subjectId) ?? null),
  collectionActivate: t.procedure
    .input<{ userId: number | null }>()
    .action(async ({ input }) => activateCollections(input.userId)),
  collectionAccount: t.procedure
    .input<{ userId: number }>()
    .action(async ({ input }) => collectionRepository.account(input.userId)?.profile ?? null),
  collectionSaveAccount: t.procedure.input<LocalAccount>().action(async ({ input }) => {
    collectionRepository.saveAccount(input)
    notifyCollections()
  }),
  collectionCommand: t.procedure.input<CollectionCommand>().action(async ({ input }) => {
    const result = collectionRepository.command(input)
    notifyCollections()
    scheduleCollections()
    return result
  }),
  collectionRead: t.procedure
    .input<{ userId: number; subjectId: number }>()
    .action(async ({ input }) => {
      requestCollection(input.subjectId, input.userId)
      return collectionRepository.collection(input.userId, input.subjectId)
    }),
  collectionList: t.procedure
    .input<Parameters<typeof collectionRepository.list>[0]>()
    .action(async ({ input }) => collectionRepository.list(input)),
  collectionReadEpisodes: t.procedure
    .input<Parameters<typeof collectionRepository.episodes>[0]>()
    .action(async ({ input }) => {
      requestCollection(input.subjectId, input.userId)
      return collectionRepository.episodes(input)
    }),
  collectionOverview: t.procedure
    .input<{ userId: number }>()
    .action(async ({ input }) => collectionOverview(input.userId)),
  collectionSync: t.procedure
    .input<{ userId: number; full?: boolean }>()
    .action(async ({ input }) => syncCollections(input.userId, input.full)),
  collectionResolve: t.procedure
    .input<ConflictResolution>()
    .action(async ({ input }) => resolveCollection(input)),
  collectionRemoved: t.procedure
    .input<{ userId: number }>()
    .action(async ({ input }) => collectionRepository.removed(input.userId)),
}
