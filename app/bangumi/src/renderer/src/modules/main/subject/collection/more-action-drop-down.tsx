import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu'
import { deleteCollectionDialogAtom } from '@renderer/state/dialog/alert'
import { useSetAtom } from 'jotai'

export function MoreActionDropDown({ subjectId }: { subjectId: string }) {
  const deleteSubjectCollection = useSetAtom(deleteCollectionDialogAtom)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="收藏操作"
          className="data-popup-open:bg-accent rounded-sm transition-[transform,background-color] duration-150 active:scale-90 motion-reduce:transform-none motion-reduce:transition-none"
        >
          <span className="i-mingcute-more-2-fill text-base" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-fit duration-200 data-closed:duration-150 motion-reduce:animate-none"
          align="start"
          collisionAvoidance={{ side: 'flip', align: 'shift' }}
        >
          <DropdownMenuItem
            onClick={() => deleteSubjectCollection({ open: true, content: { subjectId } })}
          >
            删除收藏
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
