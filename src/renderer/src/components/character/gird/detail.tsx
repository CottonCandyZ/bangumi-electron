import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQueryCharacterDetailByID } from '@renderer/constants/hooks/api/character'
import { CharacterId } from '@renderer/constants/types/bgm'

export default function Detail({ characterId }: { characterId: CharacterId }) {
  const characterDetail = useQueryCharacterDetailByID({ id: characterId })
  const characterDetailData = characterDetail.data

  if (!characterDetailData) return <Skeleton className="h-full" />
  return (
    <ScrollWrapper options={{ overflow: { x: 'hidden' } }}>
      {characterDetailData.summary}
    </ScrollWrapper>
  )
}
