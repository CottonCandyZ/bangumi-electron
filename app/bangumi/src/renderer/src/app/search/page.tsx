import { Search } from '@renderer/modules/main/search'
import { JSX } from 'react'

export function Component(): JSX.Element {
  return (
    <div className="mx-auto flex min-h-full flex-col">
      <Search />
    </div>
  )
}
