import type { SearchParam, SearchSubjectData } from '@renderer/data/types/search'

export function getSearchSubjectImage(item: SearchSubjectData) {
  return (
    item.image ||
    item.images?.grid ||
    item.images?.small ||
    item.images?.common ||
    item.images?.medium
  )
}

export function getSearchSubjectTitle(item: SearchSubjectData) {
  return item.name_cn || item.name
}

export function getSearchSubjectSubtitle(item: SearchSubjectData) {
  if (!item.name_cn) return null
  return item.name
}

export function createSearchPanelTitle(searchParam: SearchParam) {
  const keyword = searchParam.keyword?.trim()
  if (keyword) return `搜索 · ${keyword}`

  const tag = searchParam.filter?.tag?.[0]
  if (tag) return `标签 · ${tag}`

  const metaTag = searchParam.filter?.metaTag?.[0]
  if (metaTag) return `公共标签 · ${metaTag}`

  return '筛选搜索'
}

export function createSearchPanelId(searchParam: SearchParam) {
  return `search-${hashString(stableStringify(searchParam))}`
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, entryValue]) => `${key}:${stableStringify(entryValue)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function hashString(value: string) {
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index)
  }
  return (hash >>> 0).toString(36)
}
