import { type SubjectId } from '@renderer/constants/types/bgm'

/** 主要分区 */
export type sectionPath = 'anime' | 'book' | 'music' | 'game' | 'real'

/** Top 关注列表，分区右下角 */
export type TopList = {
  SubjectId: SubjectId | undefined
  follow: string | undefined
}
