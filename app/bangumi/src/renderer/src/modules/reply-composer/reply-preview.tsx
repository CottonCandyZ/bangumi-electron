import { BBCodeImagePreviewProvider } from '@renderer/components/comment/bbcode-image'
import { markdownToBBCode } from '@renderer/lib/utils/markdown-bbcode'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import { cn } from '@renderer/lib/utils'

export function ReplyPreview({ className, value }: { className?: string; value: string }) {
  const bbcode = markdownToBBCode(value)

  if (!bbcode) {
    return (
      <div className={cn('bg-muted/20 rounded-md border p-3', className)}>
        <p className="text-muted-foreground text-sm">暂无预览。</p>
      </div>
    )
  }

  return (
    <BBCodeImagePreviewProvider>
      <div
        className={cn(
          'bbcode bg-muted/20 overflow-auto rounded-md border p-3 text-sm leading-7 whitespace-pre-line',
          className,
        )}
      >
        {renderBBCode(bbcode)}
      </div>
    </BBCodeImagePreviewProvider>
  )
}
