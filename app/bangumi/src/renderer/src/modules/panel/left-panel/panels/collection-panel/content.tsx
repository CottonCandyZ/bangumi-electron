import { CollectionsGrid } from '@renderer/modules/common/collections/grid'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import {
  sidePanelCollectionTypeFilterAtom,
  sidePanelOneBasedEpisodeSortAtom,
  sidePanelShowEpisodeListAtom,
} from '@renderer/state/collection'
import { collectionPanelSubjectTypeAtom } from '@renderer/state/panel'
import { useAtomValue, useSetAtom } from 'jotai'
import { userIdAtom } from '@renderer/state/session'
import { useSession } from '@renderer/data/hooks/session'
import { Button } from '@renderer/components/ui/button'
import { QueryFallback } from '@renderer/components/query-fallback'
import {
  collectionSyncDialogAtom,
  useCollectionSyncOverview,
} from '@renderer/modules/common/collections/sync-dialog'

export function SubjectCollectionPanelContent({ username }: { username: string }) {
  const subjectType = SubjectType[useAtomValue(collectionPanelSubjectTypeAtom)]
  const filterMap = useAtomValue(sidePanelCollectionTypeFilterAtom)
  const showEpisodeList = useAtomValue(sidePanelShowEpisodeListAtom)
  const useOneBasedEpisodeSort = useAtomValue(sidePanelOneBasedEpisodeSortAtom)
  const currentSelect = filterMap.get(subjectType.toString()) ?? CollectionType['watching']
  const userId = useAtomValue(userIdAtom)
  const profile = useSession()
  const own = !!userId && (username === userId || username === profile?.username)
  const sync = useCollectionSyncOverview()
  const openSync = useSetAtom(collectionSyncDialogAtom)
  const emptyContent = !own ? undefined : sync.isError ? (
    <QueryFallback label="收藏同步状态" error={sync.error} onRetry={sync.refetch} />
  ) : !sync.data ? null : !sync.data.listComplete ? (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-medium">
        {sync.data.running ? '正在同步收藏' : '把你的收藏带到这里'}
      </p>
      <p className="text-muted-foreground text-xs">
        {sync.data.running
          ? '同步完成后，收藏会自动显示在这里。'
          : '开始首次同步后，就能在这里查看收藏和章节进度。'}
      </p>
      <Button variant="outline" onClick={() => openSync(true)}>
        {sync.data.running ? '查看同步进度' : '同步收藏'}
      </Button>
    </div>
  ) : undefined

  return (
    <CollectionsGrid
      username={username}
      subjectType={subjectType}
      collectionType={currentSelect}
      showEpisodeList={showEpisodeList}
      useOneBasedEpisodeSort={useOneBasedEpisodeSort}
      emptyContent={emptyContent}
    />
  )
}
