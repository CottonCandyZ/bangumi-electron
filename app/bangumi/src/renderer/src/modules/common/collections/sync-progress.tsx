import { Check, CircleAlert, CloudCheck, CloudDownload, Clock3 } from 'lucide-react'
import { Image } from '@renderer/components/image/image'
import type { SyncOverview, SyncPhase, SyncProgress, SyncResult } from '@shared/collection-sync'

const phaseLabels: Record<SyncPhase, string> = {
  reading: '读取远端收藏与章节',
  uploading: '上传本地更改',
  verifying: '确认远端结果',
}
const stageLabels: Record<SyncProgress['stage'], string> = {
  changes: '同步本地更改与已打开的条目',
  list: '下载收藏清单',
  episodes: '核对收藏与章节',
}

export function SyncSummary({ overview }: { overview: SyncOverview }) {
  return (
    <div className="bg-muted/40 grid grid-cols-3 divide-x rounded-lg border py-3 text-center">
      {[
        { label: '待同步', count: overview.pending },
        { label: '待处理冲突', count: overview.conflicts.length },
        { label: '同步异常', count: Math.max(overview.errors.length, overview.error ? 1 : 0) },
      ].map(({ label, count }) => (
        <div key={label} className="space-y-1">
          <div className="text-lg leading-none font-medium tabular-nums">{count}</div>
          <div className="text-muted-foreground text-xs">{label}</div>
        </div>
      ))}
    </div>
  )
}

export function SyncActivity({ overview }: { overview: SyncOverview }) {
  const progress = overview.progress
  if (!overview.running || !progress) return <SyncIdle overview={overview} />
  const { current } = progress
  return (
    <section className="space-y-4 rounded-lg border p-4" aria-label="当前同步进度">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{stageLabels[progress.stage]}</span>
        <span className="shrink-0 tabular-nums">
          {progress.total === null
            ? '正在获取数量'
            : `${progress.stage === 'list' ? '已下载' : '已处理'} ${progress.completed} / ${progress.total}`}
        </span>
      </div>
      <div className="flex min-h-16 items-center gap-3" role="status" aria-live="polite">
        {current ? (
          <>
            <Image
              key={current.subject.id}
              imageSrc={current.subject.cover}
              className="bg-muted h-16 w-12 shrink-0 overflow-hidden rounded-md"
              loading="eager"
              aria-hidden="true"
            />
            <div className="min-w-0 space-y-1.5">
              <div
                className="line-clamp-2 text-sm leading-snug font-medium break-words"
                title={current.subject.title}
              >
                {current.subject.title}
              </div>
              <div className="text-muted-foreground text-xs">{phaseLabels[current.phase]}</div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-muted flex size-12 shrink-0 items-center justify-center rounded-lg">
              <CloudDownload className="text-muted-foreground size-5" />
            </div>
            <div className="space-y-1.5">
              <div className="text-sm font-medium">{stageLabels[progress.stage]}</div>
              <div className="text-muted-foreground text-xs">
                {progress.stage === 'list' ? '收藏状态、评分、短评与标签' : '正在准备下一个条目'}
              </div>
            </div>
          </>
        )}
      </div>
      <StageProgress progress={progress} />
      <p className="text-muted-foreground text-xs">可以关闭面板，同步会在后台继续。</p>
    </section>
  )
}

function StageProgress({ progress }: { progress: SyncProgress }) {
  const { completed, total } = progress
  const percent = total ? Math.min(100, (completed / total) * 100) : 0
  return (
    <div
      className="bg-muted h-1.5 overflow-hidden rounded-full"
      role="progressbar"
      aria-label={stageLabels[progress.stage]}
      aria-valuemin={0}
      aria-valuemax={total || 1}
      aria-valuenow={total === null ? undefined : Math.min(completed, total)}
      aria-valuetext={total === null ? '正在获取数量' : `已处理 ${completed} / ${total}`}
    >
      <div
        className="bg-foreground/60 h-full rounded-full transition-[width] motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

function idleMessage(overview: SyncOverview) {
  if (overview.authRequired)
    return { title: '需要重新登录', detail: '请重新登录后继续同步。', attention: true }
  if (overview.error || overview.errors.length)
    return {
      title: '部分内容尚未同步',
      detail: '请检查下方原因后重试。',
      attention: true,
    }
  if (overview.conflicts.length)
    return {
      title: '有冲突需要你处理',
      detail: '请选择保留的版本，其他条目不受影响。',
      attention: true,
    }
  if (overview.pending)
    return {
      title: '有更改等待同步',
      detail: '可以点击下方按钮开始同步。',
      attention: false,
    }
  if (overview.progress?.finishedAt)
    return {
      title: '本轮同步已完成',
      detail: '最近处理的条目列在下方。',
      attention: false,
    }
  return {
    title: '已同步',
    detail: '暂无待同步的更改。',
    attention: false,
  }
}

function SyncIdle({ overview }: { overview: SyncOverview }) {
  const message = idleMessage(overview)
  const Icon = message.attention ? CircleAlert : CloudCheck
  return (
    <div className="flex items-start gap-3 rounded-lg border p-4" role="status">
      <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-5" />
      </div>
      <div className="space-y-1.5 py-0.5">
        <p className="text-sm font-medium">{message.title}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">{message.detail}</p>
      </div>
    </div>
  )
}

const resultLabels: Record<SyncResult['status'], string> = {
  synced: '已同步',
  pending: '有新更改待同步',
  conflict: '待处理冲突',
  error: '未完成',
}
function ResultIcon({ status }: { status: SyncResult['status'] }) {
  if (status === 'synced') return <Check className="size-3.5" />
  if (status === 'pending') return <Clock3 className="size-3.5" />
  return <CircleAlert className="size-3.5" />
}
export function SyncRecent({ items }: { items: SyncResult[] }) {
  if (!items.length) return null
  return (
    <section aria-label="最近同步结果">
      <h3 className="text-muted-foreground mb-2 text-xs">最近处理</h3>
      <ul className="divide-y">
        {items.slice(0, 3).map((item) => (
          <li key={item.subject.id} className="py-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                <ResultIcon status={item.status} />
              </span>
              <span className="min-w-0 flex-1 truncate" title={item.subject.title}>
                {item.subject.title}
              </span>
              <span className="text-muted-foreground shrink-0">{resultLabels[item.status]}</span>
            </div>
            {item.error && (
              <p className="text-destructive mt-1 pl-5 text-xs break-words">{item.error}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function SyncCoverage({ overview }: { overview: SyncOverview }) {
  return (
    <div className="text-muted-foreground space-y-1 text-xs leading-relaxed">
      <p>
        上次完整同步：
        {overview.lastSyncedAt
          ? new Date(overview.lastSyncedAt).toLocaleString('zh-CN', { hour12: false })
          : '尚未完成'}
      </p>
    </div>
  )
}
