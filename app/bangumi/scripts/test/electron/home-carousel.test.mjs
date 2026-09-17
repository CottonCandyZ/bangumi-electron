import { expect, test } from 'vitest'
import { runAgentBrowser } from '../../agent-browser.mjs'

const port = process.env.BANGUMI_ELECTRON_CDP_PORT || '9222'
function run(...args) {
  const result = runAgentBrowser(
    ['--session', 'home-regression', '--cdp', port, '--json', ...args],
    {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 30000,
    },
  )
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || result.error?.message)
  const output = JSON.parse(result.stdout)
  if (!output.success) throw new Error(output.error)
  return output.data
}
const evaluate = (script) => run('eval', '-b', Buffer.from(script).toString('base64')).result

// Exercise real carousel/card components with an isolated in-memory query cache.
async function mountFixture(importModule, broadcast = false, subjectCount = 24) {
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
  const [React, DOM, ClientDOM, Router, Query, Jotai, home, calendar] = await Promise.all([
    load('/react.js'),
    load('/react-dom.js'),
    load('/react-dom_client.js'),
    load('/react-router-dom.js'),
    load('/@tanstack_react-query.js'),
    load('/jotai.js'),
    load('/src/modules/main/home/small-carousel/index.tsx'),
    load('/src/modules/main/home/broadcast-schedule.tsx'),
  ])
  const h = React.createElement
  const cover =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180"><rect width="120" height="180" fill="#abc"/></svg>',
    )
  const fixtureId = Date.now()
  const subjects = Array.from({ length: subjectCount }, (_, index) => ({
    id: fixtureId + index,
    type: 2,
    name: `Fixture ${index}`,
    name_cn: '',
    nsfw: false,
    images: { common: cover },
    rating: { score: 8 },
    tags: [],
    date: null,
    last_update_at: new Date(),
  }))
  const cache = new Query.QueryClient({
    defaultOptions: { queries: { enabled: false, retry: false, staleTime: Infinity } },
  })
  cache.setQueryDefaults(['SectionTrendsV2', 'anime'], {
    initialData: subjects.map((subject) => ({ SubjectId: String(subject.id) })),
  })
  cache.setQueryDefaults(['subject-info'], { initialData: subjects })
  const calendarData = (count) =>
    Object.fromEntries(
      Array.from({ length: 7 }, (_, day) => [
        String(day + 1),
        Array.from({ length: count }, (_, index) => ({
          subject: { id: 991000 + day * 100 + index, name: `Broadcast ${index}`, images: {} },
          watchers: 100,
        })),
      ]),
    )
  cache.setQueryDefaults(['calendar-v1'], { initialData: calendarData(8) })
  const host = document.createElement('div')
  host.id = 'home-carousel-fixture'
  host.style.cssText =
    'position:fixed;inset:0;z-index:99999;background:var(--background);overflow:hidden;width:900px;height:400px'
  document.body.append(host)
  const atoms = Jotai.createStore()
  const mounts = []
  const readMask = (element) => {
    const style = getComputedStyle(element)
    return {
      start: Number(style.getPropertyValue('--broadcast-fade-start')),
      end: Number(style.getPropertyValue('--broadcast-fade-end')),
    }
  }
  const snapshot = () => ({
    mask: readMask(host.querySelector('.broadcast-scroll-fade')),
    days: [...host.querySelectorAll('[aria-label$="放送条目"]')].map(readMask),
    transform: host.querySelector('[data-slot=carousel-content] > div').style.transform,
  })
  let setVisible
  function Content() {
    const [visible, update] = React.useState(true)
    setVisible = update
    React.useLayoutEffect(() => {
      if (!visible) return
      const frames = []
      mounts.push(frames)
      let frame
      const sample = () => {
        frames.push(snapshot())
        if (frames.length < 6) frame = requestAnimationFrame(sample)
      }
      frame = requestAnimationFrame(sample)
      return () => cancelAnimationFrame(frame)
    }, [visible])
    return visible
      ? broadcast
        ? h(calendar.BroadcastSchedule)
        : h(home.SmallCarousel, { href: '/anime', name: 'Fixture', sectionPath: 'anime' })
      : null
  }
  const router = Router.createMemoryRouter([{ path: '*', element: h(Content) }], {
    initialEntries: [`/carousel-fixture-${fixtureId}`],
  })
  const root = ClientDOM.createRoot(host)
  DOM.flushSync(() =>
    root.render(
      h(
        React.StrictMode,
        null,
        h(
          Query.QueryClientProvider,
          { client: cache },
          h(Jotai.Provider, { store: atoms }, h(Router.RouterProvider, { router })),
        ),
      ),
    ),
  )
  window.__homeCarouselFixture = {
    host,
    mounts,
    snapshot,
    setCalendarSize: (count) =>
      cache.setQueriesData({ queryKey: ['calendar-v1'] }, calendarData(count)),
    show: (visible) => DOM.flushSync(() => setVisible(visible)),
    dispose: () => {
      root.unmount()
      router.dispose()
      host.remove()
      cache.clear()
      delete window.__homeCarouselFixture
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
  expect(evaluate('document.visibilityState')).toBe('visible')
}

function readMountFrames() {
  run('wait', '--fn', 'window.__homeCarouselFixture.mounts.at(-1).length === 6')
  const frames = evaluate('window.__homeCarouselFixture.mounts.at(-1)')
  // Neither the restored transform nor either mask may change after the first painted frame.
  for (const frame of frames) expect(frame).toEqual(frames[0])
  return frames[0]
}

test('carousel keeps its edge masks and seen cards on return, and defers hidden cards', () => {
  focusMainWindow()
  try {
    evaluate(`(${mountFixture.toString()})(path => import(path))`)
    expect(readMountFrames().mask).toEqual({ start: 0, end: 1 })
    run('wait', '--fn', '!!document.querySelector("#home-carousel-fixture img")')
    const first = evaluate('document.querySelectorAll("#home-carousel-fixture img").length')
    expect(first).toBeGreaterThan(0)
    expect(first).toBeLessThan(24)
    expect(
      evaluate(
        'document.querySelectorAll("#home-carousel-fixture [data-slot=carousel-item]").length',
      ),
    ).toBe(24)
    const movement = evaluate(`(async () => {
      document.querySelector('#home-carousel-fixture button[aria-label=向后浏览Fixture]').click();
      const positions = [];
      for (let frame = 0; frame < 12; frame++) {
        await new Promise(requestAnimationFrame);
        positions.push(window.__homeCarouselFixture.snapshot().transform);
      }
      return positions;
    })()`)
    expect(new Set(movement).size).toBeGreaterThan(3)
    run('wait', '--fn', `document.querySelectorAll("#home-carousel-fixture img").length > ${first}`)
    const before = evaluate('document.querySelectorAll("#home-carousel-fixture img").length')
    run(
      'wait',
      '--fn',
      `Number(getComputedStyle(document.querySelector('#home-carousel-fixture .broadcast-scroll-fade')).getPropertyValue('--broadcast-fade-start')) === 1`,
    )
    evaluate('window.__homeCarouselFixture.show(false)')
    const after = evaluate(
      '(() => { window.__homeCarouselFixture.show(true); return document.querySelectorAll("#home-carousel-fixture img").length })()',
    )
    expect(after).toBeGreaterThanOrEqual(before)
    expect(readMountFrames().mask).toEqual({
      start: 1,
      end: 1,
    })
    expect(
      evaluate(
        '[...document.querySelectorAll("#home-carousel-fixture img")].every(image => image.loading === "lazy" && image.decoding === "async")',
      ),
    ).toBe(true)
    evaluate(`(async () => {
      const next = document.querySelector('#home-carousel-fixture button[aria-label=向后浏览Fixture]');
      for (let step = 0; step < 10 && !next.disabled; step++) {
        next.click();
        await new Promise(requestAnimationFrame);
      }
    })()`)
    run('wait', '--fn', `window.__homeCarouselFixture.snapshot().mask.end < 0.0001`)
    evaluate('window.__homeCarouselFixture.show(false)')
    evaluate('window.__homeCarouselFixture.show(true)')
    expect(readMountFrames().mask).toEqual({ start: 1, end: 0 })
    // Recompute against the current viewport; old masks and snap bounds cannot be reused blindly.
    evaluate(`(() => {
      const fixture = window.__homeCarouselFixture;
      fixture.show(false);
      fixture.host.style.width = '4200px';
      fixture.show(true);
    })()`)
    expect(readMountFrames().mask).toEqual({ start: 0, end: 0 })
  } finally {
    evaluate('window.__homeCarouselFixture?.dispose()')
  }
}, 120000)

test('a short carousel starts without masks and measures a narrower viewport before returning', () => {
  focusMainWindow()
  try {
    evaluate(`(${mountFixture.toString()})(path => import(path), false, 4)`)
    expect(readMountFrames().mask).toEqual({ start: 0, end: 0 })
    evaluate(`(() => {
      const fixture = window.__homeCarouselFixture;
      fixture.show(false);
      fixture.host.style.width = '300px';
      fixture.show(true);
    })()`)
    const { mask } = readMountFrames()
    expect(mask.start).toBe(0)
    expect(mask.end).toBeGreaterThan(0)
  } finally {
    evaluate('window.__homeCarouselFixture?.dispose()')
  }
}, 120000)

test('broadcast masks cover first paint and update without a delayed fade-in', () => {
  focusMainWindow()
  try {
    evaluate(`(${mountFixture.toString()})(path => import(path), true)`)
    const initial = readMountFrames()
    expect(Math.max(initial.mask.start, initial.mask.end)).toBe(1)
    expect(initial.days).toEqual(Array(7).fill({ start: 0, end: 1 }))
    evaluate('window.__homeCarouselFixture.show(false)')
    evaluate('window.__homeCarouselFixture.show(true)')
    expect(readMountFrames()).toEqual(initial)
    evaluate('window.__homeCarouselFixture.setCalendarSize(1)')
    run(
      'wait',
      '--fn',
      `document.querySelector('#home-carousel-fixture [aria-label$="放送条目"]').style.getPropertyValue('--broadcast-fade-end') === '0'`,
    )
    // After a settled, non-overflowing list grows, its first painted overflowing frame needs a mask.
    const firstOverflow = evaluate(`(async () => {
      const fixture = window.__homeCarouselFixture;
      const element = fixture.host.querySelector('[aria-label$="放送条目"]');
      getComputedStyle(element).getPropertyValue('--broadcast-fade-end');
      fixture.setCalendarSize(8);
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const sample = () => {
          if (element.children.length === 8) {
            resolve({
              overflow: element.scrollHeight - element.clientHeight,
              end: Number(getComputedStyle(element).getPropertyValue('--broadcast-fade-end')),
            });
          } else if (++attempts < 120) requestAnimationFrame(sample);
          else reject(new Error('Calendar fixture did not update'));
        };
        requestAnimationFrame(sample);
      });
    })()`)
    expect(firstOverflow.overflow).toBeGreaterThan(200)
    expect(firstOverflow.end).toBe(1)
  } finally {
    evaluate('window.__homeCarouselFixture?.dispose()')
  }
}, 120000)
