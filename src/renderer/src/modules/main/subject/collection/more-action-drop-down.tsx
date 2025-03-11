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
        <DropdownMenuTrigger>
          <span className="i-mingcute-more-2-fill text-base" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-fit" align="start">
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
