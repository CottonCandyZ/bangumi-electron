import { ScrollArea } from '@base-ui/react/scroll-area'
import { useWebInfoBoxQuery } from '@renderer/data/hooks/web/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { PersonsTable } from '@renderer/modules/main/subject/person/table'
import { LoaderCircle } from 'lucide-react'

export function SubjectPersonTable({ subjectId }: { subjectId: SubjectId }) {
  const personsQuery = useWebInfoBoxQuery({ subjectId })
  const persons = personsQuery.data
  return (
    <ScrollArea.Root className="group/scroll relative h-full w-full overflow-hidden">
      <ScrollArea.Viewport className="h-full w-full overflow-x-hidden focus-visible:outline-hidden">
        <ScrollArea.Content className="min-h-full w-full">
          {persons === undefined ? (
            <div className="flex h-full w-full items-center justify-center p-6" role="status">
              <LoaderCircle className="text-muted-foreground h-8 w-8 animate-spin" />
              <span className="sr-only">Loading</span>
            </div>
          ) : (
            persons.size !== 0 && <PersonsTable persons={persons} />
          )}
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        orientation="vertical"
        className="absolute top-0 right-0 z-20 flex h-full w-2.5 touch-none p-0.5 opacity-0 transition-opacity duration-150 select-none group-hover/scroll:opacity-100"
      >
        <ScrollArea.Thumb className="bg-foreground/10 hover:bg-foreground/30 active:bg-foreground/40 relative [height:var(--scroll-area-thumb-height)] w-full flex-1 rounded-full" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}
