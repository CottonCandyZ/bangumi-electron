import { describe, expect, test } from 'vitest'
import { withWindowsOverlayScrollbars } from '../../src/shared/chromium-startup.mjs'

describe('Windows Chromium startup features', () => {
  test('preserves launch arguments while enabling overlay mode', () => {
    expect(
      withWindowsOverlayScrollbars(
        ['--remote-debugging-port=9224', 'bangumi://subject/1'],
        'win32',
      ),
    ).toEqual([
      '--remote-debugging-port=9224',
      'bangumi://subject/1',
      '--enable-features=OverlayScrollbar:mode/overlay',
    ])
  })

  test('preserves unrelated features and replaces an existing overlay mode', () => {
    expect(
      withWindowsOverlayScrollbars(
        [
          '--enable-features=Other:mode/a,OverlayScrollbar:mode/device,OverlayScrollbarFlashWhenMouseEnter',
        ],
        'win32',
      ),
    ).toEqual([
      '--enable-features=Other:mode/a,OverlayScrollbarFlashWhenMouseEnter,OverlayScrollbar:mode/overlay',
    ])
  })

  test('merges repeated switches and the separate-value form', () => {
    expect(
      withWindowsOverlayScrollbars(
        ['--enable-features=A', '--enable-features', 'B', 'app-entry'],
        'win32',
      ),
    ).toEqual(['app-entry', '--enable-features=A,B,OverlayScrollbar:mode/overlay'])
  })

  test('does not relaunch a process that already has the required mode', () => {
    const args = ['app-entry', '--enable-features=A,OverlayScrollbar:mode/overlay']
    expect(withWindowsOverlayScrollbars(args, 'win32')).toBe(args)
  })

  test('does not mistake similarly named features for overlay mode', () => {
    const args = ['--enable-features=OverlayScrollbarFlashWhenMouseEnter']
    expect(withWindowsOverlayScrollbars(args, 'win32')).not.toBe(args)
  })

  test('retains overlay mode when a later feature switch would replace it', () => {
    expect(
      withWindowsOverlayScrollbars(
        ['--enable-features=OverlayScrollbar:mode/overlay', '--enable-features=Other'],
        'win32',
      ),
    ).toEqual(['--enable-features=Other,OverlayScrollbar:mode/overlay'])
  })

  test('keeps application arguments after the switch separator unchanged', () => {
    expect(
      withWindowsOverlayScrollbars(['app-entry', '--', '--enable-features=Content'], 'win32'),
    ).toEqual([
      'app-entry',
      '--enable-features=OverlayScrollbar:mode/overlay',
      '--',
      '--enable-features=Content',
    ])
  })

  test.each(['darwin', 'linux'])('leaves %s startup unchanged', (platform) => {
    const args = ['app-entry', '--enable-features=Other']
    expect(withWindowsOverlayScrollbars(args, platform)).toBe(args)
  })
})
