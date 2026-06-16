import { COLLECTIONS, INDICES, webFetch } from '@renderer/data/fetch/config'
import { SubjectId } from '@renderer/data/types/bgm'
import { AuthError } from '@renderer/lib/utils/error'
import { domParser } from '@renderer/lib/utils/parser'

export async function deleteSubjectCollectionById({
  subjectId,
  hash,
}: {
  subjectId: SubjectId
  hash: string
}) {
  const text = await webFetch<string>(COLLECTIONS.DELETE_SUBJECT_BY_ID(subjectId), {
    parseResponse: (text) => text,
    credentials: 'include',
    query: {
      gh: hash,
    },
  })
  return text
}

export async function setIndexCollectionByWeb({
  collected,
  indexId,
}: {
  collected: boolean
  indexId: number
}) {
  const html = await webFetch<string>(INDICES.BY_ID(indexId), {
    credentials: 'include',
    parseResponse: (text) => text,
  })
  const actionHref = getIndexCollectionActionHref({ collected, html, indexId })

  if (!actionHref) {
    if (getIndexCollectionActionHref({ collected: !collected, html, indexId })) return {}
    throw AuthError.webCookieExpire()
  }

  await webFetch.raw<string>(actionHref, {
    credentials: 'include',
    parseResponse: (text) => text,
  })

  return {}
}

function getIndexCollectionActionHref({
  collected,
  html,
  indexId,
}: {
  collected: boolean
  html: string
  indexId: number
}) {
  const doc = domParser.parseFromString(html, 'text/html')
  const actionPath = collected
    ? INDICES.COLLECT_WEB_BY_ID(indexId)
    : INDICES.ERASE_COLLECT_WEB_BY_ID(indexId)

  return (
    Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href]'))
      .map((link) => link.getAttribute('href'))
      .find((href) => href?.startsWith(`${actionPath}?gh=`)) ?? null
  )
}
