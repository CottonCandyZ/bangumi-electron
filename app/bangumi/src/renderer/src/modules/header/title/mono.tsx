import { useQueryCharacterDetailByID } from '@renderer/data/hooks/api/character'
import { useQueryPersonsById } from '@renderer/data/hooks/api/person'
import { CharacterId, PersonId } from '@renderer/data/types/bgm'
import { StaticHeaderTitle } from '@renderer/modules/header/title/static'
import { monoAvatarImageInViewAtom } from '@renderer/state/in-view'
import { useAtomValue } from 'jotai'

export function PersonHeaderTitle({ personId }: { personId: PersonId }) {
  const personQuery = useQueryPersonsById({ id: personId })
  const person = personQuery.data
  const isInView = useAtomValue(monoAvatarImageInViewAtom)
  const image = person?.images?.grid || person?.images?.small || person?.images?.medium

  if (!person) return null

  return (
    <StaticHeaderTitle
      image={image}
      name={person.name}
      nameCn={getSimplifiedChineseName(person.infobox)}
      presenceKey={`person-${personId}`}
      visible={!isInView}
    />
  )
}

export function CharacterHeaderTitle({ characterId }: { characterId: CharacterId }) {
  const characterQuery = useQueryCharacterDetailByID({ id: characterId })
  const character = characterQuery.data
  const isInView = useAtomValue(monoAvatarImageInViewAtom)
  const image = character?.images?.grid || character?.images?.small || character?.images?.medium

  if (!character) return null

  return (
    <StaticHeaderTitle
      image={image}
      name={character.name}
      nameCn={getSimplifiedChineseName(character.infobox)}
      presenceKey={`character-${characterId}`}
      visible={!isInView}
    />
  )
}

function getSimplifiedChineseName(infobox: { key: string; value: unknown }[]) {
  const value = infobox.find((item) => item.key === '简体中文名')?.value
  if (typeof value !== 'string') return undefined

  const name = value.trim()
  return name === '' ? undefined : name
}
