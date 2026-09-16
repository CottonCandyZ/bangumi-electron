import { getIconPath } from '@main/helper'
import { t } from '@main/tipc/_init'
import { BrowserWindow } from 'electron'

const VERIFICATION_TIMEOUT_MS = 5 * 60 * 1000

type BangumiSectionPath = 'anime' | 'book' | 'music' | 'game' | 'real'
type VerifiedPages = Partial<Record<BangumiSectionPath, string>>

let verificationWindow: BrowserWindow | null = null
let verificationPromise: Promise<VerifiedPages> | null = null

export const webVerificationIPC = {
  requestBangumiWebVerification: t.procedure
    .input<{ sectionPath?: BangumiSectionPath }>()
    .action(async ({ input }) => {
      return await requestBangumiWebVerification(input.sectionPath ?? 'anime')
    }),
}

function requestBangumiWebVerification(sectionPath: BangumiSectionPath) {
  if (verificationPromise) {
    verificationWindow?.show()
    verificationWindow?.focus()
    return verificationPromise
  }

  verificationPromise = createBangumiWebVerificationWindow(sectionPath).finally(() => {
    verificationPromise = null
    verificationWindow = null
  })
  return verificationPromise
}

function createBangumiWebVerificationWindow(sectionPath: BangumiSectionPath) {
  return new Promise<VerifiedPages>((resolve, reject) => {
    const parent = BrowserWindow.getFocusedWindow() ?? undefined
    const window = new BrowserWindow({
      width: 860,
      height: 720,
      minWidth: 420,
      minHeight: 520,
      parent,
      modal: !!parent,
      title: 'Bangumi 网页验证',
      autoHideMenuBar: true,
      icon: getIconPath(),
      webPreferences: {
        sandbox: true,
      },
    })
    verificationWindow = window

    let settled = false
    let collecting = false
    const timeout = setTimeout(() => {
      finish(new Error('Bangumi 网页验证超时。'))
    }, VERIFICATION_TIMEOUT_MS)

    const finish = (error?: Error, pages?: VerifiedPages) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      if (!window.isDestroyed()) window.close()
      if (error) {
        reject(error)
        return
      }
      resolve(pages ?? {})
    }

    window.webContents.on('did-finish-load', () => {
      void window.webContents
        .executeJavaScript(
          "document.querySelector('.subjectCover.cover.ll') ? document.documentElement.outerHTML : null",
          true,
        )
        .then(async (html: string | null) => {
          if (!html || collecting || settled) return
          collecting = true
          const pages: VerifiedPages = { [sectionPath]: html }
          // Reuse the verified first-party browser context for every home category.
          // A slow or unavailable category must not discard the pages already read.
          for (const section of ['anime', 'book', 'music', 'game', 'real'] as const) {
            if (settled || window.isDestroyed()) return
            if (section === sectionPath) continue
            try {
              const page = await window.webContents.executeJavaScript(`(async () => {
                const response = await fetch('/${section}/browser/?sort=trends', {
                  credentials: 'include', signal: AbortSignal.timeout(10000)
                });
                if (!response.ok) return null;
                const html = await response.text();
                const document = new DOMParser().parseFromString(html, 'text/html');
                return document.querySelector('.subjectCover.cover.ll') ? html : null;
              })()`)
              if (typeof page === 'string') pages[section] = page
            } catch {
              // Failed categories will retry through their normal query after verification.
            }
          }
          finish(undefined, pages)
        })
        .catch(() => {
          // The challenge can navigate while the previous document is being inspected.
        })
    })

    window.webContents.on('will-navigate', (event, url) => {
      const target = new URL(url)
      const allowedHost =
        target.hostname === 'bgm.tv' || target.hostname.endsWith('.cloudflare.com')
      if (target.protocol === 'https:' && allowedHost) return
      event.preventDefault()
    })
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    window.once('closed', () => {
      finish(new Error('Bangumi 网页验证已取消。'))
    })
    window.loadURL(`https://bgm.tv/${sectionPath}/browser/?sort=trends`).catch((error: unknown) => {
      finish(error instanceof Error ? error : new Error('无法打开 Bangumi 网页验证。'))
    })
  })
}
