import { OnAirStatus } from '@renderer/data/types/bgm'
import dayjs from 'dayjs'

/**
 * 将 Date 转换成时间戳
 */
export function getTimestamp(date?: string, format?: string) {
  const day = dayjs(date?.trim(), format)
  return day.isValid() ? day.unix() : dayjs().unix()
}

export function formatRecentUnixTime(
  timestamp: number,
  {
    absoluteFormat = 'YYYY-MM-DD HH:mm',
    recentLimitSeconds = 60 * 60 * 24 * 2,
  }: {
    absoluteFormat?: string
    recentLimitSeconds?: number
  } = {},
) {
  const diffSeconds = dayjs().unix() - timestamp

  if (diffSeconds < 0 || diffSeconds >= recentLimitSeconds) {
    return dayjs.unix(timestamp).format(absoluteFormat)
  }

  const minutes = Math.max(1, Math.floor(diffSeconds / 60))
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m ago` : `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return remainingHours > 0 ? `${days}d ${remainingHours}h ago` : `${days}d ago`
}

/**
 * 用来获得当前 OnAir 进度
 * @param date Date 对象初始化字符串
 */
export function getOnAirStatus(date: string): OnAirStatus {
  const day = new Date(new Date(date).setHours(0))
  const sub = new Date().valueOf() - day.valueOf()
  if (sub < 0) return 'noAired'
  if (sub < 1000 * 60 * 60 * 24) return 'onAir'
  return 'aired'
}
