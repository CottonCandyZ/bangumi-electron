import type { SubjectRecommendation } from '@renderer/data/types/subject'

export function getRecommendationSubjectTitle(item: SubjectRecommendation) {
  return item.subject.nameCN || item.subject.name
}

export function getRecommendationSubjectSubtitle(item: SubjectRecommendation) {
  return item.subject.nameCN ? item.subject.name : item.subject.info
}

export function getRecommendationSubjectImage(item: SubjectRecommendation) {
  return item.subject.images?.common || item.subject.images?.grid || item.subject.images?.medium
}

export function formatRecommendationSimilarity(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1)
}

export function formatCompactSubjectCount(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)} 万`
  return value.toLocaleString()
}
