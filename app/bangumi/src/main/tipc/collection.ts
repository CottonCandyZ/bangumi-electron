import { t } from './_init'
import { collectionService } from '../collection/service'
import type { CollectionApi } from '../collection/worker-api'

export const collectionIPC = {
  collectionCredentialsChanged: t.procedure
    .input<Parameters<CollectionApi['collectionCredentialsChanged']>[0]>()
    .action(({ input }) => collectionService().call('collectionCredentialsChanged', input)),
  collectionEpisodeResource: t.procedure
    .input<Parameters<CollectionApi['collectionEpisodeResource']>[0]>()
    .action(({ input }) => collectionService().call('collectionEpisodeResource', input)),
  collectionState: t.procedure
    .input<Parameters<CollectionApi['collectionState']>[0]>()
    .action(({ input }) => collectionService().call('collectionState', input)),
  collectionActivate: t.procedure
    .input<Parameters<CollectionApi['collectionActivate']>[0]>()
    .action(({ input }) => collectionService().call('collectionActivate', input)),
  collectionAccount: t.procedure
    .input<Parameters<CollectionApi['collectionAccount']>[0]>()
    .action(({ input }) => collectionService().call('collectionAccount', input)),
  collectionSaveAccount: t.procedure
    .input<Parameters<CollectionApi['collectionSaveAccount']>[0]>()
    .action(({ input }) => collectionService().call('collectionSaveAccount', input)),
  collectionCommand: t.procedure
    .input<Parameters<CollectionApi['collectionCommand']>[0]>()
    .action(({ input }) => collectionService().call('collectionCommand', input)),
  collectionRead: t.procedure
    .input<Parameters<CollectionApi['collectionRead']>[0]>()
    .action(({ input }) => collectionService().call('collectionRead', input)),
  collectionList: t.procedure
    .input<Parameters<CollectionApi['collectionList']>[0]>()
    .action(({ input }) => collectionService().call('collectionList', input)),
  collectionReadEpisodes: t.procedure
    .input<Parameters<CollectionApi['collectionReadEpisodes']>[0]>()
    .action(({ input }) => collectionService().call('collectionReadEpisodes', input)),
  collectionOverview: t.procedure
    .input<Parameters<CollectionApi['collectionOverview']>[0]>()
    .action(({ input }) => collectionService().call('collectionOverview', input)),
  collectionSync: t.procedure
    .input<Parameters<CollectionApi['collectionSync']>[0]>()
    .action(({ input }) => collectionService().call('collectionSync', input)),
  collectionResolve: t.procedure
    .input<Parameters<CollectionApi['collectionResolve']>[0]>()
    .action(({ input }) => collectionService().call('collectionResolve', input)),
  collectionRemoved: t.procedure
    .input<Parameters<CollectionApi['collectionRemoved']>[0]>()
    .action(({ input }) => collectionService().call('collectionRemoved', input)),
}
