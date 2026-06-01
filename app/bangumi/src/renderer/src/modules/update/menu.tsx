import { Button } from '@renderer/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { handlers, client } from '@renderer/lib/client'
import { cn } from '@renderer/lib/utils'
import type { AppUpdateState } from '@shared/update'
import { Download, RefreshCw, RotateCw, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export function shouldShowUpdate(state: AppUpdateState | null) {
  if (!state || state.ignored) return false
  return (
    state.status === 'available' || state.status === 'downloading' || state.status === 'downloaded'
  )
}

export function getPercent(state: AppUpdateState) {
  if (typeof state.percent !== 'number') return 0
  return Math.max(0, Math.min(100, Math.round(state.percent)))
}

export function getUpdateTitle(state: AppUpdateState | null) {
  if (!state) return '检查更新'
  if (state.status === 'checking') return '正在检查更新'
  if (state.status === 'downloading') return `下载中 ${getPercent(state)}%`
  if (state.status === 'downloaded') return '更新已下载'
  if (state.status === 'available') return '发现新版本'
  if (state.status === 'error') return '更新检查失败'
  if (state.status === 'unavailable') return '当前通道暂无发布包'
  if (state.status === 'unsupported') return '当前环境不支持自动更新'
  return '已是最新版本'
}

export function getUpdateActionText(state: AppUpdateState | null) {
  if (
    !state ||
    state.status === 'idle' ||
    state.status === 'error' ||
    state.status === 'unavailable'
  )
    return '检查更新'
  if (state.status === 'checking') return '正在检查'
  if (state.status === 'available') return '下载更新'
  if (state.status === 'downloading') return `下载中 ${getPercent(state)}%`
  if (state.status === 'downloaded') return '重启更新'
  return '检查更新'
}

export function useUpdateState() {
  const [state, setState] = useState<AppUpdateState | null>(null)

  useEffect(() => {
    let mounted = true

    client.getUpdateState({}).then((nextState) => {
      if (!mounted) return
      setState(nextState)
    })

    const unlisten = handlers.updateState.listen((nextState) => {
      setState(nextState)
    })

    return () => {
      mounted = false
      unlisten()
    }
  }, [])

  return { state, visible: shouldShowUpdate(state) }
}

export function useUpdateActions(state: AppUpdateState | null) {
  const busy = state?.status === 'checking' || state?.status === 'downloading'

  const runUpdateAction = useCallback(async () => {
    if (state?.status === 'checking' || state?.status === 'downloading') return

    try {
      if (state?.status === 'downloaded') {
        await client.installUpdate({})
        return
      }

      if (state?.status === 'available') {
        await client.downloadUpdate({})
        return
      }

      await client.checkForUpdates({})
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败')
    }
  }, [state])

  const ignoreCurrentUpdate = useCallback(async () => {
    if (!state?.version) return
    await client.ignoreUpdate({ version: state.version })
    toast.info('已跳过此版本，可在 设置 > 关于 中检查更新')
  }, [state])

  return { busy, runUpdateAction, ignoreCurrentUpdate }
}

export function HeaderUpdateIndicator() {
  const { state, visible } = useUpdateState()
  const { busy, runUpdateAction, ignoreCurrentUpdate } = useUpdateActions(state)
  const title = useMemo(() => getUpdateTitle(state), [state])

  if (!visible || !state) return null

  const Icon =
    state.status === 'downloaded' ? RotateCw : state.status === 'downloading' ? RefreshCw : Download

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="group no-drag-region relative">
          <Button
            variant="outline"
            className={cn(
              'border-primary/30 bg-primary/8 text-primary hover:bg-primary/12 hover:text-primary h-8 gap-1.5 rounded-md px-2.5 text-xs font-medium shadow-none',
              state.status === 'downloading' && 'pointer-events-none',
            )}
            disabled={busy}
            onClick={runUpdateAction}
          >
            <Icon className={cn('size-3.5', state.status === 'downloading' && 'animate-spin')} />
            <span>{state.status === 'downloaded' ? '重启更新' : title}</span>
          </Button>
          <button
            type="button"
            aria-label="跳过这个版本"
            className="bg-background text-muted-foreground hover:text-foreground absolute -top-1.5 -right-1.5 hidden size-4 items-center justify-center rounded-full border shadow-sm group-hover:flex"
            onClick={(event) => {
              event.stopPropagation()
              void ignoreCurrentUpdate()
            }}
          >
            <X className="size-3" />
          </button>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {state.version ? `当前 ${state.currentVersion}，新版本 ${state.version}` : title}
      </TooltipContent>
    </Tooltip>
  )
}
