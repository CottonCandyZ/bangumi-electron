import { Button } from '@renderer/components/ui/button'
import type { SectionPath } from '@renderer/data/types/web'
import { useBangumiWebVerification } from '@renderer/data/hooks/web-verification'
import { cn } from '@renderer/lib/utils'
import { Loader2, ShieldCheck } from 'lucide-react'

export { useBangumiWebVerification }

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
