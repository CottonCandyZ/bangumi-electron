import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select'
import { SearchCategory } from '@renderer/data/types/search'
import { useSearchParams } from '@renderer/hooks/use-search-params'

const SEARCH_CATEGORY_OPTIONS: { value: SearchCategory; label: string }[] = [
  { value: 'subjects', label: '条目' },
  { value: 'characters', label: '角色' },
  { value: 'persons', label: '人物' },
]

export function SearchCategorySelect({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const { category, setCategory } = useSearchParams()

  return (
    <Select
      value={category}
      onValueChange={(value) => setCategory(value as SearchCategory)}
      onOpenChange={onOpenChange}
    >
      <SelectTrigger className="h-8 w-16 shrink-0 gap-1 border-0 bg-transparent px-1.5 shadow-none focus-visible:ring-0 [&_svg]:size-3.5">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        {SEARCH_CATEGORY_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
