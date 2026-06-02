import { webFetch } from '@renderer/data/fetch/config'
import { domParser } from '@renderer/lib/utils/parser'

type WebTopicReplyKind = 'group' | 'subject'

export type CreateWebTopicReplyInput = {
  content: string
  kind: WebTopicReplyKind
  replyTo?: number
  topicId: number
}

export type CreateWebTopicReplyResponse = {
  id: number
}

export type DeleteWebTopicReplyInput = {
  commentId: number
  kind: WebTopicReplyKind
  topicId: number
}

export type UpdateWebTopicReplyInput = DeleteWebTopicReplyInput & {
  content: string
}

type WebTopicReplyForm = {
  action: string
  formHash: string
  html: string
  lastView?: string
}

type WebTopicReplyJsonResponse = {
  posts?: {
    main?: Record<string, unknown>
    sub?: Record<string, Record<string, unknown>>
  }
}

type WebTopicSubReplyMeta = {
  postId: number
  postUid: number
  quote?: {
    content: string
    name: string
  }
  subReplyUid: number
}

export async function createWebTopicReply({
  content,
  kind,
  replyTo = 0,
  topicId,
}: CreateWebTopicReplyInput): Promise<CreateWebTopicReplyResponse> {
  const form = await getTopicReplyForm({ kind, topicId })
  if (replyTo) {
    return await createWebTopicSubReply({ content, form, replyTo, topicId })
  }

  const body = new URLSearchParams({
    content,
    formhash: form.formHash,
    submit: '加上去',
  })

  if (form.lastView) {
    body.set('lastview', form.lastView)
  }

  const {
    _data: data,
    redirected,
    url,
  } = await webFetch.raw<string>(form.action, {
    method: 'post',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    parseResponse: (text) => text,
  })

  if (!redirected) {
    throw new Error(getWebReplyErrorMessage(data))
  }

  return {
    id: getPostId(url) ?? getPostId(data) ?? 0,
  }
}

export async function deleteWebTopicReply({ commentId, kind, topicId }: DeleteWebTopicReplyInput) {
  const form = await getTopicReplyForm({ kind, topicId })
  const eraseHref = getErasePostHref(form.html, commentId)

  if (!eraseHref) {
    throw new Error('未找到网页删除入口')
  }

  await webFetch.raw<string>(appendAjaxQuery(eraseHref), {
    method: 'get',
    credentials: 'include',
    parseResponse: (text) => text,
  })

  return {}
}

export async function updateWebTopicReply({
  commentId,
  content,
  kind,
  topicId,
}: UpdateWebTopicReplyInput) {
  const form = await getTopicReplyForm({ kind, topicId })
  const editHref = getEditPostHref(form.html, commentId)

  if (!editHref) {
    throw new Error('未找到网页编辑入口')
  }

  const editHtml = await webFetch<string>(editHref, {
    method: 'get',
    credentials: 'include',
    parseResponse: (text) => text,
  })
  const editForm = getEditPostForm(editHtml, editHref)
  const body = new URLSearchParams(editForm.fields)

  body.set('content', content)

  await webFetch.raw<string>(editForm.action, {
    method: 'post',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    parseResponse: (text) => text,
  })

  return {}
}

