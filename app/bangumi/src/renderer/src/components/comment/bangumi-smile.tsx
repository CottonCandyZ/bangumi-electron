import bangumiSmilesSprite from '@renderer/assets/comment/bangumi-smiles-sprite.png'
import type { CSSProperties } from 'react'

const BANGUMI_SMILE_PATTERN = /^bgm(0*[1-9]\d*)$/
const BANGUMI_SMILE_COUNT = 125
const BANGUMI_SMILE_COLUMNS = 25
const BANGUMI_SMILE_ROWS = Math.ceil(BANGUMI_SMILE_COUNT / BANGUMI_SMILE_COLUMNS)
const BANGUMI_SMILE_HOST = 'https://bgm.tv/img/smiles'

export const BANGUMI_SMILE_GROUPS = [
  {
    label: 'Cinnamor',
    value: 'cinnamor',
    iconCode: 'bgm24',
    codes: range(24, 125),
  },
  {
    label: '神戸小鳥',
    value: 'kobe',
    iconCode: 'bgm200',
    codes: range(200, 238),
  },
  {
    label: '五行行行行行啊',
    value: 'wuxing',
    iconCode: 'bgm518',
    codes: range(500, 529),
  },
  {
    label: 'dsm',
    value: 'dsm',
    iconCode: 'bgm01',
    codes: range(1, 23, true),
  },
]

const BANGUMI_TV_500_GIF_IDS = new Set([500, 501, 505, 515, 516, 517, 518, 519, 521, 522, 523])

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
  const externalSrc = getExternalBangumiSmileSrc(code)
  if (index === undefined && !externalSrc) return `(${code})`

  const classNames = [
    'bbcode-smile inline-block',
    variant === 'reaction'
      ? 'size-[17px] shrink-0 align-middle'
      : 'relative top-[2px] mx-0.5 size-5 align-baseline',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (externalSrc) {
    return (
      <img
        alt={`(${code})`}
        className={classNames}
        loading="lazy"
        referrerPolicy="no-referrer"
        src={externalSrc}
        title={`(${code})`}
      />
    )
  }

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
      className={classNames}
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

function getExternalBangumiSmileSrc(code: string) {
  const id = getBangumiSmileId(code)
  if (id === undefined) return undefined

  if (id >= 200 && id <= 238) {
    return `${BANGUMI_SMILE_HOST}/tv_vs/bgm_${id}.png`
  }
  if (id >= 500 && id <= 529) {
    const ext = BANGUMI_TV_500_GIF_IDS.has(id) ? 'gif' : 'png'
    return `${BANGUMI_SMILE_HOST}/tv_500/bgm_${id}.${ext}`
  }
  return undefined
}

function getBangumiSmileId(code: string) {
  const match = code.match(BANGUMI_SMILE_PATTERN)
  if (!match) return undefined

  const id = Number(match[1])
  return Number.isInteger(id) ? id : undefined
}

function getGridPosition(index: number, count: number) {
  if (count <= 1) return 0
  return (index / (count - 1)) * 100
}

function range(start: number, end: number, padded = false) {
  return Array.from({ length: end - start + 1 }, (_, index) => {
    const value = start + index
    const id = padded ? value.toString().padStart(2, '0') : value.toString()
    return `bgm${id}`
  })
}
