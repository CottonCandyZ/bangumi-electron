import { SearchFilterPanel } from '@renderer/modules/panel/right-panel/panels/search-filter-panel'
import { SubjectInfoPanel } from '@renderer/modules/panel/right-panel/panels/subject-info'
import { UserTimelinePanel } from '@renderer/modules/panel/right-panel/panels/user-timeline'
import { ReplyComposer } from '@renderer/modules/reply-composer/reply-composer'
import type { RightPanelContent } from '@renderer/state/panel'

export function RightPanel({ content }: { content: RightPanelContent | null }) {
  if (content === 'replyComposer') return <ReplyComposer />
  if (content === 'userTimeline') return <UserTimelinePanel />
  if (content === 'subjectInfo') return <SubjectInfoPanel />
  if (content === 'searchFilter') return <SearchFilterPanel />
  return null
}
