import { MonoDetailView } from '@renderer/components/mono/mono-detail-view'
import {
  useQueryCharacterComments,
  useQueryCharacterDetailByID,
  useQueryCharacterRelatedPersons,
  useQueryCharacterRelatedSubjects,
} from '@renderer/data/hooks/api/character'
import {
  useQueryPersonComments,
  useQueryPersonRelatedCharacters,
  useQueryPersonRelatedSubjects,
  useQueryPersonsById,
} from '@renderer/data/hooks/api/person'
import { CharacterId, PersonId } from '@renderer/data/types/bgm'
import {
  CharacterDetail,
  CharacterRelatedPerson,
  CharacterRelatedSubject,
} from '@renderer/data/types/character'
import {
  MonoComment,
  MonoDetail,
  MonoRelatedItem,
  MonoSubjectItem,
  MonoType,
} from '@renderer/data/types/mono'
import {
  Person,
  PersonComment,
  PersonRelatedCharacter,
  PersonRelatedSubject,
} from '@renderer/data/types/person'
import { SubjectType } from '@renderer/data/types/subject'
import { mergeRelationLabels } from '@renderer/lib/utils/relation'
import { useCallback, useState } from 'react'
import { useLocation, useViewTransitionState } from 'react-router-dom'

const PERSON_TYPE_MAP: Record<Person['type'], string> = {
  1: '个人',
  2: '公司',
  3: '组合',
}

const CHARACTER_TYPE_MAP: Record<number, string> = {
  1: '角色',
  2: '机体',
  3: '舰船',
  4: '组织',
}

const CAREER_MAP: Record<string, string> = {
  producer: '制作人',
  mangaka: '漫画家',
  artist: '艺术家',
  seiyu: '声优',
  writer: '作家',
  illustrator: '插画师',
  actor: '演员',
}

export function MonoContent({ monoType, monoId }: { monoType: MonoType; monoId: string }) {
  if (monoType === 'person') return <PersonMonoContent personId={monoId} />
  return <CharacterMonoContent characterId={monoId} />
}

function PersonMonoContent({ personId }: { personId: PersonId }) {
  const avatarViewTransitionName = useAvatarViewTransitionName('person', personId)
  const [enabledCommentsId, setEnabledCommentsId] = useState<PersonId | null>(null)
  const enableComments = useCallback(() => setEnabledCommentsId(personId), [personId])
  const detailQuery = useQueryPersonsById({ id: personId })
  const subjectsQuery = useQueryPersonRelatedSubjects({ id: personId, enabled: !!personId })
  const charactersQuery = useQueryPersonRelatedCharacters({ id: personId, enabled: !!personId })
  const commentsQuery = useQueryPersonComments({
    id: personId,
    enabled: !!personId && enabledCommentsId === personId,
  })
  const subjects = subjectsQuery.data
    ? mergeSubjects(subjectsQuery.data.map(toMonoSubject))
    : undefined
  const relatedCharacters = charactersQuery.data?.map(toCharacterRelatedItem)
  const mergedSubjects =
    subjects && relatedCharacters
      ? mergeSubjectsWithRelatedItems(subjects, relatedCharacters)
      : subjects

  return (
    <MonoDetailView
      detail={detailQuery.data ? toPersonMonoDetail(detailQuery.data) : undefined}
      subjects={mergedSubjects}
      relatedItems={
        subjects && relatedCharacters
          ? getUnmatchedRelatedItems(subjects, relatedCharacters)
          : undefined
      }
      relatedTitle="出场角色"
      comments={commentsQuery.data?.map(toMonoComment)}
      commentsError={commentsQuery.isError}
      onCommentsInView={enableComments}
      avatarViewTransitionName={avatarViewTransitionName}
    />
  )
}

function CharacterMonoContent({ characterId }: { characterId: CharacterId }) {
  const avatarViewTransitionName = useAvatarViewTransitionName('character', characterId)
  const [enabledCommentsId, setEnabledCommentsId] = useState<CharacterId | null>(null)
  const enableComments = useCallback(() => setEnabledCommentsId(characterId), [characterId])
  const detailQuery = useQueryCharacterDetailByID({ id: characterId })
  const subjectsQuery = useQueryCharacterRelatedSubjects({
    id: characterId,
    enabled: !!characterId,
  })
  const personsQuery = useQueryCharacterRelatedPersons({ id: characterId, enabled: !!characterId })
  const commentsQuery = useQueryCharacterComments({
    id: characterId,
    enabled: !!characterId && enabledCommentsId === characterId,
  })
  const subjects = subjectsQuery.data
    ? mergeSubjects(subjectsQuery.data.map(toMonoSubject))
    : undefined
  const relatedPersons = personsQuery.data?.map(toPersonRelatedItem)
  const mergedSubjects =
    subjects && relatedPersons ? mergeSubjectsWithRelatedItems(subjects, relatedPersons) : subjects

  return (
    <MonoDetailView
      detail={detailQuery.data ? toCharacterMonoDetail(detailQuery.data) : undefined}
      subjects={mergedSubjects}
      relatedItems={
        subjects && relatedPersons ? getUnmatchedRelatedItems(subjects, relatedPersons) : undefined
      }
      relatedTitle="关联人物"
      comments={commentsQuery.data?.map(toMonoComment)}
      commentsError={commentsQuery.isError}
      onCommentsInView={enableComments}
      avatarViewTransitionName={avatarViewTransitionName}
    />
  )
}

