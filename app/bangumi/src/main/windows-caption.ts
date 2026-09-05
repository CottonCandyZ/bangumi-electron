import koffi from 'koffi'
import type { BrowserWindow } from 'electron'

export function hideWindowsCaptionIcon(window: BrowserWindow) {
  if (process.platform !== 'win32' || window.isDestroyed()) return
  try {
    const user32 = koffi.load('user32.dll')
    const getStyle = user32.func('int32 __stdcall GetWindowLongW(void* hwnd, int index)')
    const setStyle = user32.func(
      'int32 __stdcall SetWindowLongW(void* hwnd, int index, int32 style)',
    )
    const send = user32.func(
      'intptr __stdcall SendMessageW(void* hwnd, uint32 message, uintptr wParam, intptr lParam)',
    )
    const refresh = user32.func(
      'bool __stdcall SetWindowPos(void* hwnd, void* after, int x, int y, int width, int height, uint32 flags)',
    )
    const hwnd = koffi.decode(window.getNativeWindowHandle(), 'void*')
    // Hide the caption's small icon without replacing ICON_BIG used by the taskbar/Alt+Tab.
    const GWL_EXSTYLE = -20
    const WS_EX_DLGMODALFRAME = 0x0001
    setStyle(hwnd, GWL_EXSTYLE, getStyle(hwnd, GWL_EXSTYLE) | WS_EX_DLGMODALFRAME)
    send(hwnd, 0x0080, 0, 0) // WM_SETICON, ICON_SMALL
    refresh(hwnd, null, 0, 0, 0, 0, 0x0037) // FRAMECHANGED | NOMOVE | NOSIZE | NOZORDER | NOACTIVATE
  } catch (error) {
    console.warn('[window] could not hide caption icon', error)
  }
}
