import type { SyncOverview } from '@shared/collection-sync'

export function collectionSyncIndicator(overview: SyncOverview | undefined) {
  if (!overview) return { badge: null, title: '同步收藏' }
  const needsAttention = !!(overview.conflicts.length || overview.errors.length || overview.error)
  if (overview.running) {
    const progress = overview.progress
    const remaining =
      progress?.total == null ? null : Math.max(0, progress.total - progress.completed)
    const stage = progress?.stage === 'list' ? '下载收藏清单' : '同步收藏'
    const count = remaining === null ? '' : `（剩余 ${remaining} 项）`
    return {
      badge: remaining || null,
      title: `正在${stage}${count}${needsAttention ? ' · 有冲突或异常待处理' : ''}`,
    }
  }
  return {
    badge: needsAttention ? '!' : overview.pending || null,
    title: needsAttention ? '查看收藏同步冲突或异常' : `同步收藏（${overview.pending} 个待同步）`,
  }
}
