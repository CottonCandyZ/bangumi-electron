import { Tabs } from '@renderer/components/tabs'
import { SubjectPersonTable } from '@renderer/modules/main/subject/person'
import { SubjectCommentsPanel } from '@renderer/modules/panel/right-panel/panels/subject-comments'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useAtom } from 'jotai'
import { useParams } from 'react-router-dom'

export const BASIC_INFO_TAB = '基础信息'
export const COMMENTS_TAB = '吐槽箱'
const SUBJECT_INFO_TABS = new Set([BASIC_INFO_TAB, COMMENTS_TAB])

export function SubjectInfoPanel() {
  const subjectId = useParams().subjectId
  const [filterMap, setFilter] = useAtom(tabFilerAtom)

  if (!subjectId) return null

  const tabId = `subject-right-panel-${subjectId}`
  const currentTab = filterMap.get(tabId) ?? BASIC_INFO_TAB

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="drag-region flex h-14 shrink-0 items-center border-b px-3">
        <div className="no-drag-region">
          <Tabs
            currentSelect={currentTab}
            setCurrentSelect={setFilter}
            tabsContent={SUBJECT_INFO_TABS}
            layoutId={tabId}
          />
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {currentTab === BASIC_INFO_TAB ? (
          <SubjectPersonTable subjectId={subjectId} />
        ) : (
          <SubjectCommentsPanel subjectId={subjectId} enabled={currentTab === COMMENTS_TAB} />
        )}
      </div>
    </div>
  )
}
