import { ASSERT_HOST } from '@renderer/data/fetch/config'
import { InfoBox, InfoKey } from '@renderer/data/types/subject'
import { RATING_MAP } from '@renderer/lib/utils/map'

/** 获得评分对应的文字描述 */
export function getRating(score: number): (typeof RATING_MAP)[keyof typeof RATING_MAP] {
  return RATING_MAP[Math.floor(score + 0.5)] || RATING_MAP[1]
}

/** 获得 info box 里的某个字段对应的数据 */
export function extractInfoBox(infoBox: InfoBox[], key: InfoKey): InfoBox | undefined {
  return infoBox.find((info) => info.key === key)
}

/** 获得分页时展示的分页选项 */
export function getPageArrayFromTotal(total: number, limit: number = 100) {
  const length = Math.floor(total / limit)
  const array: number[] = Array(length + 1)
  for (let i = 0; i <= length; i++) {
    array[i] = i * limit
  }
  return array
}

/** 把秒转换成小时分钟秒 */
export function getDurationFromSeconds(total_seconds: number) {
  const seconds = total_seconds % 60
  const mins = Math.floor(total_seconds / 60)
  const hours = Math.floor(total_seconds / (60 * 60))
  return { hours, mins, seconds }
}

export function getCharacterAvatarURL(largeUrl: string) {
  // lain.bgm.tv/pic/crt/l/8f/16/150623_crt_Yuczy.jpg?r=1705076939
  // lain.bgm.tv/pic/crt/g/8f/16/150623_crt_Yuczy.jpg?r=1705076939
  return largeUrl.replace('/l/', '/g/')
}

export function getUserAvatar(avatar: string) {
  return {
    large: `${ASSERT_HOST}/${avatar}`,
    medium: `${ASSERT_HOST}/r/200/${avatar}`,
    small: `${ASSERT_HOST}/r/100/${avatar}`,
  }
}
