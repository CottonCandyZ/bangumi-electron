import { webFetch } from '@renderer/constants/config'
import { domParser } from '@renderer/lib/utils/parser'
// 一些爬虫？

export type TopList = {
  subjectNumber: string | null | undefined
  follow: string | null | undefined
}
/**
 * Bangumi 成员关注动画榜，此为每个类目首页页面右下角的内容
 *
 * @param cartography 类别
 * @returns 包含条目号码和关注人数的数组
 */
export async function getTopList(cartography: string) {
  const data = await webFetch<Document>(`/${cartography}`, {
    parseResponse: (text) => domParser.parseFromString(text, 'text/html'),
  })
  const result: TopList[] = []
  const top = data.querySelectorAll('.imageCell')
  for (const item of Array.from(top)) {
    const a = item.firstElementChild as HTMLAnchorElement | null
    const subjectNumber = a?.href.split('/').at(-1)
    const follow = item.nextElementSibling?.lastElementChild?.firstElementChild?.textContent
    result.push({ subjectNumber, follow })
  }
  const sub = data.querySelector('#chl_subitem > ul') as HTMLUListElement
  for (const item of Array.from(sub.children)) {
    const a = item.firstElementChild as HTMLAnchorElement
    const subjectNumber = a.href.split('/').at(-1)
    const follow = item.nextElementSibling?.lastElementChild?.firstElementChild?.textContent
    result.push({ subjectNumber, follow })
  }
  return result
}
