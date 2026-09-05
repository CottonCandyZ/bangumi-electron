import { useSyncExternalStore } from 'react'

const getOnline = () => navigator.onLine
function subscribe(listener: () => void) {
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)
  return () => {
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}

export function useOnline() {
  return useSyncExternalStore(subscribe, getOnline, () => true)
}
