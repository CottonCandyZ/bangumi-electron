import { TagInput } from '@renderer/modules/common/collections/modify/tags/tags-input'
import { Button } from '@renderer/components/ui/button'
import { CollectionData } from '@renderer/data/types/collection'
import { Subject } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { Tags } from '@renderer/modules/main/subject/tags/tags'

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
  const tags = selectedTags
  const updateTags = (updater: (next: Set<string>) => void) => {
    const next = new Set(tags)
    updater(next)
    onTagsChanges(next)
  }
  const exceed = tags.size > 10
  return (
    <div className="flex flex-col gap-2">
      <div className="max-h-36 overflow-y-auto pr-1">
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
      </div>
      <div className="border-border/70 flex w-full flex-col items-start gap-2 rounded-md border p-2.5 text-sm transition-colors">
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
        <div className="flex w-full flex-row items-center justify-between gap-2">
          <div className="text-muted-foreground">
            已选{' '}
            <span
              className={cn(
                'text-foreground font-medium tabular-nums',
                exceed && 'text-destructive',
              )}
            >
              {tags.size}
            </span>{' '}
            个
          </div>
          <Button
            className="h-8 px-2 text-xs"
            disabled={tags.size === 0}
            onClick={() => onTagsChanges(new Set())}
            type="button"
            variant="ghost"
          >
            清除
          </Button>
        </div>
      </div>
    </div>
  )
}
