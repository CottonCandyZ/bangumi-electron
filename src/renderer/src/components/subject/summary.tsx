import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import { Subject } from '@renderer/data/types/subject'

export default function Summary({ summary }: Pick<Subject, 'summary'>) {
  return (
    <ScrollWrapper className="max-h-60 pr-2">
      <p className="whitespace-pre-wrap">{summary}</p>
    </ScrollWrapper>
  )
}
