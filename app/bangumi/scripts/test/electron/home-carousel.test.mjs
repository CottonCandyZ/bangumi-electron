import { expect, test } from 'vitest'
import { runAgentBrowser } from '../../agent-browser.mjs'

const port = process.env.BANGUMI_ELECTRON_CDP_PORT || '9222'
function run(...args) {
  const result = runAgentBrowser(
    ['--session', `home-regression-${port}`, '--cdp', port, '--json', ...args],
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
async function mountFixture(
  importModule,
  broadcast = false,
  subjectCount = 24,
  { compact = false, width = 900 } = {},
) {
  const load = (path) => {
    const url = performance
      .getEntriesByType('resource')
      .filter((entry) => entry.name.split('?')[0].endsWith(path))
      .at(-1)?.name
    return importModule(url || path).then((module) => module.default ?? module)
  }
  const [React, DOM, ClientDOM, Router, Query, Jotai, home, calendar, hoverState] =
    await Promise.all([
      load('/react.js'),
      load('/src/test-support/react-dom.ts'),
      load('/react-dom_client.js'),
      load('/react-router-dom.js'),
      load('/@tanstack_react-query.js'),
      load('/jotai.js'),
      load('/src/modules/main/home/small-carousel/index.tsx'),
      load('/src/modules/main/home/broadcast-schedule.tsx'),
      load('/src/state/hover-pop-card.ts'),
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
  host.style.cssText = `position:fixed;inset:0;z-index:99999;background:var(--background);overflow:hidden;width:${width}px;height:400px`
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
    columns: (() => {
      const track = host.querySelector('[data-slot=carousel-content] > div')
      return track.getBoundingClientRect().width / track.children[0].getBoundingClientRect().width
    })(),
    days: [...host.querySelectorAll('[aria-label$="放送条目"]')].map(readMask),
    transform: Math.round(
      new DOMMatrixReadOnly(
        getComputedStyle(host.querySelector('[data-slot=carousel-content] > div')).transform,
      ).m41,
    ),
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
        : h(home.SmallCarousel, { href: '/anime', name: 'Fixture', sectionPath: 'anime', compact })
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
    activeCard: () => atoms.get(hoverState.activeHoverPopCardAtom),
    settle: async () => {
      let previous
      let stable = 0
      for (let frame = 0; frame < 180; frame++) {
        await new Promise(requestAnimationFrame)
        const current = snapshot().transform
        stable = current === previous ? stable + 1 : 0
        if (stable >= 6) return
        previous = current
      }
      throw new Error('Carousel did not settle')
    },
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
  // Restored position, whole-column layout and vertical masks must be ready for first paint.
  for (const frame of frames) expect(frame).toEqual(frames[0])
  return frames[0]
}

function expectRestoredLayout(expected) {
  const { transform, ...layout } = readMountFrames()
  const { transform: previousTransform, ...previousLayout } = expected
  expect(layout).toEqual(previousLayout)
  // Fractional column widths can round a snap boundary by one pixel on remount.
  expect(Math.abs(transform - previousTransform)).toBeLessThanOrEqual(1)
}

test('carousel keeps whole columns and seen cards on return, and defers hidden cards', () => {
  focusMainWindow()
  try {
    evaluate(`(${mountFixture.toString()})(path => import(path))`)
    const initial = readMountFrames()
    expect(initial.columns).toBeCloseTo(Math.round(initial.columns), 2)
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
      `!document.querySelector('#home-carousel-fixture button[aria-label=向前浏览Fixture]').disabled`,
    )
    evaluate('window.__homeCarouselFixture.settle()')
    const scrolled = evaluate('window.__homeCarouselFixture.snapshot()')
    evaluate('window.__homeCarouselFixture.show(false)')
    const after = evaluate(
      '(() => { window.__homeCarouselFixture.show(true); return document.querySelectorAll("#home-carousel-fixture img").length })()',
    )
    expect(after).toBeGreaterThanOrEqual(before)
    expectRestoredLayout(scrolled)
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
    run(
      'wait',
      '--fn',
      `document.querySelector('#home-carousel-fixture button[aria-label=向后浏览Fixture]').disabled`,
    )
    evaluate('window.__homeCarouselFixture.settle()')
    const end = evaluate('window.__homeCarouselFixture.snapshot()')
    evaluate('window.__homeCarouselFixture.show(false)')
    evaluate('window.__homeCarouselFixture.show(true)')
    expectRestoredLayout(end)
    // Recompute columns and snap bounds against the current viewport.
    evaluate(`(() => {
      const fixture = window.__homeCarouselFixture;
      fixture.show(false);
      fixture.host.style.width = '4200px';
      fixture.show(true);
    })()`)
    expect(readMountFrames().columns).toBeGreaterThanOrEqual(24)
    expect(
      evaluate(
        'document.querySelector("#home-carousel-fixture button[aria-label=向后浏览Fixture]").disabled',
      ),
    ).toBe(true)
  } finally {
    evaluate('window.__homeCarouselFixture?.dispose()')
  }
}, 120000)

test('compact discovery rows fit four cards and adapt to a narrow container', () => {
  focusMainWindow()
  try {
    evaluate(
      `(${mountFixture.toString()})(path => import(path), false, 24, { compact: true, width: 500 })`,
    )
    expect(readMountFrames().columns).toBeCloseTo(4, 2)
    evaluate("window.__homeCarouselFixture.host.style.width = '240px'")
    run('wait', '--fn', 'Math.abs(window.__homeCarouselFixture.snapshot().columns - 2) < 0.01')
    expect(evaluate('window.__homeCarouselFixture.snapshot().columns')).toBeCloseTo(2, 2)
  } finally {
    evaluate('window.__homeCarouselFixture?.dispose()')
  }
}, 60000)

test('right-clicking a subject link cancels its delayed hover card', () => {
  focusMainWindow()
  try {
    evaluate(`(${mountFixture.toString()})(path => import(path), false, 4)`)
    run('wait', '--fn', '!!document.querySelector("#home-carousel-fixture a")')
    const state = evaluate(`(async () => {
      const fixture = window.__homeCarouselFixture;
      const link = fixture.host.querySelector('[data-slot=carousel-item] a');
      link.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      link.dispatchEvent(event);
      await new Promise(resolve => setTimeout(resolve, 850));
      return { handled: event.defaultPrevented, active: fixture.activeCard() };
    })()`)
    expect(state).toEqual({ handled: true, active: null })
  } finally {
    evaluate('window.__homeCarouselFixture?.dispose()')
  }
}, 60000)

test('a short carousel measures whole columns again before returning to a narrower viewport', () => {
  focusMainWindow()
  try {
    evaluate(`(${mountFixture.toString()})(path => import(path), false, 4)`)
    expect(readMountFrames().columns).toBeGreaterThanOrEqual(4)
    evaluate(`(() => {
      const fixture = window.__homeCarouselFixture;
      fixture.show(false);
      fixture.host.style.width = '300px';
      fixture.show(true);
    })()`)
    const { columns } = readMountFrames()
    expect(columns).toBeCloseTo(2, 2)
    expect(
      evaluate(
        'document.querySelector("#home-carousel-fixture button[aria-label=向后浏览Fixture]").disabled',
      ),
    ).toBe(false)
  } finally {
    evaluate('window.__homeCarouselFixture?.dispose()')
  }
}, 120000)

test('broadcast masks cover first paint and update without a delayed fade-in', () => {
  focusMainWindow()
  try {
    evaluate(`(${mountFixture.toString()})(path => import(path), true)`)
    const initial = readMountFrames()
    expect(initial.columns).toBeCloseTo(Math.round(initial.columns), 2)
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
