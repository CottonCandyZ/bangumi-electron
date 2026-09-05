import { useState } from 'react'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { client } from '@renderer/lib/client'
import { userIdAtom } from '@renderer/state/session'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import {
  currentCollectionUser,
  invalidateCollections,
  submitCollection,
} from '@renderer/data/collection/client'
import { getAccessToken } from '@renderer/data/fetch/session'
import type { CollectionFields, LocalCollectionRecord, SyncOverview } from '@shared/collection-sync'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { SyncActivity, SyncCoverage, SyncRecent, SyncSummary } from './sync-progress'
import { collectionSyncIndicator } from './sync-indicator'

export const collectionSyncDialogAtom = atom(false)
export function useCollectionSyncOverview() {
  const userId = Number(useAtomValue(userIdAtom))
  return useQuery({
    queryKey: ['collection-sync', userId],
    queryFn: () => client.collectionOverview({ userId }),
    enabled: !!userId,
    networkMode: 'always',
    persister: undefined,
    staleTime: Infinity,
  })
}
export async function startCollectionSync(userId: number) {
  // Refresh OAuth if possible. A connection failure must not prevent reading the local library.
  await getAccessToken(String(userId))
  if (currentCollectionUser() !== userId) throw new Error('当前账号已改变')
  await client.collectionActivate({ userId })
  await client.collectionSync({ userId, full: true })
  await invalidateCollections()
}
export function CollectionSyncDialog() {
  const userId = Number(useAtomValue(userIdAtom))
  const [open, setOpen] = useAtom(collectionSyncDialogAtom)
  const overview = useCollectionSyncOverview().data
  const hasConflicts = !!overview?.conflicts.length
  const login = useSetAtom(loginDialogAtom)
  const removed = useQuery({
    queryKey: ['collection-removed', userId],
    queryFn: () => client.collectionRemoved({ userId }),
    enabled: !!userId && open,
    networkMode: 'always',
    persister: undefined,
  })
  const sync = useMutation({
    mutationFn: () => startCollectionSync(userId),
    networkMode: 'always',
    onError: (error) => toast.error(error.message),
  })
  if (!userId) return null
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        aria-describedby={undefined}
        className={`flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 ${hasConflicts ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
      >
        <DialogHeader className="p-5 pr-10">
          <DialogTitle>收藏同步</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto px-5 pb-5">
          {overview ? (
            <SyncDetails overview={overview} />
          ) : (
            <p className="text-muted-foreground text-sm">正在查看同步进度…</p>
          )}
          {!!removed.data?.length && (
            <details className="rounded-lg border p-3">
              <summary className="cursor-pointer text-xs">
                最近移除 · {removed.data.length} 部可再次收藏
              </summary>
              <div className="mt-3 space-y-2">
                {removed.data.map((record) => (
                  <RestoreRow key={record.subjectId} record={record} />
                ))}
              </div>
            </details>
          )}
          {overview && <SyncCoverage overview={overview} />}
          {overview && !overview.listComplete && !overview.running && (
            <p className="text-muted-foreground text-sm">
              点击“开始首次同步”，将你的收藏和章节进度带到这台设备。
            </p>
          )}
        </div>
        <div className="bg-muted/30 flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3">
          {(overview?.authRequired ||
            !!overview?.errors.some((r) => r.status === 'auth-required')) && (
            <Button variant="outline" onClick={() => login({ open: true })}>
              重新登录
            </Button>
          )}
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {hasConflicts ? '稍后处理' : '关闭'}
          </Button>
          <Button
            variant="outline"
            disabled={!overview || sync.isPending || overview.running}
            onClick={() => sync.mutate()}
          >
            {overview?.running
              ? '正在同步…'
              : overview?.listComplete
                ? '同步全部收藏'
                : '开始首次同步'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
function SyncDetails({ overview }: { overview: SyncOverview }) {
  return (
    <>
      <SyncSummary overview={overview} />
      <SyncActivity overview={overview} />
      {overview.error && (
        <p
          className="bg-destructive/5 text-destructive rounded-lg border p-3 text-xs leading-relaxed break-words"
          role="status"
        >
          {overview.error}
        </p>
      )}
      {overview.conflicts.map((record) => (
        <ConflictCard
          key={`${record.subjectId}:${JSON.stringify(record.conflict)}`}
          record={record}
        />
      ))}
      {!!overview.errors.length && (
        <section className="space-y-2" aria-label="同步异常">
          <h3 className="text-muted-foreground text-xs">需要重试的条目</h3>
          {overview.errors.map((record) => (
            <div className="space-y-1 rounded-lg border p-3" key={record.subjectId}>
              <p className="text-sm font-medium">{record.subject.name_cn || record.subject.name}</p>
              <p className="text-destructive text-xs break-words">{record.error}</p>
            </div>
          ))}
        </section>
      )}
      <SyncRecent items={overview.progress?.recent ?? []} />
    </>
  )
}
function RestoreRow({ record }: { record: LocalCollectionRecord }) {
  const mutation = useMutation({
    mutationFn: () =>
      submitCollection({
        kind: 'edit',
        subjectId: record.subjectId,
        patch: record.retained ?? { type: 3 },
      }),
    networkMode: 'always',
    onError: (error) => toast.error(error.message),
  })
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span>{record.subject.name_cn || record.subject.name}</span>
      <Button
        size="sm"
        variant="outline"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        再次收藏
      </Button>
    </div>
  )
}
function ConflictCard({ record }: { record: LocalCollectionRecord }) {
  const conflict = record.conflict!
  const [choices, setChoices] = useState<Record<string, 'local' | 'remote'>>({})
  const mutation = useMutation({
    mutationFn: () =>
      client.collectionResolve({
        userId: record.userId,
        subjectId: record.subjectId,
        revision: record.revision,
        choices,
      }),
    networkMode: 'always',
    onSettled: () => invalidateCollections(),
    onError: (error) => toast.error(error.message),
  })
  const chooseAll = (choice: 'local' | 'remote') =>
    setChoices(Object.fromEntries(conflict.fields.map((field) => [field.path, choice])))
  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="font-medium">{record.subject.name_cn || record.subject.name}</div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => chooseAll('local')}>
          保留这台设备的修改
        </Button>
        <Button size="sm" variant="outline" onClick={() => chooseAll('remote')}>
          使用 Bangumi 上的版本
        </Button>
      </div>
      {conflict.fields.map((field) => (
        <div key={field.path} className="space-y-2 border-t pt-3 text-sm">
          <div className="font-medium">{fieldLabel(field.path)}</div>
          <div className="text-muted-foreground break-words whitespace-pre-wrap">
            上次同步：{displayValue(field.base, field.path)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['local', 'remote'] as const).map((side) => (
              <button
                type="button"
                key={side}
                aria-pressed={choices[field.path] === side}
                onClick={() => setChoices({ ...choices, [field.path]: side })}
                className={`rounded-md border p-3 text-left break-words whitespace-pre-wrap ${choices[field.path] === side ? 'border-primary bg-primary/10' : 'hover:bg-accent'}`}
              >
                <span className="mb-1 block font-medium">
                  {side === 'local' ? '这台设备' : 'Bangumi'}
                </span>
                {displayValue(field[side], field.path)}
              </button>
            ))}
          </div>
        </div>
      ))}
      {conflict.fields.some((field) => field.path === 'collection') && (
        <LifecycleEpisodes record={record} />
      )}
      <Button
        disabled={mutation.isPending || conflict.fields.some((field) => !choices[field.path])}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? '正在核对…' : '应用选择并同步'}
      </Button>
    </div>
  )
}
function fieldLabel(path: string) {
  if (path.startsWith('episodes.')) return `章节 #${path.slice(9)}`
  return (
    (
      {
        collection: '收藏被取消或重新收藏',
        type: '收藏状态',
        rate: '评分',
        comment: '短评',
        tags: '标签',
        private: '私密设置',
      } as Record<string, string>
    )[path] ?? path
  )
}
function displayValue(value: unknown, path: string): string {
  if (value === undefined) return '尚未同步'
  if (path === 'collection') {
    if (value === null) return '未收藏'
    const fields = value as CollectionFields
    return ['type', 'rate', 'private', 'tags', 'comment']
      .map(
        (key) => `${fieldLabel(key)}：${displayValue(fields[key as keyof CollectionFields], key)}`,
      )
      .join('\n')
  }
  if (path === 'private') return value ? '私密' : '公开'
  if (path === 'type')
    return ({ 1: '想看', 2: '看过', 3: '在看', 4: '搁置', 5: '抛弃' } as Record<number, string>)[
      Number(value)
    ]
  if (path.startsWith('episodes.'))
    return ({ 0: '未看', 1: '想看', 2: '看过', 3: '抛弃' } as Record<number, string>)[Number(value)]
  if (Array.isArray(value)) return value.join('、') || '无'
  return value == null || value === '' ? '空' : String(value)
}

function LifecycleEpisodes({ record }: { record: LocalCollectionRecord }) {
  const remote = record.conflict!.remote
  const ids = Object.keys({
    ...record.base.episodes,
    ...record.local.episodes,
    ...remote.episodes,
  }).filter((id) => record.local.episodes[id] !== remote.episodes[id])
  if (!ids.length) return null
  return (
    <details className="text-sm">
      <summary className="cursor-pointer">章节差异（{ids.length}）：随整条收藏一起处理</summary>
      <ul className="text-muted-foreground mt-2 space-y-1">
        {ids.map((id) => (
          <li key={id}>
            章节 #{id}：上次 {displayValue(record.base.episodes[id], `episodes.${id}`)} · 这台设备{' '}
            {displayValue(record.local.episodes[id], `episodes.${id}`)} · Bangumi{' '}
            {displayValue(remote.episodes[id], `episodes.${id}`)}
          </li>
        ))}
      </ul>
    </details>
  )
}

export function CollectionSyncButton() {
  const open = useSetAtom(collectionSyncDialogAtom)
  const sync = useCollectionSyncOverview().data
  const indicator = collectionSyncIndicator(sync)
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground no-drag-region hover:text-foreground relative size-8"
      title={indicator.title}
      aria-label="同步收藏"
      aria-haspopup="dialog"
      aria-busy={sync?.running}
      onClick={() => open(true)}
    >
      <RefreshCw className={`size-4.5 ${sync?.running ? 'animate-spin' : ''}`} />
      {indicator.badge !== null && (
        <span className="bg-muted text-muted-foreground absolute -top-1 -right-1 min-w-4 rounded-full px-1 text-[10px]">
          {indicator.badge}
        </span>
      )}
    </Button>
  )
}
