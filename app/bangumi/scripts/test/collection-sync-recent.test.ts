import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test, vi } from 'vitest'
import { SyncRecent } from '../../src/renderer/src/modules/common/collections/sync-progress'

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
  expect(html).toContain('未完成')
  expect(html).not.toContain('请求失败（502）')
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
