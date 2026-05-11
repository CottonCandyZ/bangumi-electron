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
const INLINE_TOKEN_PATTERN = /\((bgm\d+|musume_\d+|bmoC?[A-Za-z0-9_\-:=|.]*)\)/g
const BANGUMI_HOSTS = new Set(['bangumi.tv', 'bgm.tv'])
const BANGUMI_ROUTE_PATTERN = /^\/(subject|person|character|ep)\/(\d+)\/?$/
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
      onlyAllowTags: ['b', 'color', 'i', 'img', 'mask', 'quote', 's', 'size', 'u', 'url'],
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
          className: nodes.props.className ?? 'text-primary underline-offset-4 hover:underline',
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
    } else if (token.startsWith('musume_')) {
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
        className: 'text-primary underline-offset-4 hover:underline',
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
      className: 'text-primary underline-offset-4 hover:underline',
      key,
    },
    href,
  )
}

function getBangumiRoute(href: string) {
  try {
    const url = new URL(href)
    if (!BANGUMI_HOSTS.has(url.hostname)) return undefined
    const match = url.pathname.match(BANGUMI_ROUTE_PATTERN)
    if (!match) return undefined
    if (match[1] === 'ep') return `/episode/${match[2]}`
    return `/${match[1]}/${match[2]}`
  } catch {
    return undefined
  }
}
