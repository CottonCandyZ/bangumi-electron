import { ScrollWrapper } from '@renderer/components/scroll/scroll-wrapper'
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
  return (
    <div className="flex h-full min-h-0">
      {characterDetailData.summary !== '' ? (
        <ScrollWrapper
          className="bbcode max-h-56 whitespace-pre-line py-0.5"
          options={{ overflow: { x: 'hidden' } }}
        >
          {renderSummery}
        </ScrollWrapper>
      ) : (
        <p>暂时还没有说明哦～</p>
      )}
    </div>
  )
}