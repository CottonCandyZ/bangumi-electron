import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQueryCharacterDetailByID } from '@renderer/data/hooks/api/character'
import { CharacterId } from '@renderer/data/types/bgm'
import { renderBBCode } from '@renderer/lib/utils/bbcode'

export function Detail({ characterId }: { characterId: CharacterId }) {
  const characterDetail = useQueryCharacterDetailByID({ id: characterId })
  const characterDetailData = characterDetail.data
  if (!characterDetailData) {
    return <Skeleton className="min-h-8" />
  }
  const renderSummery = renderBBCode(characterDetailData.summary)
  return characterDetailData.summary !== '' ? (
    <div
      className="bbcode max-h-56 min-h-8 overflow-x-hidden overflow-y-auto py-0.5 pr-2 whitespace-pre-line"
      onClick={(event) => event.stopPropagation()}
    >
      {renderSummery}
    </div>
  ) : (
    <p className="min-h-8">暂时还没有说明哦～</p>
  )
}
