// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { afterEach, expect, test } from 'vitest'
import { PanelNav } from '../../src/renderer/src/modules/nav/panel/nav'
import { collectionPanelResourceTypeAtom } from '../../src/renderer/src/state/collection'
import { leftPanelOpenAtom, leftPanelOpenContentAtom } from '../../src/renderer/src/state/panel'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

function renderNav() {
  const store = createStore()
  render(
    <Provider store={store}>
      <PanelNav />
    </Provider>,
  )
  return store
}

async function openMoreMenu() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '更多收藏' }))
  })
}

test('lists every extra collection when none is active', async () => {
  renderNav()
  await openMoreMenu()

  expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
    '角色收藏',
    '人物收藏',
    '目录收藏',
  ])
})

test('moves the active extra collection out of the menu into its own list item', async () => {
  const store = renderNav()
  act(() => {
    store.set(leftPanelOpenAtom, true)
    store.set(leftPanelOpenContentAtom, 'collection')
    store.set(collectionPanelResourceTypeAtom, 'character')
  })

  const activeButton = screen.getByRole('button', { name: '角色收藏' })
  const moreButton = screen.getByRole('button', { name: '更多收藏' })
  // 两个按钮各占一个 li，才能吃到列表的 gap
  expect(activeButton.closest('li')).not.toBe(moreButton.closest('li'))

  await openMoreMenu()
  expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
    '人物收藏',
    '目录收藏',
  ])

  await act(async () => {
    fireEvent.click(screen.getByRole('menuitem', { name: '目录收藏' }))
  })
  expect(store.get(collectionPanelResourceTypeAtom)).toBe('index')
})
