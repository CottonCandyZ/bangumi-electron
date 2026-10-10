import { TagInput } from '@renderer/modules/common/collections/modify/tags/tags-input'
import { CollectionData } from '@renderer/data/types/collection'
import { Subject } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { Tags } from '@renderer/modules/main/subject/tags/tags'
import { ScrollFade } from '@renderer/components/scroll-fade'
import { INPUT_LIMIT_CONFIG } from '@renderer/config'
import { useLayoutEffect, useRef, useState } from 'react'

const MIN_TAG_LIST_HEIGHT = 96

export function FormTags({
  subjectTags,
  selectedTags,
  collectionTags,
  onTagsChanges,
}: {
  subjectTags: Subject['tags']
  selectedTags: Set<string>
  collectionTags: CollectionData['tags'] | undefined
  onTagsChanges: (value: Set<string>) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [maxListHeight, setMaxListHeight] = useState<number>()

  useLayoutEffect(() => {
    const container = containerRef.current
    const form = container?.closest('form')
    const viewport = form?.parentElement
    const body = form?.firstElementChild
    const footer = form?.lastElementChild
    const list = container?.firstElementChild
    const lastSection = body?.lastElementChild
    if (!container || !form || !viewport || !body || !footer || !list || !lastSection) return

    const update = () => {
      const listRect = list.getBoundingClientRect()
      // Ignore the body's spare space so a taller window can expand the list again.
      const occupiedHeight =
        listRect.top -
        form.getBoundingClientRect().top +
        lastSection.getBoundingClientRect().bottom -
        listRect.bottom +
        parseFloat(getComputedStyle(body).paddingBottom) +
        footer.getBoundingClientRect().height
      setMaxListHeight(Math.max(MIN_TAG_LIST_HEIGHT, viewport.clientHeight - occupiedHeight))
    }
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    observer.observe(footer)
    observer.observe(container.lastElementChild!)
    for (const section of body.children) observer.observe(section)
    update()
    return () => observer.disconnect()
  }, [])

  const tags = selectedTags
  const updateTags = (updater: (next: Set<string>) => void) => {
    const next = new Set(tags)
    updater(next)
    onTagsChanges(next)
  }
  const exceed = tags.size > INPUT_LIMIT_CONFIG.tags_max_length_limit
  return (
    <div ref={containerRef} className="flex min-w-0 flex-col gap-3">
      <ScrollFade
        className="pr-2 [scrollbar-gutter:stable]"
        label="可选收藏标签"
        style={{ maxHeight: maxListHeight }}
      >
        <Tags
          subjectTags={subjectTags}
          collectionTags={collectionTags}
          onTagClicked={(value) => {
            updateTags((next) => {
              if (next.has(value)) next.delete(value)
              else next.add(value)
            })
          }}
          selectedTags={tags}
          edit
        />
      </ScrollFade>
      <div
        className={cn(
          'border-input focus-within:ring-ring flex w-full flex-row items-end gap-2 rounded-md border px-2 py-1.5 text-sm transition-colors focus-within:ring-1',
          exceed && 'border-destructive',
        )}
      >
        <div className="min-w-0 flex-1">
          <TagInput
            tags={[...tags]}
            add={(value) =>
              updateTags((next) => {
                const trimmed = value.trim()
                if (trimmed) next.add(trimmed)
              })
            }
            remove={(value) => {
              updateTags((next) => next.delete(value))
            }}
          />
        </div>
        <div className="flex h-8 shrink-0 flex-row items-center gap-2 pr-1 text-xs">
          {tags.size > 0 && (
            <button
              type="button"
              onClick={() => onTagsChanges(new Set())}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              清除
            </button>
          )}
          <span className={cn('text-muted-foreground tabular-nums', exceed && 'text-destructive')}>
            {tags.size}/{INPUT_LIMIT_CONFIG.tags_max_length_limit}
          </span>
        </div>
      </div>
    </div>
  )
}
