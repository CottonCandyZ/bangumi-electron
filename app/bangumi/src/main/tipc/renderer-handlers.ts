import type { AppUpdateState } from '@shared/update'

export type RendererHandlers = {
  isMaximize: (maximize: boolean) => void
  openCommandPanel: (payload?: { mode?: 'palette' | 'subject-search' }) => void
  navigateTo: (payload: { path: string }) => void
  updateState: (payload: AppUpdateState) => void
}
