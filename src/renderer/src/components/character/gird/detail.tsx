import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQueryCharacterDetailByID } from '@renderer/constants/hooks/api/character'
import { CharacterId } from '@renderer/constants/types/bgm'
import { render } from '@bbob/react'
import { preset } from '@renderer/lib/utils/bbcode'
import { useMemo } from 'react'
import { motion } from 'framer-motion'

export default function Detail({ characterId }: { characterId: CharacterId }) {
  const characterDetail = useQueryCharacterDetailByID({ id: characterId })
  const characterDetailData = characterDetail.data
  const renderSummery = useMemo(
    () =>
      characterDetailData
        ? render(characterDetailData.summary, preset(), {
            onlyAllowTags: ['mask'],
          })
        : null,
    [characterDetailData?.summary],
  )
  if (!characterDetailData) return <Skeleton className="h-full" />

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full min-h-0">
      <ScrollWrapper className="bbcode whitespace-pre-line" options={{ overflow: { x: 'hidden' } }}>
        {renderSummery}
      </ScrollWrapper>
    </motion.div>
  )
}
