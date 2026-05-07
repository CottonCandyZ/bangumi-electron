import koffi from 'koffi'

type NativeWindowHandle = unknown

const isWindows = process.platform === 'win32'
const SW_RESTORE = 9

let lastForegroundWindow: NativeWindowHandle | null = null

function getUser32() {
  if (!isWindows) return null

  try {
    const user32 = koffi.load('user32.dll')
    return {
      getForegroundWindow: user32.func(
        'void* GetForegroundWindow(void)',
      ) as () => NativeWindowHandle,
      isWindow: user32.func('bool IsWindow(void* hWnd)') as (
        windowHandle: NativeWindowHandle,
      ) => boolean,
      setForegroundWindow: user32.func('bool SetForegroundWindow(void* hWnd)') as (
        windowHandle: NativeWindowHandle,
      ) => boolean,
      showWindow: user32.func('bool ShowWindow(void* hWnd, int nCmdShow)') as (
        windowHandle: NativeWindowHandle,
        command: number,
      ) => boolean,
    }
  } catch (error) {
    console.warn('[windows-focus] failed to load user32.dll', error)
    return null
  }
}

const user32 = getUser32()

export function captureForegroundWindow() {
  if (!user32) return

  try {
    const foregroundWindow = user32.getForegroundWindow()
    lastForegroundWindow = foregroundWindow || null
  } catch (error) {
    lastForegroundWindow = null
    console.warn('[windows-focus] failed to capture foreground window', error)
  }
}

export function restoreForegroundWindow() {
  if (!user32 || !lastForegroundWindow) return

  try {
    if (!user32.isWindow(lastForegroundWindow)) {
      lastForegroundWindow = null
      return
    }

    user32.showWindow(lastForegroundWindow, SW_RESTORE)
    user32.setForegroundWindow(lastForegroundWindow)
  } catch (error) {
    console.warn('[windows-focus] failed to restore foreground window', error)
  } finally {
    lastForegroundWindow = null
  }
}
