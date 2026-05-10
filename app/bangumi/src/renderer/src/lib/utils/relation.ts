export function splitRelationLabels(relation?: string) {
  return (
    relation
      ?.split(/[、,/]/)
      .map((label) => label.trim())
      .filter(Boolean) ?? []
  )
}

export function mergeRelationLabels(...relations: Array<string | undefined>) {
  return [...new Set(relations.flatMap(splitRelationLabels))].join('、')
}
