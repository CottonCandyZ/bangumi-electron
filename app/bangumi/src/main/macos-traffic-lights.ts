import type { BrowserWindow } from 'electron'
import { createRequire } from 'node:module'
import { isMacOS } from '@main/env'

type MacOSTrafficLightsNative = {
  setTrafficLightSpacing: (nativeWindowHandle: Buffer, gap: number) => boolean
}

const TRAFFIC_LIGHT_SPACING = 3
const APPLY_DELAYS = [0, 50, 200]

const nativeRequire = createRequire(import.meta.url)

let nativeModule: MacOSTrafficLightsNative | null | undefined
let nativeLoadWarningShown = false
let nativeApplyWarningShown = false

export function setupMacOSTrafficLightSpacing(window: BrowserWindow) {
  if (!isMacOS) return

  const apply = () => {
    applyMacOSTrafficLightSpacing(window, TRAFFIC_LIGHT_SPACING)
  }

  const scheduleApply = () => {
    for (const delay of APPLY_DELAYS) {
      setTimeout(apply, delay)
    }
  }

  window.on('ready-to-show', scheduleApply)
  window.on('show', scheduleApply)
  window.on('resize', scheduleApply)
  window.on('resized', scheduleApply)
  window.on('enter-full-screen', scheduleApply)
  window.on('leave-full-screen', scheduleApply)
}

function applyMacOSTrafficLightSpacing(window: BrowserWindow, gap: number) {
  const native = getNativeModule()
  if (!native) return

  try {
    const applied = native.setTrafficLightSpacing(window.getNativeWindowHandle(), gap)
    if (!applied && !nativeApplyWarningShown) {
      nativeApplyWarningShown = true
      console.warn('[macos-traffic-lights] failed to update traffic light spacing')
    }
  } catch (error) {
    if (!nativeApplyWarningShown) {
      nativeApplyWarningShown = true
      console.warn('[macos-traffic-lights] failed to update traffic light spacing', error)
    }
  }
}

function getNativeModule() {
  if (nativeModule !== undefined) return nativeModule

  try {
    nativeModule = nativeRequire('bangumi-macos-traffic-lights') as MacOSTrafficLightsNative
  } catch (error) {
    nativeModule = null
    if (!nativeLoadWarningShown) {
      nativeLoadWarningShown = true
      console.warn('[macos-traffic-lights] failed to load native module', error)
    }
  }

  return nativeModule
}
