import { CollectionData } from '@renderer/data/types/collection'
import { Subject } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'

const TAG_CLASS_NAME =
  'inline-flex items-baseline gap-1 rounded-md px-2 py-1 text-sm transition-[background-color,color,transform] active:scale-[0.97] focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-hidden'

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
  const tags: [string, number | undefined][] = [
    ...[...subjectTagsMap].sort((a, b) => b[1] - a[1]),
    ...[...diff].map((name) => [name, undefined] as [string, undefined]),
  ]

  return (
    <div className="flex flex-row flex-wrap gap-1.5">
      {tags.map(([name, count]) => {
        const mine = collectionTagsSet.has(name)
        return (
          <button
            type="button"
            key={name}
            className={cn(
              TAG_CLASS_NAME,
              // 悬停时往前景色方向加深一点，浅色/深色主题下都清晰可辨（brightness 会把浅蓝冲成白色）
              mine
                ? 'bg-(--watched-accent) text-(--watched-accent-foreground) hover:bg-[color-mix(in_oklab,var(--watched-accent),var(--watched-accent-foreground)_14%)]'
                : 'bg-foreground/[0.05] text-foreground/80 hover:bg-foreground/[0.1] hover:text-foreground',
              edit && selectedTags?.has(name) && 'opacity-50',
            )}
            onClick={() => onTagClicked?.(name)}
          >
            <span>{name}</span>
            {count !== undefined && (
              <span
                className={cn(
                  'text-xs tabular-nums',
                  mine ? 'text-(--watched-accent-foreground)/70' : 'text-muted-foreground',
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
      {setEdit && collectionTags !== undefined && !edit && (
        <button
          type="button"
          className={cn(
            TAG_CLASS_NAME,
            'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] border border-dashed',
          )}
          onClick={() => setEdit(true)}
        >
          + 添加标签
        </button>
      )}
    </div>
  )
}
