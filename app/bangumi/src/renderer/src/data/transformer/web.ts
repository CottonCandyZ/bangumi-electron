// web 的 data transition
import { InfoBoxWeb, InfoBoxWebValue } from '@renderer/data/types/subject'
import type { TopList } from '@renderer/data/types/web'
import { AuthError } from '@renderer/lib/utils/error'
import { domParser } from '@renderer/lib/utils/parser'

/**
 * parse 每个分区右下角的 Top list，获得 subjectId 以及关注信息
 */
export const parseTopListFromHTML = (HTML: string) => {
  const dom = domParser.parseFromString(HTML, 'text/html')
  const result: TopList[] = []
  const top = dom.querySelectorAll('.subjectCover.cover.ll')
  for (const item of Array.from(top)) {
    const a = item as HTMLAnchorElement | null
    const SubjectId = a?.href.split('/').at(-1)
    result.push({ SubjectId })
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
    const items = item.classList.contains('sub_container')
      ? Array.from(item.querySelectorAll('li'))
      : [item]

    for (const infoItem of items) {
      const parsed = parseInfoBoxItem(infoItem)
      if (!parsed) continue
      const arr = result.get(parsed.key)
      if (arr) arr.push(...parsed.value)
      else result.set(parsed.key, parsed.value)
    }
  }
  return result
}

function parseInfoBoxItem(item: Element) {
  const keyNode = Array.from(item.children).find(
    (node) => node.nodeName === 'SPAN' && node.classList.contains('tip'),
  )
  const key = keyNode?.textContent
  const value: InfoBoxWebValue[] = []

  if (!key) return undefined

  for (const node of item.childNodes) {
    if (node === keyNode) continue

    if (node.nodeName === 'A') {
      const aNode = node as HTMLAnchorElement
      const href = aNode.getAttribute('href')

      if (aNode.textContent !== null && href !== null) {
        const id = href.split('/').at(-1)
        if (id !== undefined) {
          value.push({ name: aNode.textContent, id, href })
        }
      }
    }

    if (node.nodeName === '#text' && node.textContent !== null && node.textContent.trim() !== '') {
      value.push(node.textContent)
    }
  }

  return { key, value }
}

export const parseDeleteCollectionHash = (HTML: string) => {
  const match = HTML.match(/eraseSubjectCollect\(\d+,\s*'([^']+)'\)/)
  if (!match) throw AuthError.webCookieExpire()
  const hash = match[1]
  return hash
}
