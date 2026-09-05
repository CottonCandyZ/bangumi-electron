import type { AppUpdateState } from './update'

type AssetSize = { Size: number }
type UpdatePlan = { BaseRelease?: AssetSize; DeltasToTarget: AssetSize[] }

export function getUpdatePackageSizes(
  asset: AssetSize,
  plan?: UpdatePlan,
): Pick<AppUpdateState, 'fullPackageSize' | 'deltaPackageSize'> {
  const valid = (size: number) => Number.isFinite(size) && size >= 0
  const deltas = plan?.BaseRelease ? plan.DeltasToTarget : []
  return {
    fullPackageSize: valid(asset.Size) ? asset.Size : undefined,
    deltaPackageSize:
      deltas.length && deltas.every((delta) => valid(delta.Size))
        ? deltas.reduce((total, delta) => total + delta.Size, 0)
        : undefined,
  }
}

export function formatUpdatePackageSize(bytes: number): string {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
  const unit =
    bytes > 0 ? Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1) : 0
  return `${(bytes / 1024 ** unit).toLocaleString('zh-CN', { maximumFractionDigits: unit === 0 ? 0 : 2 })} ${units[unit]}`
}

export function getUpdateSizeDescription(state: AppUpdateState | null): string | undefined {
  if (state?.fullPackageSize === undefined) return undefined
  const full = `完整包 ${formatUpdatePackageSize(state.fullPackageSize)}`
  if (state.status === 'downloaded' || state.deltaPackageSize === undefined) return full
  return `增量包 ${formatUpdatePackageSize(state.deltaPackageSize)} · ${full}（增量更新失败时使用）`
}
