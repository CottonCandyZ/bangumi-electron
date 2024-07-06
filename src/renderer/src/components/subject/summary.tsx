import { Subject } from '@renderer/constants/types/subject'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'

export default function Summary({ summary }: Pick<Subject, 'summary'>) {
  console.log(summary)
  return (
    <OverlayScrollbarsComponent className="max-h-60 pr-2">
      <p className="whitespace-pre-wrap">{summary}</p>
    </OverlayScrollbarsComponent>
  )
}
