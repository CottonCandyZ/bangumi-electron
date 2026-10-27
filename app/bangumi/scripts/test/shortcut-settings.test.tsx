// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { ShortcutSettings } from '../../src/renderer/src/modules/main/settings/shortcuts'
import { DEFAULT_APP_CONFIG, mergeAppConfig } from '../../src/shared/config'

const updateConfig = vi.fn()
let config = mergeAppConfig()

vi.mock('../../src/renderer/src/state/app-config', () => ({
  useAppConfig: () => ({ config, loaded: true, updateConfig }),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
  config = mergeAppConfig()
  updateConfig.mockReset().mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
})

function startRecording(title: string) {
  const button = screen.getByRole('button', { name: `修改「${title}」快捷键` })
  act(() => button.focus())
  fireEvent.click(button)
  return button
}

async function pressKey(init: KeyboardEventInit) {
  await act(async () => {
    fireEvent.keyDown(document.activeElement ?? document.body, init)
  })
}

test('records a new shortcut inline', async () => {
  render(<ShortcutSettings />)
  startRecording('后退')

  expect(screen.getByText('按下快捷键…')).toBeTruthy()
  await pressKey({ key: 'j', code: 'KeyJ', ctrlKey: true, shiftKey: true })

  expect(updateConfig).toHaveBeenCalledWith({ shortcuts: { navigateBack: 'mod+shift+j' } })
  expect(screen.queryByText('按下快捷键…')).toBeNull()
})

test('rejects a shortcut already used by another action and accepts a replacement', async () => {
  render(<ShortcutSettings />)
  startRecording('后退')

  await pressKey({ key: 'b', code: 'KeyB', ctrlKey: true })

  expect(updateConfig).not.toHaveBeenCalled()
  expect(screen.getByText('已被「切换左侧面板」占用')).toBeTruthy()

  await pressKey({ key: 'j', code: 'KeyJ', ctrlKey: true, shiftKey: true })
  expect(updateConfig).toHaveBeenCalledWith({ shortcuts: { navigateBack: 'mod+shift+j' } })
  expect(screen.queryByText('已被「切换左侧面板」占用')).toBeNull()
})

test('detects a default shortcut conflict regardless of modifier order', async () => {
  render(<ShortcutSettings />)
  startRecording('后退')

  await pressKey({ key: 'b', code: 'KeyB', ctrlKey: true, altKey: true, shiftKey: true })

  expect(updateConfig).not.toHaveBeenCalled()
  expect(screen.getByText('已被「桌面打开命令面板」占用')).toBeTruthy()
})

test('cancels with Escape without changing the shortcut', async () => {
  render(<ShortcutSettings />)
  startRecording('后退')
  await pressKey({ key: 'Escape', code: 'Escape' })
  expect(updateConfig).not.toHaveBeenCalled()
  expect(screen.queryByText('按下快捷键…')).toBeNull()
})

test.each(['Backspace', 'Delete'])('clears the shortcut with %s', async (key) => {
  render(<ShortcutSettings />)
  startRecording('后退')
  await pressKey({ key, code: key })
  expect(updateConfig).toHaveBeenCalledWith({ shortcuts: { navigateBack: '' } })
})

test('waits for a non-modifier key', async () => {
  render(<ShortcutSettings />)
  startRecording('后退')
  await pressKey({ key: 'Control', code: 'ControlLeft', ctrlKey: true })

  expect(updateConfig).not.toHaveBeenCalled()
  expect(screen.getByText('按下快捷键…')).toBeTruthy()
})

test('stops recording when the button loses focus', async () => {
  render(<ShortcutSettings />)
  const button = startRecording('后退')
  act(() => button.blur())
  await pressKey({ key: 'j', code: 'KeyJ', ctrlKey: true, shiftKey: true })

  expect(updateConfig).not.toHaveBeenCalled()
  expect(screen.queryByText('按下快捷键…')).toBeNull()
})

test('rejects restoring a default shortcut that another action now uses', async () => {
  config.shortcuts.navigateBack = 'mod+shift+j'
  config.shortcuts.toggleLeftPanel = DEFAULT_APP_CONFIG.shortcuts.navigateBack
  render(<ShortcutSettings />)

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '还原「后退」默认快捷键' }))
  })

  expect(updateConfig).not.toHaveBeenCalled()
  expect(toast.error).toHaveBeenCalledWith('快捷键已被「切换左侧面板」占用')
})

test('restores all shortcuts together even when their current bindings are swapped', async () => {
  config.shortcuts.navigateBack = DEFAULT_APP_CONFIG.shortcuts.toggleLeftPanel
  config.shortcuts.toggleLeftPanel = DEFAULT_APP_CONFIG.shortcuts.navigateBack
  render(<ShortcutSettings />)

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '全部还原' }))
  })

  expect(updateConfig).toHaveBeenCalledExactlyOnceWith({ shortcuts: DEFAULT_APP_CONFIG.shortcuts })
  expect(toast.success).toHaveBeenCalledWith('已还原全部快捷键')
})

test('handles a failed restore without reporting success and allows retrying', async () => {
  config.shortcuts.navigateBack = 'mod+shift+j'
  updateConfig.mockRejectedValueOnce(new Error('save failed'))
  render(<ShortcutSettings />)

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '全部还原' }))
  })

  expect(toast.error).toHaveBeenCalledWith('保存快捷键设置失败')
  expect(toast.success).not.toHaveBeenCalled()

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '全部还原' }))
  })
  expect(updateConfig).toHaveBeenCalledTimes(2)
  expect(toast.success).toHaveBeenCalledWith('已还原全部快捷键')
})

test('handles a failed recording save and allows recording again', async () => {
  updateConfig.mockRejectedValueOnce(new Error('save failed'))
  render(<ShortcutSettings />)
  startRecording('后退')
  await pressKey({ key: 'j', code: 'KeyJ', ctrlKey: true, shiftKey: true })

  expect(toast.error).toHaveBeenCalledWith('保存快捷键设置失败')
  expect(screen.queryByText('按下快捷键…')).toBeNull()

  startRecording('后退')
  await pressKey({ key: 'i', code: 'KeyI', ctrlKey: true, shiftKey: true })
  expect(updateConfig).toHaveBeenLastCalledWith({ shortcuts: { navigateBack: 'mod+shift+i' } })
})
