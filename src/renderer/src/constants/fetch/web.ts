import { webFetch } from '@renderer/constants/config'
import type { sectionPath } from '@renderer/constants/types/web'

/**
 * 通用各分区首页 Fetch
 * @param sectionPath 各分区路径
 * @returns HTML
 */
export async function fetchSectionHome({ sectionPath }: { sectionPath: sectionPath }) {
  return await webFetch<string>(`/${sectionPath}`, {
    parseResponse: (text) => text,
  })
}
