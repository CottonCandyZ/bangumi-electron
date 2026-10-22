import { expect, test } from 'vitest'
import { runAgentBrowser } from '../../agent-browser.mjs'

const port = process.env.BANGUMI_ELECTRON_CDP_PORT || '9222'
function run(...args) {
  const result = runAgentBrowser(
    ['--session', `big-carousel-regression-${port}`, '--cdp', port, '--json', ...args],
    { encoding: 'utf8', timeout: 30000 },
  )
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || result.error?.message)
  const output = JSON.parse(result.stdout)
  if (!output.success) throw new Error(output.error)
  return output.data
}
const evaluate = (script) => run('eval', '-b', Buffer.from(script).toString('base64')).result

async function mountFixture(importModule, autoPlay = false) {
  const load = (path) => {
    const url = performance
      .getEntriesByType('resource')
      .filter((entry) => entry.name.split('?')[0].endsWith(path))
      .at(-1)?.name
    return importModule(url || path).then((module) => module.default ?? module)
  }
  const [React, ClientDOM, Router, carousel] = await Promise.all([
    load('/react.js'),
    load('/react-dom_client.js'),
    load('/react-router-dom.js'),
    load('/src/components/carousel/big-carousel.tsx'),
  ])
  const h = React.createElement
  const host = document.createElement('div')
  host.id = 'big-carousel-fixture'
  host.style.cssText = 'position:fixed;inset:0;z-index:99999;width:900px;background:white'
  document.body.append(host)
  let setCount
  function Fixture() {
    const [count, update] = React.useState(autoPlay ? 3 : 1)
    setCount = update
    return h(carousel.BigCarousel, {
      label: 'Fixture',
      autoPlay,
      items: Array.from({ length: count }, (_, index) => index),
      getKey: (item) => item,
      renderSlide: (item, { selected }) =>
        h('a', { href: '#fixture', tabIndex: selected ? 0 : -1 }, `Slide ${item}`),
    })
  }
  const router = Router.createMemoryRouter([{ path: '*', element: h(Fixture) }])
  const root = ClientDOM.createRoot(host)
  root.render(h(Router.RouterProvider, { router }))
  window.__bigCarouselFixture = {
    setCount: (count) => setCount(count),
    dispose: () => {
      root.unmount()
      router.dispose()
      host.remove()
      delete window.__bigCarouselFixture
    },
  }
}

function focusMainWindow() {
  const main = run('tab').tabs.find(
    (tab) =>
      /^http:\/\/(localhost|127\.0\.0\.1):\d+\//.test(tab.url) && !tab.url.endsWith('/command'),
  )
  expect(main, 'Start the development Electron app before running this test').toBeTruthy()
  run('tab', main.tabId)
  expect(run('get', 'url').url).toBe(main.url)
  expect(run('get', 'title').title).toBe('Bangumi')
  evaluate(`(async () => {
    const { client } = await import('/src/lib/client.ts');
    await client.openMainWindowAndNavigate({ path: location.hash.slice(1) || '/' });
  })()`)
  run('wait', '--fn', 'document.visibilityState === "visible"')
}

test('a single hero slide is visible, selected and restored after the list shrinks', () => {
  focusMainWindow()
  try {
    evaluate(`(${mountFixture.toString()})(path => import(path))`)
    run(
      'wait',
      '--fn',
      '!!document.querySelector("#big-carousel-fixture [aria-roledescription=slide]")',
    )
    const read = () =>
      evaluate(`(() => {
      const host = document.querySelector('#big-carousel-fixture');
      const slide = host.querySelector('[aria-roledescription=slide]');
      const rect = slide.getBoundingClientRect();
      return { selected: slide.getAttribute('aria-current'), visible: rect.right > 0 && rect.left < host.getBoundingClientRect().right, focusable: slide.querySelector('a').tabIndex === 0 };
    })()`)
    expect(read()).toEqual({ selected: 'true', visible: true, focusable: true })
    evaluate('window.__bigCarouselFixture.setCount(3)')
    run(
      'wait',
      '--fn',
      '!!document.querySelector("#big-carousel-fixture button[aria-label=下一个Fixture]")',
    )
    evaluate(
      'document.querySelector("#big-carousel-fixture button[aria-label=下一个Fixture]").click()',
    )
    run(
      'wait',
      '--fn',
      'document.querySelector("#big-carousel-fixture [role=tab][aria-selected=true]").getAttribute("aria-label") === "跳转到第 2 个"',
    )
    evaluate('window.__bigCarouselFixture.setCount(1)')
    run(
      'wait',
      '--fn',
      'document.querySelectorAll("#big-carousel-fixture [aria-roledescription=slide]").length === 1',
    )
    expect(read()).toEqual({ selected: 'true', visible: true, focusable: true })
  } finally {
    evaluate('window.__bigCarouselFixture?.dispose()')
  }
}, 60000)

test('hover pauses autoplay and leaving resumes it even when a manual control keeps focus', () => {
  focusMainWindow()
  try {
    evaluate(`(${mountFixture.toString()})(path => import(path), true)`)
    run(
      'wait',
      '--fn',
      '!!document.querySelector("#big-carousel-fixture button[aria-label=下一个Fixture]")',
    )
    run('hover', '#big-carousel-fixture section')
    evaluate(`(() => {
      const root = document.querySelector('#big-carousel-fixture section');
      const button = root.querySelector('button[aria-label=下一个Fixture]');
      button.focus();
      const outside = document.createElement('button');
      outside.id = 'big-carousel-outside';
      outside.textContent = 'Outside carousel';
      outside.style.cssText = 'position:fixed;top:380px;left:20px;width:120px;height:30px';
      document.querySelector('#big-carousel-fixture').append(outside);
    })()`)
    expect(evaluate('document.querySelectorAll("#big-carousel-fixture svg circle").length')).toBe(1)
    evaluate(
      'document.querySelector("#big-carousel-fixture button[aria-label=下一个Fixture]").click()',
    )
    run(
      'wait',
      '--fn',
      'document.querySelector("#big-carousel-fixture [role=tab][aria-selected=true]").getAttribute("aria-label") === "跳转到第 2 个"',
    )
    expect(evaluate('document.querySelectorAll("#big-carousel-fixture svg circle").length')).toBe(1)
    run('hover', '#big-carousel-outside')
    expect(
      evaluate('document.querySelector("#big-carousel-fixture").contains(document.activeElement)'),
    ).toBe(true)
    expect(evaluate('document.querySelectorAll("#big-carousel-fixture svg circle").length')).toBe(2)
    run(
      'wait',
      '--fn',
      'document.querySelector("#big-carousel-fixture [role=tab][aria-selected=true]").getAttribute("aria-label") === "跳转到第 3 个"',
    )
  } finally {
    evaluate('window.__bigCarouselFixture?.dispose()')
  }
}, 60000)
