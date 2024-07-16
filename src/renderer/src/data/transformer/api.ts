/**
 * 按照 relation 的关键词排序
 * @param sortList 想要的关键词顺序
 * @returns 按照关键词排序的结果
 */
export const sortCharacterByRelation =
  <T extends { relation: string }[]>(sortList?: string[]) =>
  (items: T) => {
    const temp = new Map<string, T>()
    items.forEach((item) => {
      if (temp.has(item.relation)) {
        const arr = temp.get(item.relation)!
        arr.push(item)
      } else {
        temp.set(item.relation, [item] as T)
      }
    })
    if (!sortList) return temp
    const res = new Map<string, T>()
    sortList.forEach((name) => {
      if (temp.has(name)) {
        res.set(name, temp.get(name)!)
      }
    })
    const otherKeys = Array.from(temp.keys()).filter((name) => !sortList.includes(name))
    otherKeys.forEach((name) => {
      if (temp.has(name)) {
        res.set(name, temp.get(name)!)
      }
    })
    return res
  }
