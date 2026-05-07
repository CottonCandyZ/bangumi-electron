import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@renderer/components/ui/dropdown-menu'
import { handlers, client } from '@renderer/lib/client'
import type { AppUpdateState } from '@shared/update'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

function shouldShowUpdate(state: AppUpdateState | null) {
  if (!state || state.ignored) return false
  return (
    state.status === 'available' || state.status === 'downloading' || state.status === 'downloaded'
  )
}

function getPercent(state: AppUpdateState) {
  if (typeof state.percent !== 'number') return 0
  return Math.max(0, Math.min(100, Math.round(state.percent)))
}

function getTitle(state: AppUpdateState) {
  if (state.status === 'downloading') return `下载中 ${getPercent(state)}%`
  if (state.status === 'downloaded') return '更新已就绪'
  return '发现新版本'
}

function getActionText(state: AppUpdateState) {
  if (state.status === 'downloaded') return '重启并安装'
  if (state.status === 'downloading') return '正在下载'
  return '下载更新'
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

export function UpdateMenuSub({ state }: { state: AppUpdateState }) {
  const title = useMemo(() => getTitle(state), [state])
  const actionText = useMemo(() => getActionText(state), [state])
  const isDownloading = state.status === 'downloading'

  const handleUpdate = useCallback(async () => {
    if (state.status === 'downloading') return

    try {
      if (state.status === 'downloaded') {
        await client.installUpdate({})
        return
      }

      await client.downloadUpdate({})
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败')
    }
  }, [state])

  const handleIgnore = useCallback(async () => {
    if (!state.version) return
    await client.ignoreUpdate({ version: state.version })
  }, [state])

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>更新</DropdownMenuSubTrigger>
      <DropdownMenuSubContent
        className="w-56"
        collisionPadding={{
          right: 8,
          left: 8,
          bottom: 8,
          top: 8,
        }}
      >
        <DropdownMenuLabel className="space-y-1">
          <span className="block">{title}</span>
          {state.version && (
            <span className="text-muted-foreground block text-xs font-normal">
              当前 {state.currentVersion}，更新到 {state.version}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isDownloading} onClick={handleUpdate}>
          {actionText}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleIgnore}>忽略这个版本</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
