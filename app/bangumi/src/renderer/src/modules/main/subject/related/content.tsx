import { SectionFoldButton } from '@renderer/components/section-fold-button'
import { RelatedSubject } from '@renderer/data/types/subject'
import { useResizeObserver } from '@renderer/hooks/use-resize'
import { Item } from '@renderer/modules/main/subject/related/item'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

const RELATED_ITEM_MIN_WIDTH_REM = 7.5
const RELATED_GRID_GAP_REM = 0.75
const RELATED_ROWS_WHEN_FOLDED = 2

export function RelatedSubjectsGrid({
  relatedSubjects,
  filter,
}: {
  relatedSubjects: Map<string, RelatedSubject[]>
  filter: string
}) {
  const { pathname } = useLocation()
  // 切换页面或筛选时自动收起
  const foldKey = `${pathname}-${filter}`
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const fold = expandedKey !== foldKey
  const [columns, setColumns] = useState(6)
  const ref = useRef<HTMLDivElement>(null)
  const showRelation = filter === '全部'
  const items = showRelation
    ? [...relatedSubjects].flatMap(([relation, subjects]) =>
        subjects.map((subject) => ({ relation, subject })),
      )
    : (relatedSubjects.get(filter) ?? []).map((subject) => ({ relation: filter, subject }))
  const foldedCount = columns * RELATED_ROWS_WHEN_FOLDED
  const canFold = items.length > foldedCount

  const updateColumns = useCallback((width: number) => {
    const remPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const minWidth = RELATED_ITEM_MIN_WIDTH_REM * remPx
    const gap = RELATED_GRID_GAP_REM * remPx
    const next = Math.max(1, Math.floor((width + gap) / (minWidth + gap)))
    setColumns((prev) => (prev === next ? prev : next))
  }, [])

  useEffect(() => {
    if (ref.current) updateColumns(ref.current.getBoundingClientRect().width)
  }, [updateColumns])

  const handleResize = useCallback(
    (entry: ResizeObserverEntry) => updateColumns(entry.contentRect.width),
    [updateColumns],
  )

  useResizeObserver({ ref, callback: handleResize, deps: [handleResize] })

  return (
    <div className="flex flex-col gap-2" ref={ref}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-x-3 gap-y-4">
        {items
          .slice(0, fold && canFold ? foldedCount : items.length)
          .map(({ relation, subject }) => (
            <Item
              key={`${relation}-${subject.id}`}
              relatedSubject={subject}
              relation={showRelation ? relation : undefined}
            />
          ))}
      </div>
      {canFold && (
        <SectionFoldButton
          fold={fold}
          onToggle={() => setExpandedKey(fold ? foldKey : null)}
          total={items.length}
        />
      )}
    </div>
  )
}
