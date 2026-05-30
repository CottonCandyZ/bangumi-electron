import { Button } from '@renderer/components/ui/button'
import { CollectionsGrid } from '@renderer/modules/common/collections/grid'
import { useSession } from '@renderer/data/hooks/session'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import {
  sidePanelCollectionTypeFilterAtom,
  sidePanelOneBasedEpisodeSortAtom,
  sidePanelShowEpisodeListAtom,
} from '@renderer/state/collection'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { collectionPanelSubjectTypeAtom, collectionPanelUsernameAtom } from '@renderer/state/panel'
import { useAtomValue, useSetAtom } from 'jotai'

export function SubjectCollectionPanelContent() {
  const subjectType = SubjectType[useAtomValue(collectionPanelSubjectTypeAtom)]
  const filterMap = useAtomValue(sidePanelCollectionTypeFilterAtom)
  const showEpisodeList = useAtomValue(sidePanelShowEpisodeListAtom)
  const useOneBasedEpisodeSort = useAtomValue(sidePanelOneBasedEpisodeSortAtom)
  const userInfo = useSession()
  const panelUsername = useAtomValue(collectionPanelUsernameAtom)
  const openLoginDialog = useSetAtom(loginDialogAtom)
  const username = panelUsername ?? userInfo?.username
  const currentSelect = filterMap.get(subjectType.toString()) ?? CollectionType['watching']

  if (!username) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium">登录后查看收藏</div>
          <div className="text-muted-foreground text-xs">
            收藏面板会显示你的条目进度和章节列表。
          </div>
        </div>
        <Button className="no-drag-region" onClick={() => openLoginDialog({ open: true })}>
          登录
        </Button>
      </div>
    )
  }

  return (
    <CollectionsGrid
      username={username}
      subjectType={subjectType}
      collectionType={currentSelect}
      showEpisodeList={showEpisodeList}
      useOneBasedEpisodeSort={useOneBasedEpisodeSort}
    />
  )
}
