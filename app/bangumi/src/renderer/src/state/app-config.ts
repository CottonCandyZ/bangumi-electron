import { client } from '@renderer/lib/client'
import {
  AppConfigPatch,
  DEFAULT_APP_CONFIG,
  mergeAppConfig,
  normalizeAppConfig,
} from '@shared/config'
import { atom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect } from 'react'

export const appConfigAtom = atom(DEFAULT_APP_CONFIG)
export const appConfigLoadedAtom = atom(false)

export function useLoadAppConfig() {
  const setAppConfig = useSetAtom(appConfigAtom)
  const setLoaded = useSetAtom(appConfigLoadedAtom)

  useEffect(() => {
    let active = true

    client
      .getAppConfig({})
      .then((config) => {
        if (!active) return
        setAppConfig(normalizeAppConfig(config))
      })
      .finally(() => {
        if (active) setLoaded(true)
      })

    return () => {
      active = false
    }
  }, [setAppConfig, setLoaded])
}

export function useAppConfig() {
  const config = useAtomValue(appConfigAtom)
  const loaded = useAtomValue(appConfigLoadedAtom)
  const setAppConfig = useSetAtom(appConfigAtom)

  const updateConfig = useCallback(
    async (patch: AppConfigPatch) => {
      const nextConfig = await client.setAppConfig(patch)
      setAppConfig(mergeAppConfig(DEFAULT_APP_CONFIG, nextConfig))
      return nextConfig
    },
    [setAppConfig],
  )

  const exportConfig = useCallback(async () => {
    return await client.exportAppConfig({})
  }, [])

  const importConfig = useCallback(async () => {
    const result = await client.importAppConfig({})

    if (!result.canceled) {
      setAppConfig(mergeAppConfig(DEFAULT_APP_CONFIG, result.config))
    }

    return result
  }, [setAppConfig])

  return {
    config,
    loaded,
    updateConfig,
    exportConfig,
    importConfig,
  }
}
