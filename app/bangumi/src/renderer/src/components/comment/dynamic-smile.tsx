import { cn } from '@renderer/lib/utils'
import type { CSSProperties } from 'react'

const DYNAMIC_SMILE_PATTERN = /^(musume|blake)_(\d+)$/
const DYNAMIC_SMILE_HOST = 'https://lain.bgm.tv/img/smiles'
const DYNAMIC_SMILE_DISPLAY_SIZE = 52

const DYNAMIC_SMILE_SECTIONS = [
  {
    label: '情绪反应',
    ids: [...range(6, 42), '100', '106', '108', '118'],
  },
  {
    label: '动作道具',
    ids: [
      ...range(43, 76),
      '101',
      '102',
      '103',
      '99',
      '107',
      '112',
      '109',
      '110',
      '111',
      '113',
      '114',
      '115',
      '116',
      '117',
      '97',
      '98',
    ],
  },
  {
    label: '日常状态',
    ids: [...range(77, 93), '104', '105', ...range(94, 96)],
  },
  {
    label: '提示反馈',
    ids: range(1, 5, true),
  },
]

export const DYNAMIC_SMILE_GROUPS = [
  {
    iconCode: 'musume_03',
    label: 'Bangumi 娘 Riff',
    value: 'musume',
    sections: createDynamicSmileSections('musume'),
  },
  {
    iconCode: 'blake_03',
    label: '布莱克·樱 Riff',
    value: 'blake',
    sections: createDynamicSmileSections('blake'),
  },
]

export const DYNAMIC_SMILE_CODES = DYNAMIC_SMILE_GROUPS.flatMap((group) =>
  group.sections.flatMap((section) => section.codes),
)

export function DynamicSmile({
  className,
  code,
  size = DYNAMIC_SMILE_DISPLAY_SIZE,
}: {
  className?: string
  code: string
  size?: number
}) {
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
      style={getDynamicSmileStyle(size)}
      title={`(${code})`}
    />
  )
}

function range(start: number, end: number, padded = false) {
  return Array.from({ length: end - start + 1 }, (_, index) => {
    const value = start + index
    return padded || value < 10 ? value.toString().padStart(2, '0') : value.toString()
  })
}

function createDynamicSmileSections(group: 'blake' | 'musume') {
  return DYNAMIC_SMILE_SECTIONS.map((section) => ({
    ...section,
    codes: section.ids
      .filter((id) => group === 'blake' || (id !== '97' && id !== '98'))
      .map((id) => `${group}_${id}`),
  }))
}

function getDynamicSmileStyle(size: number): CSSProperties {
  return {
    height: size,
    lineHeight: `${size}px`,
    width: size,
  }
}
