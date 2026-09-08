import { expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  dock: vi.fn(),
  submitted: vi.fn(),
  load: vi.fn().mockResolvedValue(undefined),
  main: { webContents: {}, isMinimized: () => false, show: vi.fn(), focus: vi.fn() },
}))
vi.mock('electron', () => ({
  BrowserWindow: class {
    destroyed = false
    on = vi.fn()
    loadFile = mocks.load
    show = vi.fn()
    focus = vi.fn()
    isDestroyed() {
      return this.destroyed
    }
    isMinimized() {
      return false
    }
    destroy() {
      this.destroyed = true
    }
  },
}))
vi.mock('@electron-toolkit/utils', () => ({ is: { dev: false } }))
vi.mock('@egoist/tipc/main', () => ({
  getRendererHandlers: () => ({
    dockReplyComposer: { send: mocks.dock },
    replySubmitted: { send: mocks.submitted },
  }),
}))
vi.mock('../../src/main/app-context', () => ({
  getOrCreateMainWindowFromContext: () => mocks.main,
}))
vi.mock('../../src/main/app-flags', () => ({ isAppQuitting: () => false }))
import {
  openReplyWindow,
  getReplyWindowContent,
  updateReplyWindowDraft,
  dockReplyWindow,
  finishReplyWindow,
  focusReplyWindow,
} from '../../src/main/reply-window'

test('window handoff preserves reply metadata and latest draft without replacing an active draft', async () => {
  const content = {
    target: { type: 'episode' as const, id: '42' },
    draft: 'initial',
    replyTo: 7,
    editCommentId: 9,
  }
  expect(await openReplyWindow(content)).toBe(true)
  updateReplyWindowDraft('edited **draft**')
  expect(await openReplyWindow({ ...content, draft: 'replacement' })).toBe(false)
  expect(getReplyWindowContent()).toEqual({ ...content, draft: 'edited **draft**' })
  expect(focusReplyWindow()).toBe(true)
  dockReplyWindow(getReplyWindowContent()!)
  expect(mocks.dock).toHaveBeenCalledWith({ ...content, draft: 'edited **draft**' })
  expect(getReplyWindowContent()).toBeNull()
  expect(focusReplyWindow()).toBe(false)
})

test('successful submission notifies the main window and clears the draft', async () => {
  const content = { target: { type: 'character' as const, id: '123' }, draft: 'reply' }
  await openReplyWindow(content)
  finishReplyWindow()
  expect(mocks.submitted).toHaveBeenCalledWith(content.target)
  expect(getReplyWindowContent()).toBeNull()
})

test('a failed window load leaves no phantom active draft', async () => {
  mocks.load.mockRejectedValueOnce(new Error('load failed'))
  await expect(
    openReplyWindow({ target: { type: 'blog', id: '42' }, draft: 'keep in sidebar' }),
  ).rejects.toThrow('load failed')
  expect(getReplyWindowContent()).toBeNull()
  expect(focusReplyWindow()).toBe(false)
})
