import { InfoBox, InfoKey } from '@renderer/constants/types/subject'
import { RATING_MAP } from '@renderer/lib/utils/map'

export function getRating(score: number): (typeof RATING_MAP)[keyof typeof RATING_MAP] {
  return RATING_MAP[Math.floor(score + 0.5)] || RATING_MAP[1]
}

export function extractInfoBox(infoBox: InfoBox[], key: InfoKey): InfoBox | undefined {
  return infoBox.find((info) => info.key === key)
}

export function getPageArrayFromTotal(total: number, limit: number = 100) {
  const length = Math.floor(total / limit)
  const array: number[] = Array(length + 1)
  for (let i = 0; i <= length; i++) {
    array[i] = i * limit
  }
  return array
}
