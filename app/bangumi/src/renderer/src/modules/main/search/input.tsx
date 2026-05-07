import { Button } from '@renderer/components/ui/button'
import { useSearchParams } from '@renderer/hooks/use-search-params'
import { cn } from '@renderer/lib/utils'
import { useEffect, useRef, useState } from 'react'

export function SearchInput() {
  const [keyword, setKeywordState] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { keyword: searchKeyword, setKeyword } = useSearchParams()

  useEffect(() => {
    setKeywordState(searchKeyword ?? '')
  }, [searchKeyword])

  return (
    <search className="group bg-accent/50 focus-within:bg-background hover:bg-background flex h-12 w-full items-center gap-2 border-b px-2 pl-4 transition-colors">
      {/* search Icon */}
      <span className="i-mingcute-search-2-line text-4xl" />
      <input
        value={keyword}
        ref={inputRef}
        className="h-full w-full bg-transparent focus-visible:outline-hidden"
        onChange={(e) => setKeywordState(e.target.value)}
        onKeyDownCapture={(e) => {
          if (keyword !== '' && e.code === 'Enter') {
            setKeyword(keyword)
            inputRef.current?.blur()
          }
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
          if (keyword !== '') {
            setKeyword(keyword)
            inputRef.current?.blur()
            e.currentTarget.blur()
          }
        }}
      >
        搜索
      </Button>
    </search>
  )
}
