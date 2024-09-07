import { ScrollWrapper }  from '@renderer/components/scroll/scroll-wrapper'
import { Subject } from '@renderer/data/types/subject'

export function Summary({ summary }: Pick<Subject, 'summary'>) {
  return (
    <ScrollWrapper className="max-h-60 pr-2">
      <p className="whitespace-pre-wrap">{summary}</p>
    </ScrollWrapper>
  )
}
