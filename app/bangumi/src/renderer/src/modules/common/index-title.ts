export function getIndexDisplayTitle(index: { id: number; title: string }) {
  const title = index.title.trim()
  return title || `未命名目录 #${index.id}`
}
