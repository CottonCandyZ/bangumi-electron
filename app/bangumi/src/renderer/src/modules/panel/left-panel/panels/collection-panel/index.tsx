import { Button } from '@renderer/components/ui/button'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useSession } from '@renderer/data/hooks/session'
import { SubjectCollectionPanelContent } from '@renderer/modules/panel/left-panel/panels/collection-panel/content'
import { CollectionPanelHeader } from '@renderer/modules/panel/left-panel/panels/collection-panel/header'
import { P1CollectionList } from '@renderer/modules/panel/left-panel/panels/collection-panel/p1-collection-list'
import { collectionPanelResourceTypeAtom } from '@renderer/state/collection'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { collectionPanelUsernameAtom } from '@renderer/state/panel'
import { useAtomValue, useSetAtom } from 'jotai'

export function CollectionPanel() {
  const userInfo = useSession()
  const panelUsername = useAtomValue(collectionPanelUsernameAtom)
  const resourceType = useAtomValue(collectionPanelResourceTypeAtom)
  const username = panelUsername ?? userInfo?.username
  const openLoginDialog = useSetAtom(loginDialogAtom)

  return (
    <div className="flex h-dvh flex-col">
      <CollectionPanelHeader />
      {userInfo === undefined && !panelUsername ? (
        <CollectionPanelLoading />
      ) : !username ? (
        <CollectionPanelLoginPrompt onLogin={() => openLoginDialog({ open: true })} />
      ) : resourceType === 'subject' ? (
        <SubjectCollectionPanelContent username={username} />
      ) : (
        <P1CollectionList resourceType={resourceType} username={panelUsername} />
      )}
    </div>
  )
}

function CollectionPanelLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 py-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <div className="flex min-h-20 flex-row gap-3 rounded-md p-2" key={index}>
          <Skeleton className="size-14 shrink-0 rounded-md" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="mt-auto h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function CollectionPanelLoginPrompt({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">登录后查看收藏</div>
        <div className="text-muted-foreground text-xs">
          收藏面板会显示你的条目、角色、人物和目录收藏。
        </div>
      </div>
      <Button className="no-drag-region" onClick={onLogin}>
        登录
      </Button>
    </div>
  )
}
