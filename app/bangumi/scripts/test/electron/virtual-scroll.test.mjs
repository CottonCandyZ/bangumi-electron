import { expect, test } from 'vitest'
import { runAgentBrowser } from '../../agent-browser.mjs'

const port = process.env.BANGUMI_ELECTRON_CDP_PORT || '9222'
function run(...args) {
  const result = runAgentBrowser(
    ['--session', 'virtual-scroll-regression', '--cdp', port, '--json', ...args],
    { encoding: 'utf8', timeout: 30000 },
  )
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || result.error?.message)
  const output = JSON.parse(result.stdout)
  if (!output.success) throw new Error(output.error)
  return output.data
}
const evaluate = (script) => run('eval', '-b', Buffer.from(script).toString('base64')).result

async function mountFixture(kind, importModule) {
  const load = (path) => {
    const url = performance
      .getEntriesByType('resource')
      .filter((entry) => entry.name.split('?')[0].endsWith(path))
      .at(-1)?.name
    return importModule(url || path).then((module) => module.default ?? module)
  }
  // Load components first so their optimized dependency URLs are discoverable,
  // including on a renderer that has not visited a comment page yet.
  const [page, episode, topic, list, image] = await Promise.all([
    load('/src/components/scroll/page-scroll-wrapper.tsx'),
    load('/src/modules/main/episode/content.tsx'),
    load('/src/modules/main/community/topic-detail.tsx'),
    load('/src/components/comment/comment-list.tsx'),
    load('/src/components/comment/bbcode-image.tsx'),
  ])
  const [React, ReactDOM, DOM, Router, Query, Jotai] = await Promise.all([
    load('/react.js'),
    load('/react-dom_client.js'),
    load('/react-dom.js'),
    load('/react-router-dom.js'),
    load('/@tanstack_react-query.js'),
    load('/jotai.js'),
  ])
  const h = React.createElement
  const fixtureId = Date.now()
  const imageSrc = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="640"><title>${fixtureId}</title><rect width="320" height="640" fill="pink"/></svg>`)}`
  const comments = Array.from({ length: 160 }, (_, index) => ({
    id: index + 1,
    mainID: index + 1,
    createdAt: 1700000000,
    creatorID: 0,
    state: 0,
    reactions: [],
    relatedID: 0,
    replies: [],
    content: Array.from({ length: 1 + (index % 8) }, () => `Comment ${index + 1}`).join('\n'),
  }))
  if (kind === 'image-list') {
    const src = new URL(
      `/src/assets/comment/bangumi-smiles-sprite.png?fixture=${fixtureId}`,
      location.origin,
    ).href
    for (const comment of comments) {
      if (comment.id % 3 === 0) comment.content += `\n[img]${src}[/img]`
    }
  }
  const cache = new Query.QueryClient({
    defaultOptions: { queries: { enabled: false, retry: false, staleTime: Infinity } },
  })
  cache.setQueryDefaults(['episode-info'], {
    initialData: {
      id: fixtureId,
      subject_id: 0,
      name: 'Scroll regression',
      name_cn: '',
      sort: 1,
      type: 0,
      comment: comments.length,
    },
  })
  cache.setQueryDefaults(['episode-comments'], { initialData: comments })
  cache.setQueryDefaults(['subject-info'], { initialData: { id: 0, name: 'Fixture', type: 2 } })
  const frame = document.createElement('div')
  frame.id = 'virtual-scroll-fixture'
  frame.style.cssText =
    'position:fixed;inset:0;z-index:99999;background:white;height:600px;width:900px'
  const host = document.createElement('div')
  host.style.cssText = 'position:relative;height:100%;width:100%'
  frame.append(host)
  document.body.append(frame)
  const root = ReactDOM.createRoot(host)
  const atoms = Jotai.createStore()
  const fixture = {
    host,
    cache,
    viewport: () => host.querySelector('.overflow-y-auto'),
    dispose: () => {
      root.unmount()
      frame.remove()
      cache.clear()
      delete window.__virtualScrollFixture
    },
  }
  window.__virtualScrollFixture = fixture
  function Content() {
    const { id } = Router.useParams()
    if (kind === 'list' || kind === 'image-list')
      return h(list.CommentList, {
        comments,
        virtual: true,
        userAvatarViewTransition: false,
        scrollMemoryKey: `fixture:${id}`,
      })
    if (kind === 'episode') return h(episode.EpisodeContent, { episodeId: id })
    cache.setQueryDefaults(['community-group-topic'], {
      initialData: {
        id: Number(id),
        title: 'Scroll regression',
        createdAt: 1700000000,
        creatorID: 0,
        group: { name: 'fixture', title: 'Fixture' },
        replyCount: comments.length,
        replies: [{ ...comments[0], id: 0, content: 'Main post' }, ...comments],
      },
    })
    return h(topic.CommunityTopicDetail, { kind: 'group', topicId: Number(id) })
  }
  function Layout() {
    const navigate = Router.useNavigate()
    const location = Router.useLocation()
    React.useLayoutEffect(() => {
      fixture.route = location.pathname
    }, [location.pathname])
    fixture.navigate = (second) =>
      navigate(`/${kind === 'topic' ? 'group/topic' : 'episode'}/${fixtureId + Number(second)}`)
    return h(
      'div',
      { style: { display: 'flex', height: '100%' } },
      h(
        'div',
        { style: { flex: 1, minWidth: 0, height: '100%' } },
        kind === 'list' || kind === 'image-list'
          ? h(Content)
          : h(page.PageScrollWrapper, null, h(Content)),
      ),
      h(
        'aside',
        { style: { width: 200 } },
        h('button', { onClick: () => fixture.navigate(false) }, 'Episode A'),
        h('button', { onClick: () => fixture.navigate(true) }, 'Episode B'),
      ),
    )
  }
  fixture.sample = () => {
    const viewport = fixture.viewport()
    const top = viewport?.getBoundingClientRect().top ?? 0
    const visible = [...host.querySelectorAll('[data-comment-id]')].find((element) => {
      const rect = element.getBoundingClientRect()
      return (
        rect.bottom > top &&
        rect.top < top + viewport.clientHeight &&
        getComputedStyle(element).visibility !== 'hidden'
      )
    })
    return {
      offset: viewport?.scrollTop,
      route: fixture.route,
      id: visible?.dataset.commentId,
      top: visible ? visible.getBoundingClientRect().top - top : null,
      missing: visible
        ? undefined
        : [...host.querySelectorAll('[data-index]')].map((e) => ({
            index: e.dataset.index,
            top: e.getBoundingClientRect().top,
            visibility: getComputedStyle(e).visibility,
          })),
    }
  }
  fixture.roundTrip = async () => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const before = fixture.sample()
    fixture.navigate(true)
    await new Promise((resolve) => setTimeout(resolve, 100))
    const unvisited = fixture.sample()
    fixture.navigate(false)
    const frames = []
    for (let i = 0; i < 12; i++) {
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)))
      frames.push(fixture.sample())
    }
    return { before, unvisited, frames }
  }
  fixture.scrollThroughImages = async () => {
    const nextPaint = () =>
      new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)))
    const shifts = []
    for (const direction of [1, -1]) {
      for (let step = 0; step < 40; step++) {
        fixture.viewport().scrollTop += direction * 320
        await nextPaint()
        const before = fixture.sample()
        await nextPaint()
        await nextPaint()
        const after = fixture.sample()
        if (before.id !== after.id || Math.abs(before.top - after.top) > 2) {
          shifts.push({ before, after })
        }
      }
    }
    return shifts
  }
  if (kind === 'image') {
    const src = imageSrc
    let imageMount = 0
    fixture.remountImage = (width) => {
      if (width) host.style.width = `${width}px`
      const before = host.querySelector('img').closest('span').getBoundingClientRect().height
      DOM.flushSync(() => root.render(h(image.BBCodeImage, { src, key: ++imageMount })))
      return {
        before,
        after: host.querySelector('img').closest('span').getBoundingClientRect().height,
      }
    }
    root.render(h(image.BBCodeImage, { src }))
    return
  }
  root.render(
    h(
      Router.MemoryRouter,
      {
        initialEntries: [`/${kind === 'topic' ? 'group/topic' : 'episode'}/${fixtureId}`],
      },
      h(
        Query.QueryClientProvider,
        { client: cache },
        h(
          Jotai.Provider,
          { store: atoms },
          h(
            Router.Routes,
            null,
            h(Router.Route, {
              path: kind === 'topic' ? '/group/topic/:id' : '/episode/:id',
              element: h(Layout),
            }),
          ),
        ),
      ),
    ),
  )
}

