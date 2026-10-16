import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test, vi } from 'vitest'
import {
  SyncRecent,
  SyncStatus,
} from '../../src/renderer/src/modules/common/collections/sync-progress'
import type { SyncOverview } from '../../src/shared/collection-sync'

vi.mock('@renderer/components/image/image', () => ({ Image: () => null }))

test('recent results keep the affected subject without repeating an already shown error', () => {
  const html = renderToStaticMarkup(
    createElement(SyncRecent, {
      items: [
        { subject: { id: 42, title: '测试条目' }, status: 'error', error: '请求失败（502）' },
      ],
      shownErrors: ['请求失败（502）'],
    }),
  )
  expect(html).toContain('测试条目')
  expect(html).toContain('失败')
  expect(html).not.toContain('请求失败（502）')
})

test('CF-blocked removals ask for webpage verification instead of a network retry or login', () => {
  const html = renderToStaticMarkup(
    createElement(SyncStatus, {
      overview: {
        running: false,
        authRequired: false,
        errors: [{ status: 'web-verification-required' }],
      } as SyncOverview,
    }),
  )
  expect(html).toContain('取消收藏需要网页验证')
  expect(html).not.toContain('重试')
  expect(html).not.toContain('重新登录')
})

test('recent results still explain an error that is not shown elsewhere', () => {
  const html = renderToStaticMarkup(
    createElement(SyncRecent, {
      items: [{ subject: { id: 42, title: '测试条目' }, status: 'error', error: '章节请求失败' }],
      shownErrors: ['请求失败（502）'],
    }),
  )
  expect(html).toContain('章节请求失败')
})
