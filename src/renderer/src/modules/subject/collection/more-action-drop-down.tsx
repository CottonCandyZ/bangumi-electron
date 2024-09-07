import { AlertDialogTrigger } from '@radix-ui/react-alert-dialog'
import { AlertDialog } from '@renderer/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu'
import { DeleteSubjectCollectionAlert } from '@renderer/modules/subject/collection/delete-action'

export function MoreActionDropDown({ subjectId }: { subjectId: string }) {
  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <span className="i-mingcute-more-2-fill text-base" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-fit" align="start">
          <AlertDialogTrigger>
            <DropdownMenuItem>删除收藏</DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteSubjectCollectionAlert subjectId={subjectId} />
    </AlertDialog>
  )
}
