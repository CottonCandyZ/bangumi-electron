import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@renderer/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select'
import { Textarea } from '@renderer/components/ui/textarea'
import type { ReportReason, ReportType } from '@renderer/data/fetch/api/report'
import { useCreateReportMutation } from '@renderer/data/hooks/api/report'
import { Flag } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const REASONS = [
  [1, '辱骂、人身攻击'],
  [2, '刷屏、无关内容'],
  [3, '政治相关'],
  [4, '违法信息'],
  [5, '泄露隐私'],
  [6, '涉嫌刷分'],
  [7, '引战'],
  [8, '广告'],
  [9, '剧透'],
  [99, '其他'],
] as const satisfies readonly (readonly [ReportReason, string])[]

export function ReportButton({ id, type }: { id: number; type: ReportType }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason>(1)
  const [comment, setComment] = useState('')
  const mutation = useCreateReportMutation()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="text-muted-foreground" size="sm" variant="ghost">
          <Flag className="size-3.5" />
          举报
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>举报内容</DialogTitle>
          <DialogDescription>请选择最符合的原因；请勿重复提交。</DialogDescription>
        </DialogHeader>
        <Select
          disabled={mutation.isPending}
          value={reason.toString()}
          onValueChange={(value) => setReason(Number(value) as ReportReason)}
        >
          <SelectTrigger aria-label="举报原因" className="w-full">
            <SelectValue placeholder="选择举报原因">
              {REASONS.find(([value]) => value === reason)?.[1]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            {REASONS.map(([value, label]) => (
              <SelectItem key={value} value={value.toString()}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          disabled={mutation.isPending}
          maxLength={2000}
          onChange={(event) => setComment(event.target.value)}
          placeholder="补充说明（可选）"
          value={comment}
        />
        <DialogFooter>
          <Button
            disabled={mutation.isPending}
            onClick={async () => {
              try {
                const result = await mutation.mutateAsync({
                  type,
                  id,
                  value: reason,
                  comment: comment.trim() || undefined,
                })
                toast.success(result.message)
                setOpen(false)
                setComment('')
              } catch (error) {
                toast.error(error instanceof Error ? error.message : '举报失败')
              }
            }}
          >
            提交举报
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
