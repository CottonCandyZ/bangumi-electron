import { Character } from '@renderer/data/types/character'

/**
 * 按照 relation 的关键词排序
 * @param sortList 想要的关键词顺序
 * @returns 按照关键词排序的结果
 */
export const sortCharacterByRelation =
  (sortList: string[] = ['主角', '配角', '客串']) =>
  (characters: Character[]) => {
    const result: Character[] = []
    sortList.forEach((item) => {
      result.push(...characters.filter((character) => character.relation === item)) // 这里可以用 Map 也可以这样粗暴
    })
    result.push(...characters.filter((character) => !sortList.includes(character.relation)))
    return result
  }
