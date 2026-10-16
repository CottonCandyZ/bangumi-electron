import { Check, CircleAlert, CloudCheck, Clock3 } from 'lucide-react'
import { Image } from '@renderer/components/image/image'
import type { SyncOverview, SyncPhase, SyncProgress, SyncResult } from '@shared/collection-sync'

const phaseLabels: Record<SyncPhase, string> = {
  reading: '读取中',
  uploading: '上传中',
  verifying: '确认中',
}
const stageLabels: Record<SyncProgress['stage'], string> = {
  changes: '同步更改',
  list: '下载收藏清单',
  episodes: '核对章节',
}

function statusText(overview: SyncOverview) {
  if (overview.errors.some((record) => record.status === 'web-verification-required'))
    return { text: '取消收藏需要网页验证', attention: true }
  if (overview.running) return { text: '正在同步', attention: false }
  if (overview.authRequired) return { text: '需要重新登录', attention: true }
  if (overview.retryAt && overview.retryAt > Date.now())
    return { text: '连接不可用，稍后重试', attention: true }
  if (overview.error || overview.errors.length) return { text: '部分条目同步失败', attention: true }
  if (overview.conflicts.length)
    return { text: `${overview.conflicts.length} 个冲突待处理`, attention: true }
  if (overview.pending) return { text: `${overview.pending} 项待同步`, attention: false }
  return { text: '已同步', attention: false }
}

export function SyncStatus({ overview }: { overview: SyncOverview }) {
  const { text, attention } = statusText(overview)
  const Icon = attention ? CircleAlert : CloudCheck
  return (
    <p
      className={`flex items-center gap-1.5 text-xs ${attention ? 'text-destructive' : 'text-muted-foreground'}`}
      role="status"
    >
      <Icon className="size-3.5 shrink-0" />
      {text}
    </p>
  )
}

export function SyncActivity({ overview }: { overview: SyncOverview }) {
  const progress = overview.progress
  if (!overview.running || !progress) return null
  const { current, completed, total } = progress
  return (
    <section className="space-y-2.5" aria-label="当前同步进度">
      <div className="flex items-center gap-3" aria-live="polite">
        {current && (
          <Image
            key={current.subject.id}
            imageSrc={current.subject.cover}
            className="bg-muted h-12 w-9 shrink-0 overflow-hidden rounded"
            loading="eager"
            aria-hidden="true"
          />
        )}
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="truncate text-sm" title={current?.subject.title}>
            {current?.subject.title ?? stageLabels[progress.stage]}
          </div>
          <div className="text-muted-foreground flex justify-between gap-2 text-xs">
            <span>{current ? phaseLabels[current.phase] : '准备中'}</span>
            <span className="tabular-nums">{total === null ? '' : `${completed} / ${total}`}</span>
          </div>
        </div>
      </div>
      <StageProgress progress={progress} />
    </section>
  )
}

function StageProgress({ progress }: { progress: SyncProgress }) {
  const { completed, total } = progress
  const percent = total ? Math.min(100, (completed / total) * 100) : 0
  return (
    <div
      className="bg-muted h-1 overflow-hidden rounded-full"
      role="progressbar"
      aria-label={stageLabels[progress.stage]}
      aria-valuemin={0}
      aria-valuemax={total || 1}
      aria-valuenow={total === null ? undefined : Math.min(completed, total)}
    >
      <div
        className="bg-primary h-full rounded-full transition-[width] motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

const resultLabels: Record<SyncResult['status'], string> = {
  synced: '已同步',
  pending: '待同步',
  conflict: '冲突',
  error: '失败',
}
function ResultIcon({ status }: { status: SyncResult['status'] }) {
  if (status === 'synced') return <Check className="size-3.5" />
  if (status === 'pending') return <Clock3 className="size-3.5" />
  return <CircleAlert className="text-destructive size-3.5" />
}
export function SyncRecent({
  items,
  shownErrors = [],
}: {
  items: SyncResult[]
  shownErrors?: (string | null)[]
}) {
  if (!items.length) return null
  return (
    <section aria-label="最近同步结果">
      <h3 className="text-muted-foreground mb-1 text-xs">最近处理</h3>
      <ul>
        {items.slice(0, 3).map((item) => (
          <li key={item.subject.id} className="py-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                <ResultIcon status={item.status} />
              </span>
              <span className="min-w-0 flex-1 truncate" title={item.subject.title}>
                {item.subject.title}
              </span>
              <span className="text-muted-foreground shrink-0">{resultLabels[item.status]}</span>
            </div>
            {item.error && !shownErrors.includes(item.error) && (
              <p className="text-destructive mt-0.5 pl-5.5 text-xs break-words">{item.error}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function lastSyncedText(overview: SyncOverview) {
  return overview.lastSyncedAt
    ? `上次同步 ${new Date(overview.lastSyncedAt).toLocaleString('zh-CN', {
        hour12: false,
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : '尚未完整同步'
}
