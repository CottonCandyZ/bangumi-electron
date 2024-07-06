import { InfoBox, InfoKey } from '@renderer/constants/types/subject'
import { RATING_MAP } from '@renderer/lib/utils/map'

export function getRating(score: number): (typeof RATING_MAP)[keyof typeof RATING_MAP] {
  return RATING_MAP[Math.floor(score + 0.5)] || RATING_MAP[1]
}

export function extractInfoBox(infoBox: InfoBox[], key: InfoKey): InfoBox | undefined {
  return infoBox.find((info) => info.key === key)
}
