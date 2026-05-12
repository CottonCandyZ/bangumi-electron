import { Search } from '@renderer/modules/main/search'
import { JSX } from 'react'

export function Component(): JSX.Element {
  return (
    <div className="mx-auto flex h-full min-h-full w-full flex-col">
      <Search />
    </div>
  )
}
