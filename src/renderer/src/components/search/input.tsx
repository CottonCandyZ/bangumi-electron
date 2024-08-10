import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { searchKeywordActionAtom, searchParamAtom } from '@renderer/state/search'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useRef, useState } from 'react'

export default function SearchInput() {
  const [keyword, setKeyword] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const searchParm = useAtomValue(searchParamAtom)
  const searchAction = useSetAtom(searchKeywordActionAtom)

  useEffect(() => {
    setKeyword(searchParm?.keyword ?? '')
  }, [searchParm])

  return (
    <search className="group flex w-full max-w-xl items-center gap-2 rounded-xl border bg-accent px-2 py-2 pl-4 transition-all duration-300 focus-within:bg-background focus-within:ring-1 focus-within:ring-ring hover:bg-background">
      <span className="i-mingcute-search-2-line text-4xl" />
      <input
        value={keyword}
        ref={inputRef}
        className="w-full bg-transparent focus-visible:outline-none"
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDownCapture={(e) => {
          if (keyword !== '' && e.code === 'Enter') {
            searchAction(keyword)
          }
        }}
      />
      <button
        className={cn(
          'i-mingcute-close-circle-fill flex shrink-0 items-center justify-center text-xl text-transparent transition-all duration-300 group-focus-within:text-primary/30 group-hover:text-primary/30 group-hover:hover:text-primary/80',
          keyword === '' &&
            'group-focus-within:text-transparent group-hover:text-transparent group-hover:hover:text-transparent',
        )}
        onClick={() => {
          setKeyword('')
          inputRef.current?.focus()
        }}
      />
      <Button
        className="rounded-lg"
        onClick={() => {
          if (keyword !== '') searchAction(keyword)
        }}
      >
        搜索
      </Button>
    </search>
  )
}
