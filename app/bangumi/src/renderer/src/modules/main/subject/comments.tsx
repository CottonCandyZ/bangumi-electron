import { CommentBox } from '@renderer/components/comment/comment-box'
import { Button } from '@renderer/components/ui/button'
import { useSubjectCommentsQuery } from '@renderer/data/hooks/api/subject'
import { toCommentFromSubjectInterest } from '@renderer/data/transformer/comment'
import { SubjectId } from '@renderer/data/types/bgm'
import { COMMENTS_TAB } from '@renderer/modules/panel/right-panel/panels/subject-info'
import { rightPanelOpenAtom } from '@renderer/state/panel'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useSetAtom } from 'jotai'
import { useCallback, useMemo, useState } from 'react'

const SUBJECT_COMMENTS_PREVIEW_LIMIT = 10

export function SubjectComments({ subjectId }: { subjectId: SubjectId }) {
  const [enabledCommentsId, setEnabledCommentsId] = useState<SubjectId | null>(null)
  const setRightPanelOpen = useSetAtom(rightPanelOpenAtom)
  const setTabFilter = useSetAtom(tabFilerAtom)
  const enableComments = useCallback(() => setEnabledCommentsId(subjectId), [subjectId])
  const commentsQuery = useSubjectCommentsQuery({
    id: subjectId,
    enabled: enabledCommentsId === subjectId,
    limit: SUBJECT_COMMENTS_PREVIEW_LIMIT,
  })
  const comments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page.data.map(toCommentFromSubjectInterest)),
    [commentsQuery.data],
  )
  const total = commentsQuery.data?.pages[0]?.total
  const hasMore = total !== undefined && comments !== undefined && comments.length < total

  const openCommentsPanel = () => {
    setTabFilter(`subject-right-panel-${subjectId}`, COMMENTS_TAB)
    setRightPanelOpen(true)
  }

  return (
    <CommentBox
      comments={comments}
      error={commentsQuery.isError}
      onInView={enableComments}
      footer={
        hasMore ? (
          <div className="flex justify-center">
            <Button variant="outline" onClick={openCommentsPanel}>
              在右侧栏查看更多 {comments.length}/{total}
            </Button>
          </div>
        ) : null
      }
    />
  )
}
