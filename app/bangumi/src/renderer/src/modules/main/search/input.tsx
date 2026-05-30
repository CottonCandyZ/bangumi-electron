import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import { useSearchParams } from '@renderer/hooks/use-search-params'
import { cn } from '@renderer/lib/utils'
import { SearchCategorySelect } from '@renderer/modules/main/search/category-select'
import { useEffect, useRef, useState } from 'react'

export function SearchInput() {
  const [keyword, setKeywordState] = useState('')
  const [categorySelectOpen, setCategorySelectOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isComposingRef = useRef(false)
  const { category, keyword: searchKeyword, setKeyword } = useSearchParams()
  const submitKeyword = () => {
    setKeyword(keyword)
    inputRef.current?.blur()
  }

  useEffect(() => {
    setKeywordState(searchKeyword ?? '')
  }, [category, searchKeyword])

  return (
    <search
      className={cn(
        'group bg-accent/50 hover:bg-background focus-within:bg-background flex h-12 w-full items-center gap-2 rounded-lg border px-2 pl-4 transition-colors',
        categorySelectOpen && 'bg-background',
      )}
    >
      {/* search Icon */}
      <span className="i-mingcute-search-2-line text-4xl" />
      <SearchCategorySelect onOpenChange={setCategorySelectOpen} />
      <Separator orientation="vertical" className="h-5" />
      <input
        value={keyword}
        ref={inputRef}
        className="h-full w-full bg-transparent focus-visible:outline-hidden"
        onChange={(e) => setKeywordState(e.target.value)}
        onCompositionStart={() => {
          isComposingRef.current = true
        }}
        onCompositionEnd={(e) => {
          isComposingRef.current = false
          setKeywordState(e.currentTarget.value)
        }}
        onKeyDownCapture={(e) => {
          if (isComposingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return
          if (e.code === 'Enter') submitKeyword()
        }}
      />
      {/* clear Button */}
      <button
        className={cn(
          'i-mingcute-close-circle-fill group-focus-within:text-primary/30 group-hover:text-primary/30 hover:group-hover:text-primary/80 flex shrink-0 items-center justify-center text-xl text-transparent transition-all duration-300',
          keyword === '' &&
            'cursor-default group-focus-within:text-transparent group-hover:text-transparent hover:group-hover:text-transparent',
        )}
        onClick={() => {
          setKeywordState('')
          inputRef.current?.focus()
        }}
      />
      {/* search Button */}
      <Button
        className="rounded-lg"
        onClick={(e) => {
          submitKeyword()
          e.currentTarget.blur()
        }}
      >
        搜索
      </Button>
    </search>
  )
}
