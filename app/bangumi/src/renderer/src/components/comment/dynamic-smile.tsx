import { cn } from '@renderer/lib/utils'
import type { CSSProperties } from 'react'

const DYNAMIC_SMILE_PATTERN = /^(musume)_(\d+)$/
const DYNAMIC_SMILE_HOST = 'https://lain.bgm.tv/img/smiles'
const DYNAMIC_SMILE_DISPLAY_SIZE = 36

export function DynamicSmile({ code, className }: { code: string; className?: string }) {
  const match = code.match(DYNAMIC_SMILE_PATTERN)
  if (!match) return `(${code})`

  const [, group] = match
  const src = `${DYNAMIC_SMILE_HOST}/${group}/${code}.gif`

  return (
    <img
      alt={`(${code})`}
      className={cn('bbcode-dynamic-smile inline-block', className)}
      loading="lazy"
      referrerPolicy="no-referrer"
      src={src}
      style={dynamicSmileStyle}
      title={`(${code})`}
    />
  )
}

const dynamicSmileStyle: CSSProperties = {
  height: DYNAMIC_SMILE_DISPLAY_SIZE,
  lineHeight: `${DYNAMIC_SMILE_DISPLAY_SIZE}px`,
  width: DYNAMIC_SMILE_DISPLAY_SIZE,
}
