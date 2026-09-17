import { expect, test } from 'vitest'
import { runAgentBrowser } from '../../agent-browser.mjs'

const port = process.env.BANGUMI_ELECTRON_CDP_PORT || '9222'
function run(...args) {
  const result = runAgentBrowser(
    ['--session', 'comment-regression', '--cdp', port, '--json', ...args],
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

// Mount the real page/list components with isolated fixture caches. Do not replace
// the app root or modify its query cache, account, route, or persisted data.
async function mountFixture(kind, importModule) {
  const load = (path) => {
    const url = performance
      .getEntriesByType('resource')
      .filter((entry) => {
        return entry.name.split('?')[0].endsWith(path)
      })
      .at(-1)?.name
    return importModule(url || path).then((module) => module.default ?? module)
  }
  const [React, ReactDOM, Router, Query, Jotai, scroll, topic, episode, list] = await Promise.all([
    load('/react.js'),
    load('/react-dom_client.js'),
    load('/react-router-dom.js'),
    load('/@tanstack_react-query.js'),
    load('/jotai.js'),
    load('/src/state/scroll.ts'),
    load('/src/modules/main/community/topic-detail.tsx'),
    load('/src/modules/main/episode/content.tsx'),
    load('/src/components/comment/comment-list.tsx'),
  ])
  const h = React.createElement
  // Virtual scroll memory is module-scoped, so never reuse a previous test run's page IDs.
  const fixtureId = Date.now()
  const longContent = Array.from({ length: 40 }, (_, index) => `Long comment line ${index}`).join(
    '\n',
  )
  const base = { createdAt: 1700000000, creatorID: 0, state: 0, reactions: [], relatedID: 0 }
  const comments = Array.from({ length: 100 }, (_, index) => ({
    ...base,
    id: index + 1,
    mainID: index + 1,
    content: index === 0 ? longContent : `Comment ${index}`,
    replies:
      index === 0
        ? Array.from({ length: 5 }, (_, child) => ({
            ...base,
            id: 1001 + child,
            mainID: 1,
            content: child === 0 ? longContent : `Reply ${child}`,
          }))
        : [],
  }))
  const cache = new Query.QueryClient({
    defaultOptions: { queries: { enabled: false, retry: false, staleTime: Infinity } },
  })
  const topicData = (id) => ({
    id,
    title: 'Comment expansion regression',
    createdAt: 1700000000,
    creatorID: 0,
    group: { name: 'fixture', title: 'Fixture' },
    subject: { id: 0, name: 'Fixture' },
    replyCount: comments.length,
    replies: [{ ...base, id: 0, content: 'Main post', replies: [] }, ...comments],
  })
  cache.setQueryDefaults(['episode-info'], {
    initialData: {
      id: fixtureId,
      subject_id: 0,
      name: 'Fixture',
      name_cn: '',
      sort: 1,
      type: 0,
      comment: 100,
    },
  })
  cache.setQueryDefaults(['episode-comments'], { initialData: comments })
  cache.setQueryDefaults(['subject-info'], { initialData: { id: 0, name: 'Fixture', type: 2 } })
  const host = document.createElement('div')
  host.id = 'comment-expansion-fixture'
  const frame = document.createElement('div')
  frame.style.cssText =
    'position:fixed;inset:0;z-index:99999;background:var(--background);height:600px;width:900px'
  // Virtua ignores ResizeObserver targets without offsetParent (including position:fixed).
  host.style.cssText = 'position:relative;overflow:auto;height:100%;width:100%'
  frame.append(host)
  document.body.append(frame)
  const atoms = Jotai.createStore()
  atoms.set(scroll.scrollViewportAtom, host)
  const root = ReactDOM.createRoot(host)
  const render = (id = fixtureId) => {
    if (kind === 'group' || kind === 'subject') {
      cache.setQueryDefaults([`community-${kind}-topic`], { initialData: topicData(id) })
    }
    const child =
      kind === 'list'
        ? h(list.CommentList, {
            comments,
            virtual: true,
            userAvatarViewTransition: false,
            scrollMemoryKey: `fixture:${id}`,
          })
        : kind === 'episode'
          ? h(episode.EpisodeContent, { episodeId: String(id) })
          : h(topic.CommunityTopicDetail, { kind, topicId: id })
    root.render(
      h(
        Router.MemoryRouter,
        null,
        h(Query.QueryClientProvider, { client: cache }, h(Jotai.Provider, { store: atoms }, child)),
      ),
    )
  }
  window.__commentExpansionFixture = {
    host,
    render,
    nextPage: () => render(fixtureId + 1),
    viewport: () => (kind === 'list' ? host.querySelector('.overflow-y-auto') : host),
    dispose: () => {
      root.unmount()
      frame.remove()
      cache.clear()
      delete window.__commentExpansionFixture
    },
  }
  render()
}

test.each(['group', 'subject', 'episode', 'list'])(
  '%s retains expansion after virtual row recycling',
  (kind) => {
    const tabs = run('tab').tabs
    const main = tabs.find(
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
    expect(
      evaluate('document.visibilityState'),
      'Keep the Electron window visible for layout tests',
    ).toBe('visible')
    try {
      // Pass import as browser source text so Vitest cannot transform it into an SSR helper.
      evaluate(`(${mountFixture.toString()})(${JSON.stringify(kind)}, path => import(path))`)
      run(
        'wait',
        '--fn',
        `!!document.querySelector('#comment-expansion-fixture [data-comment-id="1"] button[aria-label="展开评论"]')`,
      )
      evaluate(`(() => {
      const row = document.querySelector('#comment-expansion-fixture [data-comment-id="1"]');
      const buttons = [...row.querySelectorAll('button[aria-label="展开评论"]')];
      const controls = new Set();
      for (const button of buttons) {
        const id = button.getAttribute('aria-controls');
        if (!controls.has(id)) { controls.add(id); button.click(); }
      }
      [...row.querySelectorAll('button')].find(button => button.textContent.includes('展开剩余')).click();
      return true;
    })()`)
      const state = () =>
        evaluate(`(() => {
      const row = document.querySelector('#comment-expansion-fixture [data-comment-id="1"]');
      return { expandedContent: row.querySelectorAll('div[aria-expanded="true"]').length,
        allReplies: row.textContent.includes('收起回复'), lastReply: row.textContent.includes('Reply 4') };
    })()`)
      expect(state()).toEqual({ expandedContent: 2, allReplies: true, lastReply: true })
      const recycle = () => {
        evaluate(
          `(() => { const v = window.__commentExpansionFixture.viewport(); v.scrollTop = v.scrollHeight; return true; })()`,
        )
        run(
          'wait',
          '--fn',
          `!document.querySelector('#comment-expansion-fixture [data-comment-id="1"]')`,
        )
        evaluate(
          `(() => { window.__commentExpansionFixture.viewport().scrollTop = 0; return true; })()`,
        )
        run(
          'wait',
          '--fn',
          `!!document.querySelector('#comment-expansion-fixture [data-comment-id="1"]')`,
        )
      }
      recycle()
      expect(state()).toEqual({ expandedContent: 2, allReplies: true, lastReply: true })
      // Explicitly collapsing must also survive recycling.
      evaluate(`(() => {
      const row = document.querySelector('#comment-expansion-fixture [data-comment-id="1"]');
      const controls = new Set();
      for (const button of row.querySelectorAll('button[aria-label="收起评论"]')) {
        const id = button.getAttribute('aria-controls');
        if (!controls.has(id)) { controls.add(id); button.click(); }
      }
      [...row.querySelectorAll('button')].find(button => button.textContent.includes('收起回复')).click();
      return true;
    })()`)
      recycle()
      expect(state()).toEqual({ expandedContent: 0, allReplies: false, lastReply: false })
      evaluate(
        `document.querySelector('#comment-expansion-fixture [data-comment-id="1"] button[aria-label="展开评论"]').click()`,
      )
      // Reuse the same component with a new page ID and overlapping comment IDs.
      evaluate('window.__commentExpansionFixture.nextPage()')
      run(
        'wait',
        '--fn',
        `!!document.querySelector('#comment-expansion-fixture [data-comment-id="1"] button[aria-label="展开评论"]')`,
      )
      expect(state()).toEqual({ expandedContent: 0, allReplies: false, lastReply: false })
    } finally {
      evaluate('window.__commentExpansionFixture?.dispose()')
    }
  },
  120000,
)
