// web 的 data transition
import type { TopList } from '@renderer/constants/types/web'
import { domParser } from '@renderer/lib/utils/parser'

export const selectTopListFromHTML = (HTML: string) => {
  const dom = domParser.parseFromString(HTML, 'text/html')
  const result: TopList[] = []
  const top = dom.querySelectorAll('.imageCell')
  for (const item of Array.from(top)) {
    const a = item.firstElementChild as HTMLAnchorElement | null
    const SubjectId = a?.href.split('/').at(-1)
    const follow = item.nextElementSibling?.lastElementChild?.firstElementChild?.textContent
    result.push({ SubjectId, follow })
  }
  const sub = dom.querySelector('#chl_subitem > ul') as HTMLUListElement
  for (const item of Array.from(sub.children)) {
    const a = item.firstElementChild as HTMLAnchorElement
    const SubjectId = a.href.split('/').at(-1)
    const follow = item.querySelector('.feed')?.textContent
    result.push({ SubjectId, follow })
  }
  return result
}
