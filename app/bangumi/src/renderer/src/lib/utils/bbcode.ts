import { createPreset } from '@bbob/preset'
import { render } from '@bbob/react'
import { cloneElement, createElement, Fragment, isValidElement, ReactNode } from 'react'
import { Link } from 'react-router-dom'
// noinspection ES6UnusedImports
import {} from '@bbob/types'

const URL_PATTERN = /https?:\/\/[^\s<>"'，。)）\]]+/g
const BANGUMI_HOSTS = new Set(['bangumi.tv', 'bgm.tv'])
const BANGUMI_ROUTE_PATTERN = /^\/(subject|person|character)\/(\d+)\/?$/

export const preset = createPreset({
  b: (node) => ({
    tag: 'strong',
    content: node.content,
  }),
  i: (node) => ({
    tag: 'em',
    content: node.content,
  }),
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
    render(content, preset(), { onlyAllowTags: ['b', 'i', 'mask', 'quote', 's', 'u', 'url'] }),
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

function linkifyNodes(nodes: ReactNode): ReactNode {
  if (typeof nodes === 'string') return linkifyText(nodes)
  if (typeof nodes === 'number') return nodes
  if (Array.isArray(nodes)) {
    return nodes.map((node, index) => createElement(Fragment, { key: index }, linkifyNodes(node)))
  }
  if (isValidElement<{ children?: ReactNode }>(nodes)) {
    if (nodes.type === 'a') return nodes
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

    if (index > lastIndex) parts.push(text.slice(lastIndex, index))
    parts.push(renderLink(href, `${href}-${index}`))
    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts.length > 0 ? parts : text
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
    return `/${match[1]}/${match[2]}`
  } catch {
    return undefined
  }
}
