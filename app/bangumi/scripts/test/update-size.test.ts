import { expect, test } from 'vitest'
import { getUpdatePackageSizes, getUpdateSizeDescription } from '../../src/shared/update-size'
import type { AppUpdateState } from '../../src/shared/update'

const state = (
  status: AppUpdateState['status'],
  sizes: Partial<AppUpdateState>,
): AppUpdateState => ({
  status,
  currentVersion: '1',
  channel: 'beta',
  packageChannel: 'win-x64-beta',
  ...sizes,
})
test('delta chains report total download bytes separately from reconstructed full package', () => {
  const sizes = getUpdatePackageSizes(
    { Size: 154443968 },
    {
      BaseRelease: { Size: 150000000 },
      DeltasToTarget: [{ Size: 65536 }, { Size: 40052 }],
    },
  )
  expect(sizes).toEqual({ fullPackageSize: 154443968, deltaPackageSize: 105588 })
  expect(getUpdateSizeDescription(state('downloading', sizes))).toBe(
    '增量包 103.11 KiB · 完整包 147.29 MiB（增量更新失败时使用）',
  )
  expect(getUpdateSizeDescription(state('downloaded', sizes))).toBe('完整包 147.29 MiB')
})
test('full updates and restored downloaded packages expose size without claiming a delta', () => {
  const sizes = getUpdatePackageSizes({ Size: 1048576 }, { DeltasToTarget: [{ Size: 32 }] })
  expect(sizes.deltaPackageSize).toBeUndefined()
  expect(getUpdateSizeDescription(state('available', sizes))).toBe('完整包 1 MiB')
  expect(
    getUpdateSizeDescription(state('downloaded', getUpdatePackageSizes({ Size: 1048576 }))),
  ).toBe('完整包 1 MiB')
})
test('missing or invalid metadata is not displayed as a zero byte download', () => {
  expect(getUpdateSizeDescription(null)).toBeUndefined()
  expect(
    getUpdateSizeDescription(state('available', getUpdatePackageSizes({ Size: NaN }))),
  ).toBeUndefined()
})
