import { expect, test } from 'vitest'
import { runAgentBrowser } from '../../agent-browser.mjs'

const port = process.env.BANGUMI_ELECTRON_CDP_PORT || '9222'
function run(...args) {
  const result = runAgentBrowser(['--cdp', port, '--json', ...args], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 30000,
  })
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || result.error?.message)
  const output = JSON.parse(result.stdout)
  if (!output.success) throw new Error(output.error)
  return output.data
}
const evaluate = (script) => run('eval', '-b', Buffer.from(script).toString('base64')).result

test('offline home retains cached sections and shows fallbacks without error toasts', () => {
  // This smoke test targets an already running development Electron instance.
  // Start it with BANGUMI_ELECTRON_USER_DATA pointing to a disposable test profile.
  const tabs = run('tab').tabs
  const main = tabs.find((tab) =>
    /^http:\/\/(localhost|127\.0\.0\.1):\d+\/?(?:#\/)?$/.test(tab.url),
  )
  expect(main, 'Open the development app home page before running this test').toBeTruthy()
  run('tab', main.tabId)
  expect(run('get', 'title').title).toBe('Bangumi')
  const initial = evaluate('({online:navigator.onLine,width:innerWidth,height:innerHeight})')
  expect(initial.online, 'Start online; this test restores online mode in finally').toBe(true)

  try {
    evaluate(`(async () => {
    const queryModule = performance.getEntriesByType('resource').filter(entry=>entry.name.includes('/src/modules/wrapper/query.ts')).at(-1)?.name ?? '/src/modules/wrapper/query.ts';
    const {queryClient} = await import(queryModule);
    const qa = {queryClient,toasts:0};
    const seen = new WeakSet(document.querySelectorAll('[data-sonner-toast]'));
    qa.observer = new MutationObserver(() => {
      for(const item of document.querySelectorAll('[data-sonner-toast][data-type="error"]')) {
        if(!seen.has(item)) { seen.add(item); qa.toasts++; }
      }
    });
    qa.observer.observe(document.body,{childList:true,subtree:true});
    window.__offlineSmoke = qa;
    return true;
  })()`)
    run('set', 'offline', 'on')
    const cached = evaluate(`(async () => {
    const {queryClient} = window.__offlineSmoke;
    const active = queryClient.getQueryCache().getAll().filter(q => q.getObserversCount() && q.state.data !== undefined && ['calendar-v1','site-timeline-v1','community-trending-subject-topics-v3'].includes(q.queryKey[0]));
    if (!active.length) throw new Error('Wait for a cached home section before testing');
    const before = active.map(q => ({q,data:q.state.data,at:q.state.dataUpdatedAt}));
    await queryClient.refetchQueries({predicate:q=>active.includes(q)});
    await new Promise(resolve => setTimeout(resolve, 100));
    return {online:navigator.onLine,sections:before.length,retained:before.every(({q,data,at})=>q.state.data===data && q.state.dataUpdatedAt===at),statuses:before.every(({q})=>q.state.status==='success'),toasts:window.__offlineSmoke.toasts};
  })()`)
    expect(cached.online).toBe(false)
    expect(cached.retained).toBe(true)
    expect(cached.statuses).toBe(true)
    expect(cached.toasts).toBe(0)

    evaluate(`(() => {
    const qa=window.__offlineSmoke;
    qa.emptyQueries=qa.queryClient.getQueryCache().getAll().filter(q=>q.getObserversCount()&&['SectionTrendsV2','calendar-v1','site-timeline-v1','community-trending-subject-topics-v3','subject-info'].includes(q.queryKey[0])).map(q=>({q,state:q.state}));
    for(const {q} of qa.emptyQueries) q.setState({data:undefined,error:null,status:'pending',fetchStatus:'paused'});
    return true;
  })()`)
    run('wait', '--fn', 'document.querySelectorAll("[data-query-fallback]").length >= 4')
    const empty = evaluate(
      `({count:document.querySelectorAll('[data-query-fallback]').length,waiting:document.body.innerText.includes('当前处于离线状态'),retryDisabled:Array.from(document.querySelectorAll('[data-query-fallback] button')).every(button=>button.disabled)})`,
    )
    expect(empty.count).toBeGreaterThanOrEqual(4)
    expect(empty.waiting).toBe(true)
    expect(empty.retryDisabled).toBe(true)
  } finally {
    // Restore query snapshots before reconnect so normal active requests can resume.
    try {
      evaluate(
        `(() => { const qa=window.__offlineSmoke; for(const item of qa?.emptyQueries??[]) item.q.setState({...item.state,fetchStatus:'idle'}); qa?.observer?.disconnect(); delete window.__offlineSmoke; return true; })()`,
      )
    } finally {
      run('set', 'offline', 'off')
    }
  }
}, 120000)
