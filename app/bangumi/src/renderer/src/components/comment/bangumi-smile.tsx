import bangumiSmilesSprite from '@renderer/assets/comment/bangumi-smiles-sprite.png'
import type { CSSProperties } from 'react'

const BANGUMI_SMILE_PATTERN = /^bgm([1-9]\d*)$/
const BANGUMI_SMILE_COUNT = 125
const BANGUMI_SMILE_COLUMNS = 25
const BANGUMI_SMILE_ROWS = Math.ceil(BANGUMI_SMILE_COUNT / BANGUMI_SMILE_COLUMNS)

export const REACTION_VALUE_TO_BANGUMI_SMILE: Record<number, string> = {
  0: 'bgm67',
  54: 'bgm38',
  62: 'bgm46',
  79: 'bgm63',
  80: 'bgm64',
  85: 'bgm69',
  88: 'bgm72',
  90: 'bgm74',
  104: 'bgm88',
  122: 'bgm106',
  140: 'bgm124',
  141: 'bgm125',
}

type BangumiSmileProps = {
  code: string
  className?: string
  variant?: 'inline' | 'reaction'
}

export function BangumiSmile({ code, className, variant = 'inline' }: BangumiSmileProps) {
  const index = getBangumiSmileIndex(code)
  if (index === undefined) return `(${code})`

  const column = index % BANGUMI_SMILE_COLUMNS
  const row = Math.floor(index / BANGUMI_SMILE_COLUMNS)
  const style: CSSProperties = {
    backgroundImage: `url(${bangumiSmilesSprite})`,
    backgroundPosition: `${getGridPosition(column, BANGUMI_SMILE_COLUMNS)}% ${getGridPosition(row, BANGUMI_SMILE_ROWS)}%`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${BANGUMI_SMILE_COLUMNS * 100}% ${BANGUMI_SMILE_ROWS * 100}%`,
  }

  return (
    <span
      aria-label={`(${code})`}
      className={[
        'bbcode-smile inline-block',
        variant === 'reaction'
          ? 'size-[17px] shrink-0 align-middle'
          : 'relative top-[2px] mx-0.5 size-5 align-baseline',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="img"
      style={style}
      title={`(${code})`}
    />
  )
}

function getBangumiSmileIndex(code: string) {
  const match = code.match(BANGUMI_SMILE_PATTERN)
  if (!match) return undefined

  const id = Number(match[1])
  if (!Number.isInteger(id) || id < 1 || id > BANGUMI_SMILE_COUNT) return undefined

  return id - 1
}

function getGridPosition(index: number, count: number) {
  if (count <= 1) return 0
  return (index / (count - 1)) * 100
}
