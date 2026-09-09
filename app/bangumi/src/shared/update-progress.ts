import type { AppUpdateState } from './update'
import { formatUpdatePackageSize } from './update-size'

export function getUpdateProgressTitle(state: AppUpdateState): string {
  const activity = state.activity
  if (!activity) return `下载中 ${Math.round(state.percent ?? 0)}%`
  switch (activity.phase) {
    case 'prepare':
      return '正在准备更新'
    case 'delta':
      return `正在下载增量包 ${activity.index}/${activity.count}`
    case 'full':
      return activity.fallback ? '增量更新失败，正在下载完整包' : '正在下载完整包'
    case 'verify':
      return activity.index
        ? `正在校验增量包 ${activity.index}/${activity.count}`
        : '正在校验完整包'
    case 'reconstruct':
      return '正在合成安装包'
  }
}

export function getUpdateProgressDescription(state: AppUpdateState): string {
  const title = getUpdateProgressTitle(state)
  const activity = state.activity
  if (activity?.phase === 'reconstruct') {
    return `${title} · 已生成 ${formatUpdatePackageSize(activity.bytes)}`
  }
  if (!activity || !['delta', 'full'].includes(activity.phase)) return title
  return `${title} · ${formatUpdatePackageSize(activity.bytes)} / ${formatUpdatePackageSize(activity.totalBytes)}`
}
