import { Button } from '@renderer/components/ui/button'
import { Calendar } from '@renderer/components/ui/calendar'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { Separator } from '@renderer/components/ui/separator'
import { Switch } from '@renderer/components/ui/switch'
import { SubjectType } from '@renderer/data/types/subject'
import { useSearchParams } from '@renderer/hooks/use-search-params'
import { cn } from '@renderer/lib/utils'
import { TagInput } from '@renderer/modules/common/collections/modify/tags/tags-input'
import { SortButton } from '@renderer/modules/main/search/sort/sort-buttons'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const SUBJECT_TYPE_OPTIONS = [
  { value: SubjectType.book, label: '书籍' },
  { value: SubjectType.anime, label: '动画' },
  { value: SubjectType.music, label: '音乐' },
  { value: SubjectType.game, label: '游戏' },
  { value: SubjectType.real, label: '三次元' },
]

type RangeValue = {
  min: string
  max: string
}

export function SearchFilterPanel() {
  const {
    typeFilters,
    tagFilters,
    metaTagFilters,
    airDateFilters,
    ratingFilters,
    rankFilters,
    nsfw,
    sort,
    setTypeFilters,
    setTagFilters,
    setMetaTagFilters,
    setAirDateFilters,
    setRatingFilters,
    setRankFilters,
    setNsfw,
    setSort,
    clearFilters,
  } = useSearchParams()
  const [airDate, setAirDate] = useState<RangeValue>(() => parseRangeFilter(airDateFilters))
  const [rating, setRating] = useState<RangeValue>(() => parseRangeFilter(ratingFilters))
  const [rank, setRank] = useState<RangeValue>(() => parseRangeFilter(rankFilters))

  useEffect(() => setAirDate(parseRangeFilter(airDateFilters)), [airDateFilters])
  useEffect(() => setRating(parseRangeFilter(ratingFilters)), [ratingFilters])
  useEffect(() => setRank(parseRangeFilter(rankFilters)), [rankFilters])

  const hasFilters =
    typeFilters.length > 0 ||
    tagFilters.length > 0 ||
    metaTagFilters.length > 0 ||
    airDateFilters.length > 0 ||
    ratingFilters.length > 0 ||
    rankFilters.length > 0 ||
    nsfw

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="drag-region flex h-12 shrink-0 items-center justify-between border-b px-3">
        <h2 className="text-sm font-medium">搜索筛选</h2>
        <Button
          className="no-drag-region h-8 rounded-md px-2 text-xs shadow-none"
          variant="ghost"
          disabled={!hasFilters}
          onClick={clearFilters}
        >
          清除
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
        <FilterSection title="排序">
          <SortButton value={sort} onValueChanged={setSort} />
        </FilterSection>

        <FilterSection title="类型">
          <div className="grid grid-cols-2 gap-2">
            {SUBJECT_TYPE_OPTIONS.map((option) => {
              const checked = typeFilters.includes(option.value)

              return (
                <Label
                  key={option.value}
                  className="hover:bg-accent flex h-9 cursor-pointer items-center rounded-md border px-2"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => {
                      if (value) setTypeFilters([...typeFilters, option.value])
                      else setTypeFilters(typeFilters.filter((type) => type !== option.value))
                    }}
                  />
                  {option.label}
                </Label>
              )
            })}
          </div>
        </FilterSection>

        <FilterSection title="标签">
          <InlineTagInput
            tags={tagFilters}
            setTags={setTagFilters}
            placeholder="输入标签后按空格"
          />
        </FilterSection>

        <FilterSection title="元标签">
          <InlineTagInput
            tags={metaTagFilters}
            setTags={setMetaTagFilters}
            placeholder="输入元标签后按空格"
          />
        </FilterSection>

        <FilterSection title="放送日期">
          <DateRangeEditor
            value={airDate}
            onChange={setAirDate}
            onApply={() => setAirDateFilters(createRangeFilter(airDate))}
          />
        </FilterSection>

        <FilterSection title="评分">
          <NumberRangeEditor
            value={rating}
            min={0}
            max={10}
            step={0.1}
            placeholder={{ min: '最低分', max: '最高分' }}
            onChange={setRating}
            onApply={() => setRatingFilters(createRangeFilter(rating))}
          />
        </FilterSection>

        <FilterSection title="排名">
          <NumberRangeEditor
            value={rank}
            min={1}
            step={1}
            placeholder={{ min: '最高名次', max: '最低名次' }}
            onChange={setRank}
            onApply={() => setRankFilters(createRangeFilter(rank))}
          />
        </FilterSection>

        <Separator />

        <Label className="flex h-10 items-center justify-between">
          <span>包含 NSFW</span>
          <Switch checked={nsfw} onCheckedChange={setNsfw} />
        </Label>
      </div>
    </div>
  )
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-medium">{title}</h3>
      {children}
    </section>
  )
}

