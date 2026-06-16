import { HOST } from '@renderer/data/fetch/config'
import type { IndexRelated, IndexRelatedCategory } from '@renderer/data/types/index'

export const INDEX_RELATED_CATEGORY_LABELS: Record<IndexRelatedCategory, string> = {
  0: '条目',
  1: '角色',
  2: '人物',
  3: '章节',
  4: '日志',
  5: '小组话题',
  6: '条目讨论',
}

export type IndexRelatedMeta = {
  href?: string
  image?: string
  imageContain: boolean
  kind: string
  subtitle?: string
  title: string
  to?: string
}

export function getIndexRelatedMeta(item: IndexRelated): IndexRelatedMeta {
  if (item.subject) {
    return {
      image: item.subject.images?.common || item.subject.images?.grid,
      imageContain: false,
      kind: INDEX_RELATED_CATEGORY_LABELS[0],
      subtitle: item.subject.nameCN ? item.subject.name : undefined,
      title: item.subject.nameCN || item.subject.name,
      to: `/subject/${item.subject.id}`,
    }
  }

  if (item.character) {
    return {
      image: item.character.images?.grid || item.character.images?.medium,
      imageContain: true,
      kind: INDEX_RELATED_CATEGORY_LABELS[1],
      subtitle: item.character.nameCN ? item.character.name : item.character.info,
      title: item.character.nameCN || item.character.name,
      to: `/character/${item.character.id}`,
    }
  }

  if (item.person) {
    return {
      image: item.person.images?.grid || item.person.images?.medium,
      imageContain: true,
      kind: INDEX_RELATED_CATEGORY_LABELS[2],
      subtitle: item.person.nameCN ? item.person.name : item.person.info,
      title: item.person.nameCN || item.person.name,
      to: `/person/${item.person.id}`,
    }
  }

  if (item.episode) {
    const title = item.episode.name_cn || item.episode.nameCN || item.episode.name

    return {
      image: item.episode.subject?.images?.grid,
      imageContain: false,
      kind: INDEX_RELATED_CATEGORY_LABELS[3],
      subtitle: item.episode.subject?.nameCN || item.episode.subject?.name,
      title,
      to: `/episode/${item.episode.id}`,
    }
  }

  if (item.blog) {
    return {
      href: `${HOST}/blog/${item.blog.id}`,
      image: item.blog.icon ? `${HOST}${item.blog.icon}` : undefined,
      imageContain: false,
      kind: INDEX_RELATED_CATEGORY_LABELS[4],
      subtitle: item.blog.user?.nickname,
      title: item.blog.title,
    }
  }

  if (item.groupTopic) {
    return {
      image: item.groupTopic.creator?.avatar.medium,
      imageContain: false,
      kind: INDEX_RELATED_CATEGORY_LABELS[5],
      subtitle: item.groupTopic.group.title || item.groupTopic.group.name,
      title: item.groupTopic.title,
      to: `/group/topic/${item.groupTopic.id}`,
    }
  }

  if (item.subjectTopic) {
    return {
      image: item.subjectTopic.subject.images?.grid,
      imageContain: false,
      kind: INDEX_RELATED_CATEGORY_LABELS[6],
      subtitle: item.subjectTopic.subject.nameCN || item.subjectTopic.subject.name,
      title: item.subjectTopic.title,
      to: `/subject/topic/${item.subjectTopic.id}`,
    }
  }

  return {
    image: undefined,
    imageContain: false,
    kind: '内容',
    subtitle: undefined,
    title: `#${item.rid}`,
  }
}
