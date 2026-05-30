import { Community } from '@renderer/modules/main/community'
import { JSX } from 'react'

export function Component(): JSX.Element {
  return (
    <div className="mx-auto flex h-full min-h-full w-full flex-col">
      <Community />
    </div>
  )
}
