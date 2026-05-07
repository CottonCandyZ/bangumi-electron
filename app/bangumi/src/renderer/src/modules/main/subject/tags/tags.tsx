import { Button } from '@renderer/components/ui/button'
import { CollectionData } from '@renderer/data/types/collection'
import { Subject } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'

export function Tags({
  subjectTags,
  collectionTags,
  onTagClicked,
  selectedTags,
  edit = false,
  setEdit,
}: {
  subjectTags: Subject['tags']
  collectionTags: CollectionData['tags'] | undefined
  onTagClicked?: (value: string) => void
  selectedTags?: Set<string>
  edit?: boolean
  setEdit?: (edit: boolean) => void
}) {
  const subjectTagsMap = new Map(subjectTags.map((item) => [item.name, item.count]))
  const subjectTagsSet = new Set(subjectTags.map((item) => item.name))
  const collectionTagsSet = new Set(collectionTags)
  const diff = collectionTagsSet.difference(subjectTagsSet)
  return (
    <div className="flex flex-row flex-wrap gap-2 after:grow-999">
      {[...subjectTagsMap]
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => (
          <Button
            type="button"
            key={name}
            className={cn(
              'relative h-auto flex-auto items-baseline justify-center gap-1 overflow-hidden px-1.5 py-1.5 whitespace-normal shadow-none',

              edit && selectedTags && selectedTags.has(name) && 'opacity-50',
            )}
            variant="outline"
            onClick={() => onTagClicked && onTagClicked(name)}
          >
            {collectionTagsSet.has(name) && (
              <div className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
            )}
            <span className="text-sm">{name}</span>
            <span className="text-muted-foreground text-xs">{count}</span>
          </Button>
        ))}
      {[...diff].map((item) => (
        <Button
          type="button"
          key={item}
          className={cn(
            'relative h-auto flex-auto items-baseline justify-center gap-1 overflow-hidden px-1.5 py-1.5 whitespace-normal shadow-none',
            edit && selectedTags && selectedTags.has(item) && 'opacity-50',
          )}
          variant="outline"
          onClick={() => onTagClicked && onTagClicked(item)}
        >
          <div className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
          <span className="text-sm">{item}</span>
        </Button>
      ))}
      {setEdit && collectionTags !== undefined && !edit && (
        <Button
          type="button"
          className="h-auto flex-auto gap-1 py-1.5 text-sm"
          variant="outline"
          onClick={() => setEdit(true)}
        >
          + 添加标签
        </Button>
      )}
    </div>
  )
}
