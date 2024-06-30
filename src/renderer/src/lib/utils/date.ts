import dayjs from 'dayjs'

/**
 * 将 Date 转换成时间戳
 */
export function getTimestamp(date?: string, format?: string) {
  const day = dayjs(date?.trim(), format)
  return day.isValid() ? day.unix() : dayjs().unix()
}
