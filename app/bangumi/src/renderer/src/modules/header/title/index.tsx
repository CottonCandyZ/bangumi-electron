import { useIndexQuery } from '@renderer/data/hooks/api/index'
import { getIndexDisplayTitle } from '@renderer/modules/common/index-title'
import { StaticHeaderTitle } from '@renderer/modules/header/title/static'
import { indexTitleInViewAtom } from '@renderer/state/in-view'
import { useAtomValue } from 'jotai'

export function IndexHeaderTitle({ indexId }: { indexId: number }) {
  const query = useIndexQuery({ indexId, enabled: Number.isFinite(indexId) })
  const index = query.data
  const isInView = useAtomValue(indexTitleInViewAtom)

  if (!index) return null

  return (
    <StaticHeaderTitle
      imageFallback={<span className="i-mingcute-list-check-3-line text-lg" />}
      name={getIndexDisplayTitle(index)}
      presenceKey={`index-${indexId}`}
      visible={!isInView}
    />
  )
}
