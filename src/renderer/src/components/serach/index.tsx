import SearchContent from '@renderer/components/serach/content'
import Filter from '@renderer/components/serach/filter'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { searchParamAtom } from '@renderer/state/search'
import { useAtom } from 'jotai'
import { useEffect, useRef, useState } from 'react'

export default function Search() {
  const [searchParm, setSearchParm] = useAtom(searchParamAtom)
  const [keyword, setKeyword] = useState(searchParm?.keyword ?? '')
  const [typeFilter, setTypeFilter] = useState(new Set(searchParm?.filter?.type))
  useEffect(() => {
    if (
      searchParm?.keyword !== undefined &&
      searchParm.keyword !== '' &&
      searchParm.filter?.tag?.length !== 0
    ) {
      setKeyword(searchParm?.keyword)
      setSearchParm({ ...searchParm, filter: { ...searchParm?.filter, type: [...typeFilter] } })
    }
  }, [typeFilter])
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="flex w-full flex-col gap-5">
      {/* input */}
      <search className="group flex w-full max-w-xl items-center gap-2 rounded-xl border bg-accent px-2 py-2 pl-4 transition-all duration-300 focus-within:bg-background focus-within:ring-1 focus-within:ring-ring hover:bg-background">
        <span className="i-mingcute-search-2-line text-4xl" />
        <input
          value={keyword}
          autoFocus
          ref={inputRef}
          className="w-full bg-transparent focus-visible:outline-none"
          onChange={(e) => setKeyword(e.target.value)}
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
          onClick={() => setSearchParm({ keyword, filter: { nsfw: true, type: [...typeFilter] } })}
        >
          搜索
        </Button>
      </search>
      <Filter type={{ typeFilter, setTypeFilter }} />

      {searchParm && <SearchContent searchParm={searchParm} />}
    </div>
  )
}
