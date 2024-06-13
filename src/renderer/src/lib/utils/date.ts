import dayjs from 'dayjs'

export function getTimestamp(date?: string, format?: string) {
  const day = dayjs(date?.trim(), format)
  return day.isValid() ? day.unix() : dayjs().unix()
}
