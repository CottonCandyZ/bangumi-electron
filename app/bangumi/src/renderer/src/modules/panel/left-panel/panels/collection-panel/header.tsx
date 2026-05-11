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
import {
  sidePanelCollectionTypeFilterAtom,
  sidePanelShowEpisodeListAtom,
} from '@renderer/state/collection'
import { collectionPanelIsRefetchingAtom } from '@renderer/state/loading'
import { collectionPanelSubjectTypeAtom, collectionPanelUsernameAtom } from '@renderer/state/panel'
import { useAtom, useAtomValue } from 'jotai'
import { SettingsIcon } from 'lucide-react'

export function SubjectCollectionPanelHeader() {
  const subjectType = SubjectType[useAtomValue(collectionPanelSubjectTypeAtom)]
  const [filterMap, setCurrentTypeFilter] = useAtom(sidePanelCollectionTypeFilterAtom)
  const [showEpisodeList, setShowEpisodeList] = useAtom(sidePanelShowEpisodeListAtom)
  const userInfo = useSession()
  const panelUsername = useAtomValue(collectionPanelUsernameAtom)
  const currentSelect = filterMap.get(subjectType.toString()) ?? CollectionType['watching']
  const isRefetching = useAtomValue(collectionPanelIsRefetchingAtom)
  return (
    <div className="drag-region flex h-14 shrink-0 flex-row items-center justify-between gap-5 border-b px-2">
      {(!!userInfo || !!panelUsername) && (
        <>
          <div className="flex min-w-0 flex-row items-center gap-2">
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
            {isRefetching && <span className="i-mingcute-loading-line animate-spin text-2xl" />}
          </div>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  )
}
