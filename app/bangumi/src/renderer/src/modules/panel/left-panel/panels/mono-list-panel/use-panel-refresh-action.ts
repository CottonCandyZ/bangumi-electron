import { monoListPanelRefreshActionAtom } from '@renderer/state/panel'
import { useSetAtom } from 'jotai'
import { useCallback, useEffect, useRef } from 'react'

export function useMonoListPanelRefreshAction({
  disabled,
  onRefresh,
  refreshing,
  tabId,
}: {
  disabled?: boolean
  onRefresh: () => Promise<unknown> | unknown
  refreshing: boolean
  tabId: string
}) {
  const setRefreshAction = useSetAtom(monoListPanelRefreshActionAtom)
  const onRefreshRef = useRef(onRefresh)

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  const stableRefresh = useCallback(() => onRefreshRef.current(), [])

  useEffect(() => {
    setRefreshAction({ disabled, onRefresh: stableRefresh, refreshing, tabId })

    return () => {
      setRefreshAction((current) => (current?.tabId === tabId ? null : current))
    }
  }, [disabled, refreshing, setRefreshAction, stableRefresh, tabId])
}
