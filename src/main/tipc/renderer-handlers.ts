export type RendererHandlers = {
  isMaximize: (maximize: boolean) => void
  openCommandPanel: (payload?: { mode?: 'palette' | 'subject-search' }) => void
  navigateTo: (payload: { path: string }) => void
}
