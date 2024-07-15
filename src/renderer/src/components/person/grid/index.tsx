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
import { useWebInfoBoxQuery } from '@renderer/constants/hooks/web/subject'
import { SubjectId } from '@renderer/constants/types/bgm'

export default function PersonsGrid({ subjectId }: { subjectId: SubjectId }) {
  const personsQuery = useWebInfoBoxQuery({ id: subjectId, enabled: !!subjectId })
  const persons = personsQuery.data

  if (!persons) return null
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px] text-center">Name</TableHead>
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
                      <button className="underline underline-offset-2">{item.name}</button>
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
  )
}
