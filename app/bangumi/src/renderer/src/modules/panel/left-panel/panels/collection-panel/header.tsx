import { SubjectCollectionSelectorContent } from '@renderer/modules/common/collections/subject-select-content'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu'
import { Select, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { useSession } from '@renderer/data/hooks/session'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import type { CollectionPanelResourceType } from '@renderer/state/collection'
import {
  collectionPanelResourceTypeAtom,
  sidePanelCollectionTypeFilterAtom,
  sidePanelOneBasedEpisodeSortAtom,
  sidePanelShowEpisodeListAtom,
} from '@renderer/state/collection'
import { collectionPanelIsRefetchingAtom } from '@renderer/state/loading'
import {
  collectionPanelSubjectTypeAtom,
  collectionPanelUsernameAtom,
  leftPanelOpenAtom,
} from '@renderer/state/panel'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { SettingsIcon, XIcon } from 'lucide-react'

const COLLECTION_RESOURCE_LABELS: Record<CollectionPanelResourceType, string> = {
  subject: '条目收藏',
  character: '角色收藏',
  person: '人物收藏',
  index: '目录收藏',
}

export function CollectionPanelHeader() {
  const subjectType = SubjectType[useAtomValue(collectionPanelSubjectTypeAtom)]
  const [filterMap, setCurrentTypeFilter] = useAtom(sidePanelCollectionTypeFilterAtom)
  const resourceType = useAtomValue(collectionPanelResourceTypeAtom)
  const [showEpisodeList, setShowEpisodeList] = useAtom(sidePanelShowEpisodeListAtom)
  const [useOneBasedEpisodeSort, setUseOneBasedEpisodeSort] = useAtom(
    sidePanelOneBasedEpisodeSortAtom,
  )
  const userInfo = useSession()
  const panelUsername = useAtomValue(collectionPanelUsernameAtom)
  const setLeftPanelOpen = useSetAtom(leftPanelOpenAtom)
  const currentSelect = filterMap.get(subjectType.toString()) ?? CollectionType['watching']
  const isRefetching = useAtomValue(collectionPanelIsRefetchingAtom)

  return (
    <div className="drag-region flex h-14 shrink-0 flex-row items-center justify-between gap-5 border-b px-2">
      {(!!userInfo || !!panelUsername) && (
        <>
          <div className="flex min-w-0 flex-row items-center gap-2">
            {resourceType === 'subject' ? (
              <Select
                onValueChange={(value) =>
                  setCurrentTypeFilter(subjectType.toString(), Number(value) as CollectionType)
                }
                value={currentSelect.toString()}
              >
                <SelectTrigger className="no-drag-region w-fit justify-start">
                  <SelectValue />
                </SelectTrigger>
                <SubjectCollectionSelectorContent subjectType={subjectType} />
              </Select>
            ) : (
              <div className="text-foreground px-2 text-sm font-medium">
                {getCollectionResourceLabel(resourceType)}
              </div>
            )}
            {isRefetching && <span className="i-mingcute-loading-line animate-spin text-2xl" />}
          </div>
          {resourceType === 'subject' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="no-drag-region size-8">
                  <SettingsIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuCheckboxItem
                  checked={showEpisodeList}
                  onCheckedChange={(value) => setShowEpisodeList(value === true)}
                  onSelect={(event) => event.preventDefault()}
                >
                  显示章节列表
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={useOneBasedEpisodeSort}
                  onCheckedChange={(value) => setUseOneBasedEpisodeSort(value === true)}
                  onSelect={(event) => event.preventDefault()}
                >
                  章节从 1 计数
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              className="no-drag-region size-8"
              onClick={() => setLeftPanelOpen(false)}
              size="icon"
              title="关闭收藏侧栏"
              variant="ghost"
            >
              <XIcon className="size-4" />
            </Button>
          )}
        </>
      )}
    </div>
  )
}

function getCollectionResourceLabel(resourceType: CollectionPanelResourceType) {
  return COLLECTION_RESOURCE_LABELS[resourceType]
}
