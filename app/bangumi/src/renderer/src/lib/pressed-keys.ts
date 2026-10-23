import { getKeyFromKeyboardEvent, isMac } from '@renderer/lib/shortcut'
import { useSyncExternalStore } from 'react'

/**
 * 记录当前按住的键（用快捷键片段的写法：mod / ctrl / alt / shift / meta / 字母等），
 * 供键帽显示按下动画。只在有键帽订阅时才挂监听。
 */
let pressed = new Set<string>()
const listeners = new Set<() => void>()

const MODIFIER_TOKENS = new Set(['ctrl', 'meta', 'alt', 'shift', 'mod'])
const MODIFIER_KEYS = new Set(['control', 'meta', 'alt', 'shift', 'os'])

function emit(next: Set<string>) {
  pressed = next
  listeners.forEach((listener) => listener())
}

function tokensFromEvent(event: KeyboardEvent) {
  const tokens = new Set<string>()
  if (event.ctrlKey) tokens.add('ctrl')
  if (event.metaKey) tokens.add('meta')
  if (event.altKey) tokens.add('alt')
  if (event.shiftKey) tokens.add('shift')
  if (isMac ? event.metaKey : event.ctrlKey) tokens.add('mod')
  return tokens
}

function addHeldKeys(next: Set<string>, releasedKey?: string) {
  // macOS can omit ordinary keyup events while Command is held. Once Command is released,
  // those keys can no longer be trusted, including when its own keyup was missed.
  if (isMac && pressed.has('meta') && !next.has('meta')) return
  pressed.forEach((token) => {
    if (!MODIFIER_TOKENS.has(token) && token !== releasedKey) next.add(token)
  })
}

function onKeyDown(event: KeyboardEvent) {
  const next = tokensFromEvent(event)
  const key = getKeyFromKeyboardEvent(event)
  // 修饰键之外的键保持到松开为止
  addHeldKeys(next)
  if (key && !MODIFIER_KEYS.has(key)) next.add(key)
  emit(next)
}

function onKeyUp(event: KeyboardEvent) {
  const next = tokensFromEvent(event)
  const key = getKeyFromKeyboardEvent(event)
  addHeldKeys(next, key)
  emit(next)
}

function reset() {
  if (pressed.size > 0) emit(new Set())
}

function onVisibilityChange() {
  if (document.hidden) reset()
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    window.addEventListener('blur', reset)
    document.addEventListener('visibilitychange', onVisibilityChange)
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
      window.removeEventListener('blur', reset)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      pressed = new Set()
    }
  }
}

export function useKeyPressed(token: string) {
  return useSyncExternalStore(subscribe, () => pressed.has(token))
}
