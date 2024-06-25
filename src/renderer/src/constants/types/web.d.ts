/** 主要分区 */
export type sectionPath = 'anime' | 'book' | 'music' | 'game' | 'real'

/** Top 关注列表，分区右下角 */
export type TopList = {
  SubjectId: SubjectId | null | undefined
  follow: string | null | undefined
}
