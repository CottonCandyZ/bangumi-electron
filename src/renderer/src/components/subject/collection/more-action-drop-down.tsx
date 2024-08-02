import { AlertDialogTrigger } from '@radix-ui/react-alert-dialog'
import DeleteSubjectCollectionAlert from '@renderer/components/subject/collection/delete-action'
import { AlertDialog } from '@renderer/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu'
import { ModifyCollectionOptType } from '@renderer/data/types/modify'

export default function MoreActionDropDown({
  subjectId,
  accessToken,
  username,
}: { subjectId: string } & ModifyCollectionOptType) {
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
      <DeleteSubjectCollectionAlert
        subjectId={subjectId}
        accessToken={accessToken}
        username={username}
      />
    </AlertDialog>
  )
}
