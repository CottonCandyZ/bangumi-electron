import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import { Button } from '@renderer/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/components/ui/hover-card'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@renderer/components/ui/table'
import { useWebInfoBoxQuery } from '@renderer/data/hooks/web/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { cn } from '@renderer/lib/utils'
import { useState } from 'react'

export default function PersonsGrid({ subjectId }: { subjectId: SubjectId }) {
  const personsQuery = useWebInfoBoxQuery({ id: subjectId, enabled: !!subjectId })
  const persons = personsQuery.data
  const [sateFold, setStateFold] = useState(true)

  if (!persons) return null
  const needFold = persons.size > 8
  const fold = needFold && sateFold
  return (
    <div className={cn('relative flex flex-row justify-between gap-2')}>
      <ScrollWrapper className={cn('w-full pr-4', fold && 'max-h-96')}>
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] text-center">Name</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from(persons).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell className="text-center font-medium">{key.slice(0, -2)}</TableCell>
                <TableCell>
                  {value.map((item, index) => {
                    if (typeof item === 'string') return <span key={index}>{item}</span>
                    return (
                      <HoverCard key={index} openDelay={300}>
                        <HoverCardTrigger asChild>
                          <button className="underline decoration-primary/40 underline-offset-2 hover:decoration-primary">
                            {item.name}
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent side="top">Hello</HoverCardContent>
                      </HoverCard>
                    )
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollWrapper>
      <div>
        <Button
          className="h-full whitespace-normal"
          onClick={() => setStateFold((fold) => !fold)}
          variant={'outline'}
        >
          {fold ? '展开' : '收起'}
        </Button>
      </div>
    </div>
  )
}
