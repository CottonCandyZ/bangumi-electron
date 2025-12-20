import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/components/ui/hover-card'
import { Table, TableBody, TableCell, TableRow } from '@renderer/components/ui/table'
import { UI_CONFIG } from '@renderer/config'
import { InfoBoxWeb } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { Detail } from '@renderer/modules/main/subject/person/table/detail'

export function PersonsTable({ persons }: { persons: InfoBoxWeb }) {
  return (
    <Table className="w-full">
      <TableBody>
        {Array.from(persons).map(([key, value]) => (
          <TableRow key={key}>
            <TableCell className="min-w-20 text-center font-medium">{key.slice(0, -2)}</TableCell>
            <TableCell className="break-all">
              {value.map((item, index) => {
                if (typeof item === 'string') {
                  if (UI_CONFIG.INFO_BOX_INLINE_BLOCK.includes(key.slice(0, -2)))
                    return (
                      <span
                        className={cn('inline-block', index !== value.length - 1 && 'pb-2')}
                        key={index}
                      >
                        {item}
                      </span>
                    )
                  return <span key={index}>{item}</span>
                }

                return (
                  <HoverCard key={index} openDelay={300} closeDelay={200}>
                    <HoverCardTrigger className="decoration-primary/40 hover:decoration-primary inline-block cursor-pointer underline underline-offset-2">
                      {item.name}
                    </HoverCardTrigger>
                    <HoverCardContent side="top" className="w-full max-w-72 min-w-64">
                      <Detail personId={item.id} />
                    </HoverCardContent>
                  </HoverCard>
                )
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
