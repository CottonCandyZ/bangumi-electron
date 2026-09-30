import { BangumiSmile } from '@renderer/components/comment/bangumi-smile'
import { DynamicSmile } from '@renderer/components/comment/dynamic-smile'
import { syntaxTree } from '@codemirror/language'
import type { EditorState, Range } from '@codemirror/state'
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@codemirror/view'
import { createRoot, type Root } from 'react-dom/client'

/**
 * Markdown 实时渲染（类似 Obsidian Live Preview）：
 * - Markdown 源码始终是唯一的数据来源，这里只添加装饰；
 * - 光标/选区不在某个元素内时隐藏其语法标记，进入元素时恢复源码方便编辑；
 * - 额外渲染 Bangumi 表情和常用 BBCode（[mask] [color] [size] [u] [b] [i] [s]）。
 */

const HIDDEN = Decoration.replace({})

const SMILE_PATTERN = /\((bgm\d+|musume_\d+|blake_\d+)\)/g
const BBCODE_SIMPLE_PATTERN = /\[(mask|u|b|i|s)\]([^\n]*?)\[\/\1\]/g
const BBCODE_VALUE_PATTERN = /\[(color|size)=([^\]\n]+)\]([^\n]*?)\[\/\1\]/g
const SAFE_COLOR_PATTERN = /^(#[0-9a-f]{3,8}|[a-z]+)$/i

const BBCODE_CLASS: Record<string, string> = {
  b: 'cm-lp-strong',
  i: 'cm-lp-em',
  mask: 'cm-lp-mask',
  s: 'cm-lp-strike',
  u: 'cm-lp-underline',
}

const smileRoots = new WeakMap<HTMLElement, Root>()

class SmileWidget extends WidgetType {
  constructor(readonly code: string) {
    super()
  }

  eq(other: SmileWidget) {
    return other.code === this.code
  }

  toDOM() {
    const element = document.createElement('span')
    element.className = 'cm-lp-smile'
    const root = createRoot(element)
    root.render(
      this.code.startsWith('bgm') ? (
        <BangumiSmile code={this.code} />
      ) : (
        <DynamicSmile code={this.code} size={40} />
      ),
    )
    smileRoots.set(element, root)
    return element
  }

  destroy(dom: HTMLElement) {
    const root = smileRoots.get(dom)
    if (!root) return undefined
    smileRoots.delete(dom)
    // 延迟卸载，避免在 CodeMirror 更新 DOM 的过程中同步卸载 React 树
    queueMicrotask(() => root.unmount())
  }
}

class ImageWidget extends WidgetType {
  constructor(
    readonly src: string,
    readonly alt: string,
  ) {
    super()
  }

  eq(other: ImageWidget) {
    return other.src === this.src && other.alt === this.alt
  }

  toDOM() {
    const image = document.createElement('img')
    image.className = 'cm-lp-image'
    image.src = this.src
    image.alt = this.alt
    image.referrerPolicy = 'no-referrer'
    image.loading = 'lazy'
    return image
  }
}

function selectionTouches(state: EditorState, from: number, to: number) {
  return state.selection.ranges.some((range) => range.from <= to && range.to >= from)
}

function buildDecorations(view: EditorView): DecorationSet {
  const { state } = view
  const decorations: Range<Decoration>[] = []
  const tree = syntaxTree(state)
  // 代码内的文本不做表情 / BBCode 渲染
  const codeRanges: Array<[number, number]> = []

  for (const { from, to } of view.visibleRanges) {
    tree.iterate({
      from,
      to,
      enter: (node) => {
        const name = node.name
        const parent = node.node.parent
        const parentRevealed = parent ? selectionTouches(state, parent.from, parent.to) : false

        const headingMatch = /^ATXHeading(\d)$/.exec(name)
        if (headingMatch) {
          const line = state.doc.lineAt(node.from)
          decorations.push(Decoration.line({ class: `cm-lp-h${headingMatch[1]}` }).range(line.from))
          return undefined
        }

        switch (name) {
          case 'StrongEmphasis':
            decorations.push(Decoration.mark({ class: 'cm-lp-strong' }).range(node.from, node.to))
            return undefined
          case 'Emphasis':
            decorations.push(Decoration.mark({ class: 'cm-lp-em' }).range(node.from, node.to))
            return undefined
          case 'Strikethrough':
            decorations.push(Decoration.mark({ class: 'cm-lp-strike' }).range(node.from, node.to))
            return undefined
          case 'InlineCode':
            codeRanges.push([node.from, node.to])
            decorations.push(Decoration.mark({ class: 'cm-lp-code' }).range(node.from, node.to))
            return undefined
          case 'FencedCode':
          case 'CodeBlock': {
            codeRanges.push([node.from, node.to])
            for (let pos = node.from; pos <= node.to; ) {
              const line = state.doc.lineAt(pos)
              decorations.push(Decoration.line({ class: 'cm-lp-codeblock' }).range(line.from))
              pos = line.to + 1
            }
            return false
          }
          case 'Blockquote': {
            for (let pos = node.from; pos <= node.to; ) {
              const line = state.doc.lineAt(pos)
              decorations.push(Decoration.line({ class: 'cm-lp-quote' }).range(line.from))
              pos = line.to + 1
            }
            return undefined
          }
          case 'Link':
            decorations.push(Decoration.mark({ class: 'cm-lp-link' }).range(node.from, node.to))
            return undefined
          case 'Image': {
            codeRanges.push([node.from, node.to])
            if (selectionTouches(state, node.from, node.to)) return undefined
            // View plugins cannot replace a range that includes a line break.
            if (state.doc.lineAt(node.from).number !== state.doc.lineAt(node.to).number)
              return undefined
            const urlNode = node.node.getChild('URL')
            if (!urlNode) return undefined
            const src = state.sliceDoc(urlNode.from, urlNode.to)
            if (!/^https?:\/\//.test(src)) return undefined
            const text = state.sliceDoc(node.from, node.to)
            const alt = /^!\[([^\]]*)\]/.exec(text)?.[1] ?? ''
            decorations.push(
              Decoration.replace({ widget: new ImageWidget(src, alt) }).range(node.from, node.to),
            )
            return false
          }
          case 'HeaderMark': {
            const line = state.doc.lineAt(node.from)
            if (selectionTouches(state, line.from, line.to)) return undefined
            // 连同标记后的空格一起隐藏
            const end = state.sliceDoc(node.to, node.to + 1) === ' ' ? node.to + 1 : node.to
            decorations.push(HIDDEN.range(node.from, end))
            return undefined
          }
          case 'QuoteMark': {
            const line = state.doc.lineAt(node.from)
            if (selectionTouches(state, line.from, line.to)) return undefined
            const end = state.sliceDoc(node.to, node.to + 1) === ' ' ? node.to + 1 : node.to
            decorations.push(HIDDEN.range(node.from, end))
            return undefined
          }
          case 'EmphasisMark':
          case 'StrikethroughMark':
          case 'CodeMark':
            if (parent?.name === 'FencedCode' || parentRevealed) return undefined
            decorations.push(HIDDEN.range(node.from, node.to))
            return undefined
          case 'LinkMark':
          case 'URL':
          case 'LinkTitle':
            if (parent?.name !== 'Link' || parentRevealed) return undefined
            if (state.doc.lineAt(node.from).number !== state.doc.lineAt(node.to).number)
              return undefined
            decorations.push(HIDDEN.range(node.from, node.to))
            return undefined
        }
        return undefined
      },
    })

    const text = state.sliceDoc(from, to)
    const inCode = (position: number) =>
      codeRanges.some(([start, end]) => position >= start && position < end)

    for (const match of text.matchAll(SMILE_PATTERN)) {
      const start = from + match.index
      const end = start + match[0].length
      if (inCode(start) || selectionTouches(state, start, end)) continue
      decorations.push(Decoration.replace({ widget: new SmileWidget(match[1]) }).range(start, end))
    }

    for (const match of text.matchAll(BBCODE_SIMPLE_PATTERN)) {
      const start = from + match.index
      if (inCode(start)) continue
      const [whole, tag, content] = match
      const openEnd = start + tag.length + 2
      const closeStart = openEnd + content.length
      pushBBCode(decorations, state, start, start + whole.length, openEnd, closeStart, {
        class: BBCODE_CLASS[tag],
      })
    }

    for (const match of text.matchAll(BBCODE_VALUE_PATTERN)) {
      const start = from + match.index
      if (inCode(start)) continue
      const [whole, tag, value, content] = match
      const openEnd = start + tag.length + value.length + 3
      const closeStart = openEnd + content.length
      const style =
        tag === 'color'
          ? SAFE_COLOR_PATTERN.test(value.trim())
            ? `color: ${value.trim()}`
            : undefined
          : `font-size: ${Math.min(Math.max(Number.parseInt(value, 10) || 14, 10), 32)}px`
      if (!style) continue
      pushBBCode(decorations, state, start, start + whole.length, openEnd, closeStart, {
        attributes: { style },
      })
    }
  }

  return Decoration.set(decorations, true)
}

function pushBBCode(
  decorations: Range<Decoration>[],
  state: EditorState,
  start: number,
  end: number,
  openEnd: number,
  closeStart: number,
  markSpec: { class?: string; attributes?: Record<string, string> },
) {
  if (closeStart > openEnd) {
    decorations.push(Decoration.mark(markSpec).range(openEnd, closeStart))
  }
  if (selectionTouches(state, start, end)) return undefined
  decorations.push(HIDDEN.range(start, openEnd))
  decorations.push(HIDDEN.range(closeStart, end))
}

export const livePreview = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    tree: ReturnType<typeof syntaxTree>

    constructor(view: EditorView) {
      this.tree = syntaxTree(view.state)
      this.decorations = buildDecorations(view)
    }

    update(update: ViewUpdate) {
      const tree = syntaxTree(update.state)
      if (
        update.docChanged ||
        update.viewportChanged ||
        update.selectionSet ||
        tree !== this.tree
      ) {
        this.tree = tree
        this.decorations = buildDecorations(update.view)
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
)
