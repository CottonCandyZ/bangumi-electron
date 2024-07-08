import dayjs from 'dayjs'

/**
 * 将 Date 转换成时间戳
 */
export function getTimestamp(date?: string, format?: string) {
  const day = dayjs(date?.trim(), format)
  return day.isValid() ? day.unix() : dayjs().unix()
}

/**
 * 用来获得当前 OnAir 进度
 * @param date Date 对象初始化字符串
 * @returns 0: 尚未播放 1: 正在播出 2: 播过了
 */
export function getOnAirStatus(date: string): 0 | 1 | 2 {
  const day = new Date(new Date(date).setHours(0))
  const sub = new Date().valueOf() - day.valueOf()
  if (sub < 0) return 0
  if (sub < 1000 * 60 * 60 * 24) return 1
  return 2
}
