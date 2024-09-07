import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { searchKeywordActionAtom, searchParamAtom } from '@renderer/state/search'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useRef, useState } from 'react'

export function SearchInput() {
  const [keyword, setKeyword] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const searchParam = useAtomValue(searchParamAtom)
  const searchAction = useSetAtom(searchKeywordActionAtom)

  useEffect(() => {
    setKeyword(searchParam?.keyword ?? '')
  }, [searchParam])

  return (
    <search className="group flex h-12 w-full items-center gap-2 border-b bg-accent/50 px-2 pl-4 transition-colors focus-within:bg-background hover:bg-background">
      <span className="i-mingcute-search-2-line text-4xl" />
      <input
        value={keyword}
        ref={inputRef}
        className="h-full w-full bg-transparent focus-visible:outline-none"
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDownCapture={(e) => {
          if (keyword !== '' && e.code === 'Enter') {
            searchAction(keyword)
            inputRef.current?.blur()
          }
        }}
      />
      <button
        className={cn(
          'i-mingcute-close-circle-fill flex shrink-0 items-center justify-center text-xl text-transparent transition-all duration-300 group-focus-within:text-primary/30 group-hover:text-primary/30 group-hover:hover:text-primary/80',
          keyword === '' &&
            'cursor-default group-focus-within:text-transparent group-hover:text-transparent group-hover:hover:text-transparent',
        )}
        onClick={() => {
          setKeyword('')
          inputRef.current?.focus()
        }}
      />
      <Button
        className="rounded-lg"
        onClick={(e) => {
          if (keyword !== '') {
            searchAction(keyword)
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
