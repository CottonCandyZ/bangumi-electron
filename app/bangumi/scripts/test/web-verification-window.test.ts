import { afterEach, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  windows: [] as { destroyed: boolean; webContents: { executeJavaScript: unknown } }[],
  failSection: '',
}))

vi.mock('@main/helper', () => ({ getIconPath: () => 'icon.png' }))
vi.mock('@main/tipc/_init', () => ({
  t: { procedure: { input: () => ({ action: (handler: unknown) => handler }) } },
}))
vi.mock('electron', async () => {
  const { EventEmitter } = await import('node:events')
  class BrowserWindow extends EventEmitter {
    static getFocusedWindow() {
      return undefined
    }
    destroyed = false
    webContents = Object.assign(new EventEmitter(), {
      executeJavaScript: vi.fn(async (script: string) => {
        if (script.startsWith('document.querySelector')) return '<html>verified anime</html>'
        const section = script.match(/fetch\('\/(\w+)\/browser/)?.[1]
        if (section === mocks.failSection) throw new Error('network unavailable')
        return `<html>${section}</html>`
      }),
      setWindowOpenHandler: vi.fn(),
    })
    constructor() {
      super()
      mocks.windows.push(this)
    }
    show() {
      return undefined
    }
    focus() {
      return undefined
    }
    isDestroyed() {
      return this.destroyed
    }
    close() {
      this.destroyed = true
      this.emit('closed')
    }
    async loadURL() {
      queueMicrotask(() => this.webContents.emit('did-finish-load'))
    }
  }
  return { BrowserWindow }
})

afterEach(() => {
  mocks.windows.length = 0
  mocks.failSection = ''
})

async function verify(sectionPath: string) {
  const { webVerificationIPC } = await import('../../src/main/tipc/web-verification')
  // The IPC builder is replaced with its action handler for the window lifecycle test.
  return (
    webVerificationIPC.requestBangumiWebVerification as unknown as (args: {
      input: { sectionPath: string }
    }) => Promise<Record<string, string>>
  )({ input: { sectionPath } })
}

test('concurrent categories share one verification window and receive correctly keyed pages', async () => {
  const [anime, game] = await Promise.all([verify('anime'), verify('game')])
  expect(mocks.windows).toHaveLength(1)
  expect(anime).toEqual(game)
  expect(Object.keys(anime).sort()).toEqual(['anime', 'book', 'game', 'music', 'real'])
  expect(anime.anime).toContain('verified anime')
  expect(anime.game).toBe('<html>game</html>')
  expect(mocks.windows[0].webContents.executeJavaScript).toHaveBeenCalledTimes(5)
  expect(mocks.windows[0].destroyed).toBe(true)
})

test('one failed category retains verified pages and still collects subsequent categories', async () => {
  mocks.failSection = 'book'
  const pages = await verify('anime')
  expect(pages.book).toBeUndefined()
  expect(pages.anime).toBeDefined()
  expect(pages.music).toBeDefined()
  expect(pages.game).toBeDefined()
  expect(pages.real).toBeDefined()
})
