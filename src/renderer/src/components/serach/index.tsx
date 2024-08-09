import SearchContent from '@renderer/components/serach/content'
import Filter from '@renderer/components/serach/filter'
import { Button } from '@renderer/components/ui/button'
import { searchParamAtom } from '@renderer/state/search'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'

export default function Search() {
  const [searchParm, setSearchParm] = useAtom(searchParamAtom)
  const [keyword, setKeyword] = useState(searchParm?.keyword)
  const [typeFilter, setTypeFilter] = useState(new Set(searchParm?.filter?.type))
  useEffect(() => {
    if (
      searchParm?.keyword !== undefined &&
      searchParm?.keyword !== '' &&
      searchParm.filter?.tag?.length !== 0
    )
      setSearchParm({ keyword, filter: { nsfw: true, type: [...typeFilter] } })
  }, [typeFilter])
  return (
    <div className="flex w-full flex-col gap-5">
      {/* input */}
      <div className="flex w-full max-w-xl items-center gap-2 rounded-xl border px-2 py-2 pl-4 focus-within:ring-1 focus-within:ring-ring">
        <span className="i-mingcute-search-2-line text-4xl" />
        <input
          value={keyword}
          className="w-full bg-background focus-visible:outline-none"
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Button
          className="rounded-lg"
          onClick={() => setSearchParm({ keyword, filter: { nsfw: true, type: [...typeFilter] } })}
        >
          搜索
        </Button>
      </div>
      <Filter type={{ typeFilter, setTypeFilter }} />

      {searchParm && <SearchContent searchParm={searchParm} />}
    </div>
  )
}
