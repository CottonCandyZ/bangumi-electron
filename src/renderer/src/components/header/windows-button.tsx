import { MaximizeIcon } from '@renderer/assets/svg-icons'
import { Button } from '@renderer/components/ui/button'
import { client, handlers } from '@renderer/lib/client'
import { Minus, Square, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const platform = await client.platform({})

export default function WindowsButton() {
  const [isMaximize, setIsMaximize] = useState(false)
  useEffect(() => {
    const unlisten = handlers.isMaximize.listen((maximize) => {
      setIsMaximize(maximize)
    })
    return unlisten
  }, [])
  return (
    platform === 'win32' && (
      <div className="flex h-full">
        <div className="no-drag-region flex h-full flex-row items-center">
          <Button
            className="h-full w-fit rounded-none px-3"
            variant="ghost"
            onClick={() => client.minimizeCurrentWindow({})}
          >
            <Minus strokeWidth={0.6} className="w-4" />
          </Button>
          <Button
            className="relative h-full w-fit rounded-none px-3"
            variant="ghost"
            onClick={() => client.toggleMaximizeCurrentWindow({})}
          >
            {isMaximize ? (
              <MaximizeIcon className="w-[15px]" />
            ) : (
              <Square strokeWidth={1} className="w-[15px]" />
            )}
          </Button>
          <Button
            className="h-full w-fit rounded-none px-3 pr-4 hover:bg-red-600 hover:text-white"
            variant="ghost"
            onClick={() => client.closeCurrentWindow({})}
          >
            <X strokeWidth={1} className="w-[20px]" />
          </Button>
        </div>
      </div>
    )
  )
}
