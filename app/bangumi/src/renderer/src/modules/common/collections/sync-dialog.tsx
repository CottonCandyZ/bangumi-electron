import { useState } from 'react'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { client } from '@renderer/lib/client'
import { userIdAtom } from '@renderer/state/session'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { currentCollectionUser, submitCollection } from '@renderer/data/collection/client'
import { getAccessToken } from '@renderer/data/fetch/session'
import { useBangumiWebVerification } from '@renderer/data/hooks/web-verification'
import type { CollectionFields, LocalCollectionRecord, SyncOverview } from '@shared/collection-sync'
import { toast } from 'sonner'
import { Loader2, RotateCw, ShieldCheck } from 'lucide-react'
import { SyncActivity, SyncRecent, SyncStatus, lastSyncedText } from './sync-progress'
import { collectionSyncIndicator } from './sync-indicator'

export const collectionSyncDialogAtom = atom(false)
export function useCollectionSyncOverview<T = SyncOverview>(
  select?: (overview: SyncOverview) => T,
) {
  const userId = Number(useAtomValue(userIdAtom))
  return useQuery({
    queryKey: ['collection-sync', userId],
    queryFn: () => client.collectionOverview({ userId }),
    enabled: !!userId,
    networkMode: 'always',
    persister: undefined,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    select,
  })
}
export async function startCollectionSync(userId: number, full = true) {
  // Refresh OAuth if possible. A connection failure must not prevent reading the local library.
  await getAccessToken(String(userId))
  if (currentCollectionUser() !== userId) throw new Error('当前账号已改变')
  await client.collectionActivate({ userId })
  await client.collectionSync({ userId, full })
}
export function CollectionSyncDialog() {
  const userId = Number(useAtomValue(userIdAtom))
  const [open, setOpen] = useAtom(collectionSyncDialogAtom)
  const overview = useCollectionSyncOverview<SyncOverview | null>(
    open ? undefined : () => null,
  ).data
  const hasConflicts = !!overview?.conflicts.length
  const verificationRecord = overview?.errors.find(
    (record) => record.status === 'web-verification-required',
  )
  const verification = useBangumiWebVerification('anime', verificationRecord?.subjectId)
  const login = useSetAtom(loginDialogAtom)
  const removed = useQuery({
    queryKey: ['collection-removed', userId],
    queryFn: () => client.collectionRemoved({ userId }),
    enabled: !!userId && open,
    networkMode: 'always',
    persister: undefined,
  })
  const sync = useMutation({
    mutationFn: (full: boolean) => startCollectionSync(userId, full),
    networkMode: 'always',
    onError: (error) => toast.error(error.message),
  })
  const queryClient = useQueryClient()
  const clearRemoved = useMutation({
    mutationFn: () => client.collectionClearRemoved({ userId }),
    networkMode: 'always',
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collection-removed', userId] }),
    onError: (error) => toast.error(error.message),
  })
  if (!userId) return null
  const running = sync.isPending || !!overview?.running
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        aria-describedby={undefined}
        className={`flex max-h-[80vh] flex-col gap-0 overflow-hidden p-0 ${hasConflicts ? 'sm:max-w-2xl' : 'sm:max-w-sm'}`}
      >
        <DialogHeader className="space-y-1 px-5 pt-5 pr-10 pb-4">
          <DialogTitle className="text-base">收藏同步</DialogTitle>
          {overview && <SyncStatus overview={overview} />}
        </DialogHeader>
        <div className="min-h-0 space-y-5 overflow-y-auto px-5 pb-5 empty:hidden">
          {overview && (
            <SyncDetails
              overview={overview}
              retrying={running}
              onRetry={() => sync.mutate(false)}
            />
          )}
          {!!removed.data?.length && (
            <section aria-label="最近移除">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-muted-foreground text-xs">最近移除</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground h-6 px-2 text-xs"
                  disabled={clearRemoved.isPending}
                  onClick={() => clearRemoved.mutate()}
                >
                  清空
                </Button>
              </div>
              <ul>
                {removed.data.map((record) => (
                  <RestoreRow key={record.subjectId} record={record} />
                ))}
              </ul>
            </section>
          )}
        </div>
        <div className="flex items-center gap-2 border-t px-5 py-3">
          <span className="text-muted-foreground mr-auto truncate text-xs">
            {overview && lastSyncedText(overview)}
          </span>
          {(overview?.authRequired ||
            !!overview?.errors.some((r) => r.status === 'auth-required')) && (
            <Button size="sm" variant="outline" onClick={() => login({ open: true })}>
              重新登录
            </Button>
          )}
          {verificationRecord ? (
            <Button
              size="sm"
              disabled={verification.isPending}
              onClick={() => verification.mutate()}
            >
              {verification.isPending ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
              {verification.isPending ? '等待验证' : '打开网页验证'}
            </Button>
          ) : (
            <Button size="sm" disabled={!overview || running} onClick={() => sync.mutate(true)}>
              <RotateCw className={running ? 'animate-spin' : ''} />
              {running ? '同步中' : '立即同步'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
function SyncDetails({
  overview,
  retrying,
  onRetry,
}: {
  overview: SyncOverview
  retrying: boolean
  onRetry: () => void
}) {
  return (
    <>
      <SyncActivity overview={overview} />
      {overview.error && (
        <div className="bg-destructive/5 flex items-center justify-between gap-3 rounded-md px-3 py-2">
          <p className="text-destructive min-w-0 text-xs leading-relaxed break-words">
            {overview.error}
          </p>
          <Button size="sm" variant="outline" disabled={retrying} onClick={onRetry}>
            重试
          </Button>
        </div>
      )}
      {overview.conflicts.map((record) => (
        <ConflictCard
          key={`${record.subjectId}:${JSON.stringify(record.conflict)}`}
          record={record}
        />
      ))}
      {!!overview.errors.length && (
        <section aria-label="同步失败">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h3 className="text-muted-foreground text-xs">同步失败</h3>
            {!overview.error &&
              overview.errors.some((record) => record.status !== 'web-verification-required') && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  disabled={retrying}
                  onClick={onRetry}
                >
                  重试
                </Button>
              )}
          </div>
          <ul>
            {overview.errors.map((record) => (
              <li className="py-1.5 text-sm" key={record.subjectId}>
                <p className="truncate">{record.subject.name_cn || record.subject.name}</p>
                {record.error !== overview.error && (
                  <p className="text-destructive text-xs break-words">{record.error}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <SyncRecent
        items={overview.progress?.recent ?? []}
        shownErrors={[overview.error, ...overview.errors.map((record) => record.error)]}
      />
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
    <li className="flex items-center justify-between gap-3 py-1 text-sm">
      <span className="min-w-0 truncate">{record.subject.name_cn || record.subject.name}</span>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 shrink-0 px-2 text-xs"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        恢复
      </Button>
    </li>
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
    onError: (error) => toast.error(error.message),
  })
  const chooseAll = (choice: 'local' | 'remote') =>
    setChoices(Object.fromEntries(conflict.fields.map((field) => [field.path, choice])))
  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="font-medium">{record.subject.name_cn || record.subject.name}</div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => chooseAll('local')}>
          全部用本机
        </Button>
        <Button size="sm" variant="outline" onClick={() => chooseAll('remote')}>
          全部用 Bangumi
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
  const sync = useCollectionSyncOverview(selectSyncIndicator).data
  const indicator = sync?.indicator ?? collectionSyncIndicator(undefined)
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground no-drag-region hover:text-foreground relative size-7"
      title={indicator.title}
      aria-label="同步收藏"
      aria-haspopup="dialog"
      aria-busy={sync?.running}
      onClick={() => open(true)}
    >
      <RotateCw className={`size-[15px] ${sync?.running ? 'animate-spin' : ''}`} />
      {indicator.badge !== null && (
        <span className="bg-muted text-muted-foreground absolute -top-0.5 -right-0.5 min-w-3.5 rounded-full px-0.5 text-[9px]">
          {indicator.badge}
        </span>
      )}
    </Button>
  )
}

function selectSyncIndicator(overview: SyncOverview) {
  return { running: overview.running, indicator: collectionSyncIndicator(overview) }
}
