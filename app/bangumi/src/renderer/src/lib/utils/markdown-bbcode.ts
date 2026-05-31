const HEADING_PATTERN = /^(#{1,6})\s+(.+)$/

export function markdownToBBCode(markdown: string) {
  const normalized = markdown.replace(/\r\n?/g, '\n').trim()
  if (!normalized) return ''

  return parseBlocks(normalized).trim()
}

function parseBlocks(markdown: string) {
  const lines = markdown.split('\n')
  const blocks: string[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]

    const heading = line.match(HEADING_PATTERN)
    if (heading) {
      blocks.push(`[b]${convertInline(heading[2])}[/b]`)
      continue
    }

    blocks.push(convertInline(line))
  }

  return blocks.join('\n')
}

function convertInline(text: string) {
  const placeholders: string[] = []
  const stash = (value: string) => {
    const key = `\u0000${placeholders.length}\u0000`
    placeholders.push(value)
    return key
  }

  let next = text
  next = next.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, (_, _alt: string, src: string) =>
    stash(`[img]${src}[/img]`),
  )
  next = next.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    (_, label: string, href: string) => `[url=${href}]${label}[/url]`,
  )
  next = next.replace(/\*\*([^*\n]+)\*\*/g, '[b]$1[/b]')
  next = next.replace(/__([^_\n]+)__/g, '[b]$1[/b]')
  next = next.replace(/~~([^~\n]+)~~/g, '[s]$1[/s]')
  next = next.replace(/\*([^*\n]+)\*/g, '[i]$1[/i]')
  next = next.replace(/_([^_\n]+)_/g, '[i]$1[/i]')

  return placeholders.reduce((value, placeholder, index) => {
    return value.replaceAll(`\u0000${index}\u0000`, placeholder)
  }, next)
}
