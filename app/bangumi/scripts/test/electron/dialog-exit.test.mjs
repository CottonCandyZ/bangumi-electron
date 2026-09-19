import { expect, test } from 'vitest'
import { runAgentBrowser } from '../../agent-browser.mjs'

function run(...args) {
  const result = runAgentBrowser(
    [
      '--session',
      'dialog-regression',
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
const evaluate = (script) => run('eval', '-b', Buffer.from(script).toString('base64')).result

async function exercise(importModule, kind, controlled) {
  const load = (path) => {
    let url = performance
      .getEntriesByType('resource')
      .filter((entry) => entry.name.split('?')[0].endsWith(path))
      .at(-1)?.name
    if (!url && path === '/react-dom.js') {
      url = performance
        .getEntriesByType('resource')
        .find((entry) => entry.name.includes('/react-dom_client.js'))
        ?.name.replace('react-dom_client.js', 'react-dom.js')
    }
    return importModule(url || path).then((module) => module.default ?? module)
  }
  const React = await load('/react.js')
  const ReactDOM = await load('/react-dom.js')
  const { createRoot } = await load('/react-dom_client.js')
  const components = await load(`/src/components/ui/${kind}.tsx`)
  const name = { dialog: 'Dialog', 'alert-dialog': 'AlertDialog', sheet: 'Sheet' }[kind]
  const Root = components[name]
  const Content = components[`${name}Content`]
  const Title = components[`${name}Title`]
  const Close = components[`${name}${kind === 'alert-dialog' ? 'Cancel' : 'Close'}`]
  const h = React.createElement
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  let update
  let cancelClose = false
  const completed = []
  function Fixture() {
    const [state, setState] = React.useState({ open: true, text: 'original content' })
    update = setState
    return h(
      Root,
      {
        ...(controlled ? { open: state.open } : { defaultOpen: true }),
        onOpenChange(open, details) {
          if (cancelClose) return details.cancel()
          setState({ open, text: open ? 'new content' : null })
        },
        onOpenChangeComplete: (open) => completed.push(open),
      },
      state.text &&
        h(
          Content,
          {
            'data-testid': 'dialog-exit-fixture',
            'aria-describedby': undefined,
            style: { animationDuration: '120ms', transitionDuration: '120ms' },
          },
          h(Title, null, state.text),
          h(Close, { 'data-testid': 'fixture-close' }, 'close'),
        ),
    )
  }
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const popup = () => document.querySelector('[data-testid=dialog-exit-fixture]')
  const close = () =>
    ReactDOM.flushSync(() => document.querySelector('[data-testid=fixture-close]').click())
  const render = (state) => ReactDOM.flushSync(() => update(state))
  try {
    ReactDOM.flushSync(() => root.render(h(Fixture)))
    await wait(200)
    cancelClose = true
    close()
    const canceled = popup()?.textContent
    cancelClose = false
    close()
    const closing = popup()?.textContent
    await wait(40)
    const duringExit = popup()?.textContent
    if (controlled) {
      render({ open: true, text: 'new content' })
      await wait(200)
      const reopened = popup()?.textContent
      // External close + payload cleanup must also retain the last open render.
      render({ open: false, text: null })
      const secondExit = popup()?.textContent
      await wait(250)
      return { canceled, closing, duringExit, reopened, secondExit, removed: !popup(), completed }
    }
    await wait(250)
    return { canceled, closing, duringExit, removed: !popup(), completed }
  } finally {
    ReactDOM.flushSync(() => root.unmount())
    host.remove()
  }
}

test.each(['dialog', 'alert-dialog', 'sheet'])(
  '%s retains content through exit and supports reopening',
  (kind) => {
    const main = run('tab').tabs.find(
      (tab) =>
        /^http:\/\/(localhost|127\.0\.0\.1):\d+\//.test(tab.url) && !tab.url.endsWith('/command'),
    )
    expect(main).toBeTruthy()
    run('tab', main.tabId)
    expect(run('get', 'url').url).toBe(main.url)
    expect(run('get', 'title').title).toBe('Bangumi')
    evaluate(`(async () => {
      const { client } = await import('/src/lib/client.ts');
      await client.openMainWindowAndNavigate({ path: location.hash.slice(1) || '/' });
    })()`)
    run('wait', '--fn', 'document.visibilityState === "visible"')
    for (const controlled of [true, false]) {
      const result = evaluate(
        `(${exercise.toString()})(path => import(path), ${JSON.stringify(kind)}, ${controlled})`,
      )
      expect(result.canceled).toContain('original content')
      expect(result.closing).toContain('original content')
      expect(result.duringExit).toContain('original content')
      if (controlled) {
        expect(result.reopened).toContain('new content')
        expect(result.secondExit).toContain('new content')
      }
      expect(result.removed, JSON.stringify(result)).toBe(true)
      expect(result.completed.at(-1)).toBe(false)
    }
  },
  60000,
)
