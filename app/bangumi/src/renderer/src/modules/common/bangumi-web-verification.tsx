import { Button } from '@renderer/components/ui/button'
import { parseTopListFromHTML } from '@renderer/data/transformer/web'
import type { SectionPath } from '@renderer/data/types/web'
import { client } from '@renderer/lib/client'
import { cn } from '@renderer/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export function useBangumiWebVerification(sectionPath: SectionPath = 'anime') {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => client.requestBangumiWebVerification({ sectionPath }),
    onSuccess: (html) => {
      const topList = parseTopListFromHTML(html)
      queryClient.setQueryData(['SectionTrendsV2', sectionPath], topList)
      queryClient.setQueryData(['SectionTrendsInfiniteV2', sectionPath], {
        pages: [topList],
        pageParams: [1],
      })
      toast.success('网页验证完成，已更新 Bangumi 数据')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '网页验证失败'
      if (message.includes('已取消')) return
      toast.error(message)
    },
  })
}

export function BangumiWebVerificationButton({
  className,
  sectionPath,
}: {
  className?: string
  sectionPath: SectionPath
}) {
  const verification = useBangumiWebVerification(sectionPath)

  return (
    <Button
      className={cn('h-8 gap-1.5 px-2 text-xs', className)}
      disabled={verification.isPending}
      onClick={() => verification.mutate()}
      size="sm"
      type="button"
      variant="outline"
    >
      {verification.isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <ShieldCheck className="size-3.5" />
      )}
      {verification.isPending ? '等待验证' : '打开网页验证'}
    </Button>
  )
}
