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
    <div className="flex flex-row flex-wrap gap-2 after:grow-[999]">
      {[...subjectTagsMap]
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => (
          <Button
            type="button"
            key={name}
            className={cn(
              'relative h-auto flex-auto items-baseline justify-center gap-1 overflow-hidden whitespace-normal px-1.5 py-1.5 shadow-none',

              edit && selectedTags && selectedTags.has(name) && 'opacity-50',
            )}
            variant={'outline'}
            onClick={() => onTagClicked && onTagClicked(name)}
          >
            {collectionTagsSet.has(name) && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
            <span className="text-sm">{name}</span>
            <span className="text-xs text-muted-foreground">{count}</span>
          </Button>
        ))}
      {[...diff].map((item) => (
        <Button
          type="button"
          key={item}
          className={cn(
            'relative h-auto flex-auto items-baseline justify-center gap-1 overflow-hidden whitespace-normal px-1.5 py-1.5 shadow-none',
            edit && selectedTags && selectedTags.has(item) && 'opacity-50',
          )}
          variant={'outline'}
          onClick={() => onTagClicked && onTagClicked(item)}
        >
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          <span className="text-sm">{item}</span>
        </Button>
      ))}
      {setEdit && collectionTags !== undefined && !edit && (
        <Button
          type="button"
          className="h-auto flex-auto gap-1 py-1.5 text-sm"
          variant={'outline'}
          onClick={() => setEdit(true)}
        >
          + 添加标签
        </Button>
      )}
    </div>
  )
}