function InlineTagInput({
  tags,
  setTags,
  placeholder,
}: {
  tags: string[]
  setTags: (tags: string[]) => void
  placeholder: string
}) {
  return (
    <div className="border-input rounded-md border p-2">
      <TagInput
        tags={tags}
        placeholder={placeholder}
        add={(value) => {
          const tag = value.trim()
          if (!tag || tags.includes(tag)) return
          setTags([...tags, tag])
        }}
        remove={(value) => setTags(tags.filter((tag) => tag !== value))}
      />
    </div>
  )
}

function DateRangeEditor({
  value,
  onChange,
  onApply,
}: {
  value: RangeValue
  onChange: (value: RangeValue) => void
  onApply: () => void
}) {
  return (
    <RangeEditorShell onApply={onApply} active={value.min !== '' || value.max !== ''}>
      <DatePickerButton
        value={value.min}
        placeholder="开始日期"
        onChange={(next) => onChange({ ...value, min: next })}
      />
      <DatePickerButton
        value={value.max}
        placeholder="结束日期"
        onChange={(next) => onChange({ ...value, max: next })}
      />
    </RangeEditorShell>
  )
}

function DatePickerButton({
  value,
  placeholder,
  onChange,
}: {
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  const selected = parseDateValue(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            'h-9 justify-start rounded-md px-3 text-left font-normal shadow-xs',
            !selected && 'text-muted-foreground',
          )}
          variant="outline"
        >
          <CalendarIcon className="size-4" />
          <span className="min-w-0 truncate">
            {selected ? format(selected, 'yyyy-MM-dd') : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" collisionPadding={8} className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
        />
      </PopoverContent>
    </Popover>
  )
}

function NumberRangeEditor({
  value,
  min,
  max,
  step,
  placeholder,
  onChange,
  onApply,
}: {
  value: RangeValue
  min: number
  max?: number
  step: number
  placeholder: RangeValue
  onChange: (value: RangeValue) => void
  onApply: () => void
}) {
  return (
    <RangeEditorShell onApply={onApply} active={value.min !== '' || value.max !== ''}>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value.min}
        placeholder={placeholder.min}
        onChange={(event) => onChange({ ...value, min: event.target.value })}
      />
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value.max}
        placeholder={placeholder.max}
        onChange={(event) => onChange({ ...value, max: event.target.value })}
      />
    </RangeEditorShell>
  )
}

function RangeEditorShell({
  children,
  active,
  onApply,
}: {
  children: ReactNode
  active: boolean
  onApply: () => void
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
      {children}
      <Button
        className={cn('h-9 rounded-md px-2 shadow-none', active && 'bg-accent')}
        variant="outline"
        onClick={onApply}
      >
        应用
      </Button>
    </div>
  )
}

function parseRangeFilter(values: string[]): RangeValue {
  const min = values.find((value) => value.startsWith('>='))?.slice(2) ?? ''
  const max = values.find((value) => value.startsWith('<='))?.slice(2) ?? ''
  return { min, max }
}

function createRangeFilter(value: RangeValue) {
  return [
    value.min.trim() ? `>=${value.min.trim()}` : '',
    value.max.trim() ? `<=${value.max.trim()}` : '',
  ].filter(Boolean)
}

function parseDateValue(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return undefined

  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}
