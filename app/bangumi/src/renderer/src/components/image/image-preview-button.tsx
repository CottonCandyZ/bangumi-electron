import { openImagePreview } from '@renderer/components/comment/bbcode-image'
import { cn } from '@renderer/lib/utils'
import { Maximize2Icon } from 'lucide-react'
import { useState } from 'react'

type ImagePreviewButtonProps = {
  alt: string
  className?: string
  height?: number
  src: string
  width?: number
}

export function ImagePreviewButton({
  alt,
  className,
  height = 1600,
  src,
  width = 1200,
}: ImagePreviewButtonProps) {
  const [opening, setOpening] = useState(false)

  async function openPreview() {
    if (opening) return

    setOpening(true)
    try {
      const dimensions = await getImageDimensions(src).catch(() => ({ height, width }))
      openImagePreview(
        [
          {
            alt,
            height: dimensions.height,
            id: src,
            src,
            width: dimensions.width,
          },
        ],
        0,
      )
    } finally {
      setOpening(false)
    }
  }

  return (
    <button
      aria-label="查看大图"
      className={cn(
        'group focus-visible:ring-ring absolute inset-0 z-10 cursor-zoom-in rounded-[inherit] text-left focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        className,
      )}
      onClick={() => void openPreview()}
      type="button"
    >
      <span className="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        <Maximize2Icon className="size-4" />
      </span>
    </button>
  )
}

function getImageDimensions(src: string) {
  return new Promise<{ height: number; width: number }>((resolve, reject) => {
    const image = new Image()
    image.referrerPolicy = 'no-referrer'
    image.onload = () => {
      resolve({
        height: image.naturalHeight || 1600,
        width: image.naturalWidth || 1200,
      })
    }
    image.onerror = reject
    image.src = src
  })
}
