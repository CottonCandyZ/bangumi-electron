import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select'
import { client } from '@renderer/lib/client'
import { SettingGroup, SettingRow } from '@renderer/modules/main/settings/layout'
import {
  getUpdateActionText,
  getUpdateTitle,
  useUpdateActions,
  useUpdateState,
} from '@renderer/modules/update/menu'
import { useAppConfig } from '@renderer/state/app-config'
import type { AppUpdateChannel } from '@shared/config'
import type { AppBuildInfo, AppUpdateState } from '@shared/update'
import { getUpdateSizeDescription } from '@shared/update-size'
import { getUpdateProgressDescription } from '@shared/update-progress'
import { Download, FileDown, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export function AboutSettings() {
  const { config, loaded, updateConfig } = useAppConfig()
  const { state } = useUpdateState()
  const { busy, runUpdateAction } = useUpdateActions(state)
  const [buildInfo, setBuildInfo] = useState<AppBuildInfo | null>(null)
  const [savingChannel, setSavingChannel] = useState(false)
  const [exportingLogs, setExportingLogs] = useState(false)
  const [clearingDownloads, setClearingDownloads] = useState(false)
  const updateTitle = useMemo(() => getUpdateTitle(state), [state])

  useEffect(() => {
    let active = true

    client.getBuildInfo({}).then((info) => {
      if (active) setBuildInfo(info)
    })

    return () => {
      active = false
    }
  }, [])

  const updateChannel = async (channel: AppUpdateChannel) => {
    setSavingChannel(true)
    try {
      await updateConfig({ update: { channel } })
      await client.checkForUpdates({})
    } catch (error) {
      toast.error('保存更新通道失败')
      throw error
    } finally {
      setSavingChannel(false)
    }
  }

  const exportLogs = async () => {
    setExportingLogs(true)
    try {
      const result = await client.exportLogs({})
      if (!result.canceled) toast.success('log 已导出')
    } catch (error) {
      toast.error('导出 log 失败')
      throw error
    } finally {
      setExportingLogs(false)
    }
  }

  const clearUpdateDownloads = async () => {
    setClearingDownloads(true)
    try {
      await client.clearUpdateDownloads({})
      toast.success('更新下载包已清理')
    } catch (error) {
      toast.error('清理更新下载包失败')
      throw error
    } finally {
      setClearingDownloads(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingGroup>
        <SettingRow
          title="版本"
          description={
            <span className="tabular-nums">
              {formatBuildTime(buildInfo?.buildTime)}
              {buildInfo?.hash && <span className="ml-2 font-mono">{buildInfo.hash}</span>}
            </span>
          }
          control={
            <span className="text-sm font-medium tabular-nums">{buildInfo?.version ?? '--'}</span>
          }
        />
        <SettingRow
          title="更新通道"
          description={
            config.update.channel === 'stable' ? '正式通道暂无发布包，可能检查不到更新' : undefined
          }
          control={
            <Select
              value={config.update.channel}
              disabled={!loaded || savingChannel}
              onValueChange={(value) => updateChannel(value as AppUpdateChannel)}
            >
              <SelectTrigger size="sm" className="w-28 shadow-none">
                <SelectValue>{config.update.channel === 'stable' ? '正式' : 'Beta'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beta">Beta</SelectItem>
                <SelectItem value="stable">正式</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <SettingRow
          title={
            <span className="flex items-center gap-2">
              更新
              {state?.status === 'available' && <Badge variant="secondary">新版本</Badge>}
              {state?.status === 'downloaded' && <Badge>已下载</Badge>}
            </span>
          }
          description={
            <span className="tabular-nums">
              {getUpdateDescription(state, updateTitle)}
              {getUpdateSizeDescription(state) && ` · ${getUpdateSizeDescription(state)}`}
            </span>
          }
          control={
            <div className="flex flex-wrap items-center justify-end gap-2">
              {state?.downloadDir && state.status !== 'unsupported' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-normal shadow-none"
                  title={`清理 ${state.downloadDir}`}
                  disabled={clearingDownloads || state.status === 'downloading'}
                  onClick={clearUpdateDownloads}
                >
                  <Trash2 className="size-3.5" />
                  清理下载包
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="font-normal shadow-none"
                disabled={busy || state?.status === 'unsupported'}
                onClick={runUpdateAction}
              >
                {state?.status === 'downloaded' ? (
                  <RefreshCw className="size-3.5" />
                ) : (
                  <Download className="size-3.5" />
                )}
                {getUpdateActionText(state)}
              </Button>
            </div>
          }
        />
      </SettingGroup>

      <SettingGroup title="诊断">
        <SettingRow
          title="日志"
          description="排查问题时可导出发给开发者"
          control={
            <Button
              variant="outline"
              size="sm"
              className="font-normal shadow-none"
              disabled={exportingLogs}
              onClick={exportLogs}
            >
              <FileDown className="size-3.5" />
              导出
            </Button>
          }
        />
      </SettingGroup>
    </div>
  )
}

function formatBuildTime(value?: string) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function getUpdateDescription(state: AppUpdateState | null, title: string): string {
  if (!state) return '检查当前通道是否有新版本'
  if (state.status === 'available' && state.version)
    return `${state.currentVersion} → ${state.version}`
  if (state.status === 'downloaded' && state.version) return `${state.version} 已就绪，重启后生效`
  if (state.status === 'downloading' && state.version) return getUpdateProgressDescription(state)
  if (state.status === 'error') return state.error ?? title
  if (state.status === 'unavailable') return state.unavailableReason ?? '当前通道暂无发布包'
  if (state.status === 'idle' && state.lastCheckedAt)
    return `已是最新 · 上次检查 ${formatBuildTime(state.lastCheckedAt)}`
  return title
}