function useAvatarViewTransitionName(monoType: MonoType, monoId: string) {
  const { state } = useLocation() as { state?: { viewTransitionName?: string } }
  const isTransitioning = useViewTransitionState(`/${monoType}/${monoId}`)

  return isTransitioning && state?.viewTransitionName ? state.viewTransitionName : undefined
}

function toPersonMonoDetail(person: Person): MonoDetail {
  return {
    id: person.id.toString(),
    type: 'person',
    name: person.name,
    typeLabel: PERSON_TYPE_MAP[person.type],
    summary: person.summary,
    images: person.images,
    infobox: person.infobox,
    stat: person.stat,
    badges: person.career.map((career) => CAREER_MAP[career] ?? career),
  }
}

function toCharacterMonoDetail(character: CharacterDetail): MonoDetail {
  return {
    id: character.id.toString(),
    type: 'character',
    name: character.name,
    typeLabel: CHARACTER_TYPE_MAP[character.type],
    summary: character.summary,
    images: character.images,
    infobox: character.infobox,
    stat: character.stat,
    badges: [],
  }
}

function toMonoSubject(subject: PersonRelatedSubject | CharacterRelatedSubject): MonoSubjectItem {
  return {
    id: subject.id,
    name: subject.name,
    nameCn: subject.name_cn,
    image: subject.image,
    subjectType: subject.type,
    relation: subject.staff,
  }
}

function toCharacterRelatedItem(character: PersonRelatedCharacter): MonoRelatedItem {
  return {
    id: character.id,
    name: character.name,
    image: character.images?.grid || character.images?.medium,
    link: `/character/${character.id}`,
    subjectId: character.subject_id,
    subjectName: character.subject_name,
    subjectNameCn: character.subject_name_cn,
    subjectType: character.subject_type,
    relation: character.staff,
  }
}

function toPersonRelatedItem(person: CharacterRelatedPerson): MonoRelatedItem {
  return {
    id: person.id,
    name: person.name,
    image: person.images?.grid || person.images?.medium,
    link: `/person/${person.id}`,
    subjectId: person.subject_id,
    subjectName: person.subject_name,
    subjectNameCn: person.subject_name_cn,
    subjectType: person.subject_type,
    relation: person.staff,
  }
}

function mergeRelatedItems(items?: MonoRelatedItem[]) {
  if (!items) return undefined

  const itemMap = new Map<string, MonoRelatedItem>()

  for (const item of items) {
    const key = item.id.toString()
    const prev = itemMap.get(key)

    if (!prev) {
      itemMap.set(key, item)
      continue
    }

    itemMap.set(key, {
      ...prev,
      subjectName: undefined,
      subjectNameCn: undefined,
      subjectId: undefined,
      subjectType: mergeSubjectType(prev.subjectType, item.subjectType),
      relation: mergeRelationLabels(prev.relation, item.relation),
    })
  }

  return [...itemMap.values()]
}

function mergeSubjects(subjects: MonoSubjectItem[]) {
  const subjectMap = new Map<number, MonoSubjectItem>()

  for (const subject of subjects) {
    const prev = subjectMap.get(subject.id)

    if (!prev) {
      subjectMap.set(subject.id, {
        ...subject,
        relation: mergeRelationLabels(subject.relation),
      })
      continue
    }

    subjectMap.set(subject.id, {
      ...prev,
      name: prev.name || subject.name,
      nameCn: prev.nameCn || subject.nameCn,
      image: prev.image ?? subject.image,
      relation: mergeRelationLabels(prev.relation, subject.relation),
      relatedItems: mergeRelatedItems([
        ...(prev.relatedItems ?? []),
        ...(subject.relatedItems ?? []),
      ]),
    })
  }

  return [...subjectMap.values()]
}

function mergeSubjectsWithRelatedItems(
  subjects: MonoSubjectItem[],
  relatedItems: MonoRelatedItem[],
) {
  const relatedItemMap = new Map<number, MonoRelatedItem[]>()

  for (const item of relatedItems) {
    if (item.subjectId === undefined) continue
    const items = relatedItemMap.get(item.subjectId) ?? []
    items.push(item)
    relatedItemMap.set(item.subjectId, items)
  }

  return subjects.map((subject) => ({
    ...subject,
    relatedItems: mergeRelatedItems(relatedItemMap.get(subject.id)) ?? [],
  }))
}

function getUnmatchedRelatedItems(subjects: MonoSubjectItem[], relatedItems: MonoRelatedItem[]) {
  const subjectIds = new Set(subjects.map((subject) => subject.id))

  return mergeRelatedItems(
    relatedItems.filter((item) => item.subjectId === undefined || !subjectIds.has(item.subjectId)),
  )
}

function mergeSubjectType(prev?: SubjectType, next?: SubjectType) {
  return prev === next ? prev : undefined
}

function toMonoComment(comment: PersonComment): MonoComment {
  return {
    ...comment,
    replies: comment.replies,
  }
}
