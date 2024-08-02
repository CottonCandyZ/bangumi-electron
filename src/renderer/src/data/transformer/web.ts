// web 的 data transition
import { InfoBoxWeb, InfoBoxWebValue } from '@renderer/data/types/subject'
import type { TopList } from '@renderer/data/types/web'
import { domParser } from '@renderer/lib/utils/parser'

/**
 * parse 每个分区右下角的 Top list，获得 subjectId 以及关注信息
 */
export const parseTopListFromHTML = (HTML: string) => {
  const dom = domParser.parseFromString(HTML, 'text/html')
  const result: TopList[] = []
  const top = dom.querySelectorAll('.imageCell')
  for (const item of Array.from(top)) {
    const a = item.firstElementChild as HTMLAnchorElement | null
    const SubjectId = a?.href.split('/').at(-1)
    const follow =
      item.nextElementSibling?.lastElementChild?.firstElementChild?.textContent ?? undefined
    result.push({ SubjectId, follow })
  }
  const sub = dom.querySelector('#chl_subitem > ul') as HTMLUListElement
  for (const item of Array.from(sub.children)) {
    const a = item.firstElementChild as HTMLAnchorElement
    const SubjectId = a.href.split('/').at(-1)
    const follow = item.querySelector('.feed')?.textContent ?? undefined
    result.push({ SubjectId, follow })
  }
  return result
}

/**
 * parse 左侧的 infobox
 */
export const parseInfoBoxFromSubjectPage = (HTML: string) => {
  const dom = domParser.parseFromString(HTML, 'text/html')
  const result: InfoBoxWeb = new Map()
  const infobox_list = dom.querySelector('#infobox')
  if (!infobox_list) return result
  for (const item of infobox_list.children) {
    let key: string | null = null
    const value: InfoBoxWebValue[] = []
    for (const node of item.childNodes) {
      if (node.nodeName === 'SPAN' && node.textContent !== null) {
        key = node.textContent
      }
      if (node.nodeName === 'A') {
        const aNode = node as HTMLAnchorElement
        if (aNode.textContent !== null && aNode.href !== null) {
          const id = aNode.href.split('/').at(-1)
          if (id !== undefined) {
            value.push({ name: aNode.textContent, id })
          }
        }
      }
      if (node.nodeName === '#text' && node.textContent !== null) {
        value.push(node.textContent)
      }
    }
    if (key !== null) {
      if (result.has(key)) {
        const arr = result.get(key)!
        arr.push(...value)
      } else {
        result.set(key, value)
      }
    }
  }
  return result
}

export const parseDeleteCollectionHash = (HTML: string) => {
  const match = HTML.match(/eraseSubjectCollect\(\d+,\s*'([^']+)'\)/)
  if (!match) return null
  const hash = match[1]
  return hash ?? null
}
