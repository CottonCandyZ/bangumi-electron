import { expect, test } from 'vitest'
import { runAgentBrowser } from '../../agent-browser.mjs'

function run(...args) {
  const result = runAgentBrowser(
    [
      '--session',
      'reply-preview-regression',
      '--cdp',
      process.env.BANGUMI_ELECTRON_CDP_PORT || '9222',
      '--json',
      ...args,
    ],
    { encoding: 'utf8', windowsHide: true, timeout: 30000 },
  )
  if (result.status !== 0) throw new Error(result.stderr || result.stdout)
  const output = JSON.parse(result.stdout)
  if (!output.success) throw new Error(output.error)
  return output.data
}

async function exercise(importModule, doc) {
  const load = (path) => {
    const url = performance
      .getEntriesByType('resource')
      .filter((entry) => entry.name.split('?')[0].endsWith(path))
      .at(-1)?.name
    return importModule(url || path)
  }
  // Load the editor first so Vite resolves its optimized CodeMirror dependencies.
  await load('/src/modules/reply-composer/markdown-reply-editor.tsx')
  const source = await (await fetch('/src/modules/reply-composer/markdown-reply-editor.tsx')).text()
  const dependency = (name) => {
    const imports = [...source.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']/g)]
    const entry = imports.find((match) => match[1].split(',').some((item) => item.trim() === name))
    if (!entry) throw new Error(`Missing editor dependency: ${name}`)
    return importModule(entry[2])
  }
  const [{ EditorView }, { markdown, markdownLanguage }, { livePreview }] = await Promise.all([
    dependency('EditorView'),
    dependency('markdown'),
    load('/src/modules/reply-composer/live-preview.tsx'),
  ])
  const host = document.createElement('div')
  host.className = 'reply-md-editor'
  document.body.append(host)
  const errors = []
  let view
  try {
    view = new EditorView({
      doc,
      selection: { anchor: doc.length },
      parent: host,
      extensions: [
        markdown({ base: markdownLanguage }),
        livePreview,
        EditorView.exceptionSink.of((error) => errors.push(String(error))),
      ],
    })
    const result = {
      active: !!view.plugin(livePreview),
      errors,
      doc: view.state.doc.toString(),
      images: host.querySelectorAll('.cm-lp-image').length,
      strong: host.querySelectorAll('.cm-lp-strong').length,
    }
    view.dispatch({ selection: { anchor: 1 } })
    result.editableSource = host.textContent.includes('https://example.com/image.png')
    return result
  } finally {
    view?.destroy()
    host.remove()
  }
}

test('live preview keeps multiline Markdown editable and previews single-line images', () => {
  const main = run('tab').tabs.find(
    (tab) =>
      /^http:\/\/(localhost|127\.0\.0\.1):\d+\//.test(tab.url) && !tab.url.endsWith('/command'),
  )
  expect(main).toBeTruthy()
  run('tab', main.tabId)
  expect(run('get', 'url').url).toBe(main.url)
  expect(run('get', 'title').title).toBe('Bangumi')
  const docs = [
    { doc: '![first\nsecond](https://example.com/image.png)\nend', images: 0 },
    { doc: '[link](https://example.com "first\nsecond")\nend', images: 0 },
    { doc: '![image](https://example.com/image.png) **bold**\nend', images: 1 },
  ]
  for (const { doc, images } of docs) {
    const result = run(
      'eval',
      '-b',
      Buffer.from(
        `(${exercise.toString()})(path => import(path), ${JSON.stringify(doc)})`,
      ).toString('base64'),
    ).result
    expect(result.doc).toBe(doc)
    expect(result.errors).toEqual([])
    expect(result.active).toBe(true)
    expect(result.images).toBe(images)
    if (images) {
      expect(result.strong).toBeGreaterThan(0)
      expect(result.editableSource).toBe(true)
    }
  }
}, 60000)