async function createWebTopicSubReply({
  content,
  form,
  replyTo,
  topicId,
}: {
  content: string
  form: WebTopicReplyForm
  replyTo: number
  topicId: number
}) {
  const replyMeta = getSubReplyMeta(form.html, replyTo)
  const postContent = replyMeta.quote
    ? `[quote][b]${replyMeta.quote.name}[/b] 说: ${replyMeta.quote.content}[/quote]\n${content}`
    : content
  const body = new URLSearchParams({
    content: postContent,
    formhash: form.formHash,
    lastview: form.lastView ?? '',
    post_id: String(replyMeta.postId),
    post_uid: String(replyMeta.postUid),
    related: String(replyMeta.postId),
    related_photo: '0',
    sub_reply_uid: String(replyMeta.subReplyUid),
    submit: 'submit',
    topic_id: String(topicId),
  })
  const { _data: data } = await webFetch.raw<WebTopicReplyJsonResponse>(`${form.action}?ajax=1`, {
    method: 'post',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  return {
    id: getJsonPostId(data, replyMeta.postId),
  }
}

async function getTopicReplyForm({ kind, topicId }: { kind: WebTopicReplyKind; topicId: number }) {
  const path = `/${kind}/topic/${topicId}`
  const html = await webFetch<string>(path, {
    method: 'get',
    credentials: 'include',
    parseResponse: (text) => text,
  })
  const doc = domParser.parseFromString(html, 'text/html')
  const form = doc.querySelector<HTMLFormElement>('form#ReplyForm')
  const formHash = form?.querySelector<HTMLInputElement>('input[name="formhash"]')?.value

  if (!form || !formHash) {
    throw new Error('未找到网页回复表单')
  }

  return {
    action: form.getAttribute('action') || path + '/new_reply',
    formHash,
    html,
    lastView: form.querySelector<HTMLInputElement>('input[name="lastview"]')?.value,
  }
}

function getSubReplyMeta(html: string, replyTo: number): WebTopicSubReplyMeta {
  const doc = domParser.parseFromString(html, 'text/html')
  const replyCalls = Array.from(
    html.matchAll(/subReply\('[^']+',\s*\d+,\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/g),
  )
  const match = replyCalls.find((call) => {
    const postId = Number(call[1])
    const subReplyId = Number(call[2])
    return postId === replyTo || subReplyId === replyTo
  })

  if (!match) {
    throw new Error('未找到网页楼中楼回复参数')
  }

  const postId = Number(match[1])
  const subReplyId = Number(match[2])
  const isSubReply = subReplyId === replyTo

  return {
    postId,
    postUid: Number(match[4]),
    quote: isSubReply ? getSubReplyQuote(doc, subReplyId) : undefined,
    subReplyUid: Number(match[3]),
  }
}

function getSubReplyQuote(doc: Document, subReplyId: number) {
  const post = doc.getElementById(`post_${subReplyId}`)
  const name = post?.querySelector<HTMLAnchorElement>(`a#${subReplyId}`)?.textContent?.trim()
  const contentElement = post?.querySelector<HTMLElement>('div.cmt_sub_content')

  if (!post || !name || !contentElement) {
    throw new Error('未找到网页楼中楼引用内容')
  }

  const contentClone = contentElement.cloneNode(true) as HTMLElement
  contentClone.querySelector('div.quote')?.remove()
  contentClone.querySelectorAll('span.text_mask').forEach((mask) => mask.remove())

  const content = (contentClone.textContent ?? '').replace(/\B@([^\W_]\w*)\b/g, '＠$1').trim()
  const truncatedContent = content.length > 100 ? `${content.slice(0, 100)}...` : content

  return {
    content: truncatedContent,
    name,
  }
}

function getPostId(value: string | undefined) {
  const match = value?.match(/post_(\d+)/)
  if (!match) return null
  return Number(match[1])
}

function getErasePostHref(html: string, commentId: number) {
  const doc = domParser.parseFromString(html, 'text/html')
  return (
    doc
      .querySelector<HTMLAnchorElement>(`a.erase_post[id="erase_${commentId}"]`)
      ?.getAttribute('href') ??
    Array.from(doc.querySelectorAll<HTMLAnchorElement>('a.erase_post'))
      .find((link) => link.getAttribute('href')?.includes(`/${commentId}`))
      ?.getAttribute('href') ??
    null
  )
}

function getEditPostHref(html: string, commentId: number) {
  const doc = domParser.parseFromString(html, 'text/html')
  const post = doc.getElementById(`post_${commentId}`)
  const link = post?.querySelector<HTMLAnchorElement>('a[href*="/edit"], a[href*="edit_reply"]')

  return link?.getAttribute('href') ?? null
}

function getEditPostForm(html: string, fallbackAction: string) {
  const doc = domParser.parseFromString(html, 'text/html')
  const form =
    doc.querySelector<HTMLFormElement>('form:has(textarea[name="content"])') ??
    doc.querySelector<HTMLFormElement>('form')

  if (!form) {
    throw new Error('未找到网页编辑表单')
  }

  const fields = new URLSearchParams()
  form.querySelectorAll<HTMLInputElement>('input[name]').forEach((input) => {
    if ((input.type === 'checkbox' || input.type === 'radio') && !input.checked) return
    fields.append(input.name, input.value)
  })
  form.querySelectorAll<HTMLTextAreaElement>('textarea[name]').forEach((textarea) => {
    fields.set(textarea.name, textarea.value)
  })

  return {
    action: form.getAttribute('action') || fallbackAction,
    fields,
  }
}

function getJsonPostId(data: WebTopicReplyJsonResponse | undefined, replyTo: number) {
  const subReplyIds = Object.keys(data?.posts?.sub?.[replyTo] ?? {}).map(Number)
  if (subReplyIds.length > 0) return Math.max(...subReplyIds)

  const mainReplyIds = Object.keys(data?.posts?.main ?? {}).map(Number)
  if (mainReplyIds.length > 0) return Math.max(...mainReplyIds)

  return 0
}

function getWebReplyErrorMessage(html: string | undefined) {
  if (!html) return '网页回复提交失败'

  const doc = domParser.parseFromString(html, 'text/html')
  const message =
    doc.querySelector('#colunmNotice .text')?.textContent?.trim() ||
    doc.querySelector('.errorMessage')?.textContent?.trim() ||
    doc.querySelector('title')?.textContent?.trim()

  return message || '网页回复提交失败'
}

function appendAjaxQuery(path: string) {
  return `${path}${path.includes('?') ? '&' : '?'}ajax=1`
}
