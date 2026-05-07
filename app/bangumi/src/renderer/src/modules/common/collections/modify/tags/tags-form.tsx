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
      <div className="border-input flex w-full flex-col items-start gap-2 rounded-md border bg-transparent p-2 text-sm shadow-xs transition-colors">
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
        <div className="flex flex-row items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => onTagsChanges(new Set())}>
            清除
          </Button>
          <div>
            已选{' '}
            <span className={cn('font-bold text-blue-500', exceed && 'text-destructive')}>
              {tags.size}
            </span>{' '}
            个
          </div>
        </div>
      </div>
    </div>
  )
}
