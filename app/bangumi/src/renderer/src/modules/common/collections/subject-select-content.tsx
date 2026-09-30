import { SelectContent, SelectItem } from '@renderer/components/ui/select'
import { CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'

export const COLLECTION_STATUS_DOT: Record<CollectionType, string> = {
  // 中等饱和与明度：既不是糖果色，也不发灰
  [CollectionType.wantToWatch]: 'text-[oklch(0.72_0.1_10)]',
  [CollectionType.watched]: 'text-[oklch(0.68_0.1_240)]',
  [CollectionType.watching]: 'text-[oklch(0.7_0.11_160)]',
  [CollectionType.aside]: 'text-[oklch(0.78_0.1_80)]',
  [CollectionType.abandoned]: 'text-[oklch(0.7_0.01_260)]',
}

export function CollectionStatusDot({
  type,
  className,
}: {
  type: CollectionType
  className?: string
}) {
  return (
    // 用 SVG 画圆：非整数缩放下 div 圆角会被抗锯齿成不规则形状
    <svg
      aria-hidden
      viewBox="0 0 8 8"
      // CJK 字形重心偏下，圆点下移半像素才在视觉上居中
      className={cn(
        'size-1.5 shrink-0 translate-y-[0.5px]',
        COLLECTION_STATUS_DOT[type],
        className,
      )}
    >
      <circle cx="4" cy="4" r="4" fill="currentColor" />
    </svg>
  )
}

export function SubjectCollectionSelectorContent({ subjectType }: { subjectType: SubjectType }) {
  return (
    <SelectContent align="start">
      {Object.keys(CollectionType)
        .slice(0, Object.keys(CollectionType).length / 2)
        .map((item) => (
          <SelectItem value={item.toString()} key={item}>
            <span className="flex items-center gap-2">
              <CollectionStatusDot type={Number(item) as CollectionType} />
              {COLLECTION_TYPE_MAP(subjectType)[item]}
            </span>
          </SelectItem>
        ))}
    </SelectContent>
  )
}