function mount(kind) {
  const main = run('tab').tabs.find(
    (tab) =>
      /^http:\/\/(localhost|127\.0\.0\.1):\d+\//.test(tab.url) && !tab.url.endsWith('/command'),
  )
  expect(main, 'Start the development renderer before running this test').toBeTruthy()
  run('tab', main.tabId)
  expect(run('get', 'title').title).toBe('Bangumi')
  evaluate(`(${mountFixture.toString()})(${JSON.stringify(kind)}, path => import(path))`)
}

test.each(['episode', 'topic', 'list', 'image-list'])(
  '%s restores the reading position before painting',
  (kind) => {
    try {
      mount(kind)
      run('wait', '--fn', '!!document.querySelector("#virtual-scroll-fixture [data-comment-id]")')
      evaluate('window.__virtualScrollFixture.viewport().scrollTop = 6000')
      run('wait', '--fn', 'window.__virtualScrollFixture.sample().offset > 4000')
      const results = evaluate(`(async () => {
        const results = []
        for (let i = 0; i < 3; i++) results.push(await window.__virtualScrollFixture.roundTrip())
        return results
      })()`)
      for (const result of results) {
        expect(result.before.id).toBeTruthy()
        expect(result.unvisited.offset).toBe(0)
        const restoredFrames = result.frames.filter((frame) => frame.route === result.before.route)
        expect(restoredFrames.length).toBeGreaterThan(0)
        for (const frame of restoredFrames) {
          expect(frame.id, JSON.stringify(result)).toBe(result.before.id)
          expect(Math.abs(frame.top - result.before.top)).toBeLessThanOrEqual(2)
        }
      }
    } finally {
      evaluate('window.__virtualScrollFixture?.dispose()')
    }
  },
  15000,
)

test('scrolling down and back through image comments keeps the reading anchor stable', () => {
  try {
    mount('image-list')
    run(
      'wait',
      '--fn',
      '!!document.querySelector("#virtual-scroll-fixture button:not(:disabled) img")',
    )
    expect(evaluate('window.__virtualScrollFixture.scrollThroughImages()')).toEqual([])
  } finally {
    evaluate('window.__virtualScrollFixture?.dispose()')
  }
}, 15000)

test('recycled comment images reserve their measured size before loading again', () => {
  try {
    mount('image')
    run(
      'wait',
      '--fn',
      '!!document.querySelector("#virtual-scroll-fixture button:not(:disabled) img")',
    )
    const sizes = evaluate('window.__virtualScrollFixture.remountImage()')
    expect(sizes.before).toBe(384)
    expect(sizes.after).toBe(sizes.before)
    const narrow = evaluate('window.__virtualScrollFixture.remountImage(100)')
    expect(narrow.before).toBe(200)
    expect(narrow.after).toBe(narrow.before)
  } finally {
    evaluate('window.__virtualScrollFixture?.dispose()')
  }
})
