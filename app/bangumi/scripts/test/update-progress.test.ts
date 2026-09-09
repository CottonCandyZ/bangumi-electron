import { expect, test } from 'vitest'
import {
  getUpdateProgressDescription,
  getUpdateProgressTitle,
} from '../../src/shared/update-progress'
import type { AppUpdateState } from '../../src/shared/update'

const state: AppUpdateState = {
  status: 'downloading',
  currentVersion: '0.0.1-beta.32',
  channel: 'beta',
  packageChannel: 'win-x64-beta',
  percent: 10,
  activity: { phase: 'delta', bytes: 1024, totalBytes: 4096, index: 2, count: 2, fallback: false },
}

test('shows the active delta index and bytes even when overall percent is unchanged', () => {
  expect(getUpdateProgressDescription(state)).toBe('正在下载增量包 2/2 · 1 KiB / 4 KiB')
  expect(
    getUpdateProgressDescription({ ...state, activity: { ...state.activity!, bytes: 2048 } }),
  ).toBe('正在下载增量包 2/2 · 2 KiB / 4 KiB')
})

test('reconstruction and verification do not claim to be downloading', () => {
  expect(
    getUpdateProgressDescription({
      ...state,
      activity: { ...state.activity!, phase: 'reconstruct' },
    }),
  ).toBe('正在合成安装包 · 已生成 1 KiB')
  expect(
    getUpdateProgressTitle({ ...state, activity: { ...state.activity!, phase: 'verify' } }),
  ).toBe('正在校验增量包 2/2')
})

test('reports full fallback distinctly and supports clients without activity events', () => {
  expect(
    getUpdateProgressTitle({
      ...state,
      activity: { ...state.activity!, phase: 'full', fallback: true, index: null },
    }),
  ).toBe('增量更新失败，正在下载完整包')
  expect(getUpdateProgressTitle({ ...state, activity: undefined })).toBe('下载中 10%')
})
