import { createPreset } from '@bbob/preset'
import { render } from '@bbob/react'
import { BangumiSmile } from '@renderer/components/comment/bangumi-smile'
import { BBCodeImage } from '@renderer/components/comment/bbcode-image'
import { Bmoji } from '@renderer/components/comment/bmoji'
import { DynamicSmile } from '@renderer/components/comment/dynamic-smile'
import { cloneElement, createElement, Fragment, isValidElement, ReactNode } from 'react'
import { Link } from 'react-router-dom'
// noinspection ES6UnusedImports
import {} from '@bbob/types'

const URL_PATTERN = /https?:\/\/[^\s<>"'，。)）\]]+/g
const INLINE_TOKEN_PATTERN = /\((bgm\d+|(?:musume|blake)_\d+|bmoC?[A-Za-z0-9_\-:=|.]*)\)/g
const BANGUMI_HOSTS = new Set(['bangumi.tv', 'bgm.tv', 'chii.in'])
const BANGUMI_ROUTE_PATTERN = /^\/(subject|person|character|ep)\/(\d+)\/?$/
const BANGUMI_TOPIC_ROUTE_PATTERN = /^\/(group|subject)\/topic\/(\d+)\/?$/
const BANGUMI_USER_ROUTE_PATTERN = /^\/user\/([^/?#]+)\/?$/
const BBCODE_LINK_CLASS =
  'text-blue-600 underline decoration-blue-500/45 underline-offset-2 transition-colors hover:text-blue-700 hover:decoration-blue-600 dark:text-blue-400 dark:decoration-blue-400/50 dark:hover:text-blue-300 dark:hover:decoration-blue-300'
const ALLOWED_COLOR_PATTERN =
  /^(#[0-9a-f]{3,8}|[a-z]+|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)|hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)|hsla\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*(0|1|0?\.\d+)\s*\))$/i

export const preset = createPreset({
  b: (node) => ({
    tag: 'strong',
    content: node.content,
  }),
  i: (node) => ({
    tag: 'em',
    content: node.content,
  }),
  color: (node) => {
    const color = sanitizeColor(getUrlAttr(node.attrs))
    return {
      tag: 'span',
      attrs: color ? { style: { color } } : undefined,
      content: node.content,
    }
  },
  code: (node) => ({
    tag: 'code',
    attrs: {
      className:
        'bg-muted text-foreground inline-block max-w-full overflow-x-auto rounded px-1.5 py-0.5 font-mono text-[0.92em] whitespace-pre-wrap',
    },
    content: node.content,
  }),
  img: (node, { render }) => {
    const src = normalizeUrl(render(node.content ?? []))

    if (!src) {
      return {
        tag: 'span',
        content: node.content,
      }
    }

    return {
      tag: 'img',
      attrs: {
        src,
        alt: '',
        loading: 'lazy',
        referrerPolicy: 'no-referrer',
      },
    }
  },
  mask: (node) => ({
    tag: 'span',
    attrs: { className: 'mask' },
    content: node.content,
  }),
  quote: (node) => ({
    tag: 'blockquote',
    content: node.content,
  }),
  right: (node) => ({
    tag: 'div',
    attrs: { className: 'text-muted-foreground text-right' },
    content: node.content,
  }),
  s: (node) => ({
    tag: 's',
    content: node.content,
  }),
  size: (node) => {
    const fontSize = sanitizeFontSize(getUrlAttr(node.attrs))
    return {
      tag: 'span',
      attrs: fontSize ? { style: { fontSize } } : undefined,
      content: node.content,
    }
  },
  u: (node) => ({
    tag: 'span',
    attrs: { className: 'underline' },
    content: node.content,
  }),
  user: (node, { render }) => {
    const userId = sanitizeUserPathSegment(getUrlAttr(node.attrs))
    const label = formatMentionLabel(render(node.content ?? []), userId)

    if (!userId) {
      return {
        tag: 'span',
        content: [label],
      }
    }

    return {
      tag: 'a',
      attrs: {
        href: `https://bgm.tv/user/${encodeURIComponent(userId)}`,
      },
      content: [label],
    }
  },
  url: (node, { render }) => {
    const href = normalizeUrl(getUrlAttr(node.attrs) ?? render(node.content ?? []))

    if (!href) {
      return {
        tag: 'span',
        content: node.content,
      }
    }

    return {
      tag: 'a',
      attrs: {
        href,
        target: '_blank',
        rel: 'noreferrer',
      },
      content: node.content,
    }
  },
})

export const renderBBCode = (content: string) => {
  return linkifyNodes(
    render(content, preset(), {
      onlyAllowTags: [
        'b',
        'code',
        'color',
        'i',
        'img',
        'mask',
        'quote',
        'right',
        's',
        'size',
        'u',
        'url',
        'user',
      ],
    }),
  )
}

function getUrlAttr(attrs?: Record<string, unknown>) {
  const attr = Object.values(attrs ?? {}).find(
    (value): value is string => typeof value === 'string',
  )
  return attr
}

function normalizeUrl(url: unknown) {
  const value = typeof url === 'string' ? url.trim().replace(/^(['"])(.*)\1$/, '$2') : ''
  if (!value) return undefined

  try {
    const parsed = new URL(value)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString()
  } catch {
    return undefined
  }

  return undefined
}

function sanitizeColor(color: unknown) {
  const value = typeof color === 'string' ? color.trim().replace(/^(['"])(.*)\1$/, '$2') : ''
  if (!value || !ALLOWED_COLOR_PATTERN.test(value)) return undefined
  return value
}

function sanitizeFontSize(size: unknown) {
  const value = typeof size === 'string' ? Number(size.trim().replace(/^(['"])(.*)\1$/, '$2')) : NaN
  if (!Number.isFinite(value)) return undefined

  return `${Math.min(32, Math.max(8, value))}px`
}

function sanitizeUserPathSegment(value: unknown) {
  const text = typeof value === 'string' ? value.trim().replace(/^(['"])(.*)\1$/, '$2') : ''
  if (!text) return undefined
  return text
}

function formatMentionLabel(label: unknown, fallback?: string) {
  const text = typeof label === 'string' ? label.trim() : ''
  const display = text || fallback || ''
  return display.startsWith('@') ? display : `@${display}`
}

function linkifyNodes(nodes: ReactNode): ReactNode {
  if (typeof nodes === 'string') return linkifyText(nodes)
  if (typeof nodes === 'number') return nodes
  if (Array.isArray(nodes)) {
    return nodes.map((node, index) => createElement(Fragment, { key: index }, linkifyNodes(node)))
  }
  if (
    isValidElement<{
      alt?: string
      children?: ReactNode
      className?: string
      href?: string
      src?: string
    }>(nodes)
  ) {
    if (nodes.type === 'a') {
      const href = typeof nodes.props.href === 'string' ? nodes.props.href : undefined
      if (!href) return nodes

      const route = getBangumiRoute(href)
      if (!route) return nodes

      return createElement(
        Link,
        {
          to: route,
          className: nodes.props.className ?? BBCODE_LINK_CLASS,
        },
        linkifyNodes(nodes.props.children),
      )
    }
    if (nodes.type === 'img') {
      const src = typeof nodes.props.src === 'string' ? nodes.props.src : undefined
      if (!src) return null

      return createElement(BBCodeImage, {
        src,
        alt: nodes.props.alt,
      })
    }
    return cloneElement(nodes, nodes.props, linkifyNodes(nodes.props.children))
  }
  return nodes
}

function linkifyText(text: string) {
  const parts: ReactNode[] = []
  let lastIndex = 0

  for (const match of text.matchAll(URL_PATTERN)) {
    const href = normalizeUrl(match[0])
    const index = match.index ?? 0
    if (!href) continue

    if (index > lastIndex)
      parts.push(...renderInlineTokens(text.slice(lastIndex, index), lastIndex))
    parts.push(renderLink(href, `${href}-${index}`))
    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) parts.push(...renderInlineTokens(text.slice(lastIndex), lastIndex))
  return parts.length > 0 ? parts : text
}

function renderInlineTokens(text: string, offset = 0) {
  const parts: ReactNode[] = []
  let lastIndex = 0

  for (const match of text.matchAll(INLINE_TOKEN_PATTERN)) {
    const token = match[1]
    const index = match.index ?? 0

    if (index > lastIndex) parts.push(text.slice(lastIndex, index))
    if (token.startsWith('bgm')) {
      parts.push(
        createElement(BangumiSmile, {
          code: token,
          key: `${token}-${offset + index}`,
        }),
      )
    } else if (token.startsWith('musume_') || token.startsWith('blake_')) {
      parts.push(
        createElement(DynamicSmile, {
          code: token,
          key: `${token}-${offset + index}`,
        }),
      )
    } else {
      parts.push(
        createElement(Bmoji, {
          code: token,
          key: `${token}-${offset + index}`,
        }),
      )
    }
    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts.length > 0 ? parts : [text]
}

function renderLink(href: string, key: string) {
  const route = getBangumiRoute(href)
  if (route) {
    return createElement(
      Link,
      {
        to: route,
        className: BBCODE_LINK_CLASS,
        key,
      },
      href,
    )
  }

  return createElement(
    'a',
    {
      href,
      target: '_blank',
      rel: 'noreferrer',
      className: BBCODE_LINK_CLASS,
      key,
    },
    href,
  )
}

function getBangumiRoute(href: string) {
  try {
    const url = new URL(href)
    if (!BANGUMI_HOSTS.has(url.hostname)) return undefined
    const topicMatch = url.pathname.match(BANGUMI_TOPIC_ROUTE_PATTERN)
    if (topicMatch) return `/${topicMatch[1]}/topic/${topicMatch[2]}`

    const userMatch = url.pathname.match(BANGUMI_USER_ROUTE_PATTERN)
    if (userMatch) return `/user/${encodeURIComponent(decodeURIComponent(userMatch[1]))}`

    const match = url.pathname.match(BANGUMI_ROUTE_PATTERN)
    if (!match) return undefined
    if (match[1] === 'ep') return `/episode/${match[2]}`
    return `/${match[1]}/${match[2]}`
  } catch {
    return undefined
  }
}
