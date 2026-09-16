import { expect, test } from 'vitest'
import { createCommentExpansionStore } from '../../src/renderer/src/components/comment/comment-expansion-store'

test('expanded content and replies survive row unsubscription and remount', () => {
  const store = createCommentExpansionStore()
  const unsubscribe = store.subscribe(() => undefined)
  store.set('comment:1:content', 'long comment', true)
  store.set('comment:1:replies', '', true)
  store.set('reply:2:content', 'long reply', true)
  unsubscribe()
  const remount = store.subscribe(() => undefined)
  expect(store.get('comment:1:content', 'long comment')).toBe(true)
  expect(store.get('comment:1:replies', '')).toBe(true)
  expect(store.get('reply:2:content', 'long reply')).toBe(true)
  store.set('comment:1:content', 'long comment', false)
  expect(store.get('comment:1:content', 'long comment')).toBe(false)
  remount()
})

test('edited content, other comments and a fresh page do not inherit expansion', () => {
  const page = createCommentExpansionStore()
  page.set('comment:1:content', 'original', true)
  expect(page.get('comment:1:content', 'edited')).toBe(false)
  expect(page.get('comment:2:content', 'original')).toBe(false)
  expect(createCommentExpansionStore().get('comment:1:content', 'original')).toBe(false)
})
