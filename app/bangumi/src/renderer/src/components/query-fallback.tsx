import { Button } from '@renderer/components/ui/button'
import { useOnline } from '@renderer/hooks/use-online'
import { isNetworkUnavailableError, isNotFoundError } from '@renderer/lib/utils/network'
import { isWebVerificationRequiredError } from '@renderer/data/fetch/config/web-access'

export function QueryFallback({
  error,
  onRetry,
  label = '这部分内容',
}: {
  error?: unknown
  onRetry?: () => unknown
  label?: string
}) {
  const online = useOnline()
  const unavailable = !online || isNetworkUnavailableError(error)
  const notFound = isNotFoundError(error)
  return (
    <div
      role="status"
      data-query-fallback
      className="text-muted-foreground flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center text-sm"
    >
      <p>
        {unavailable
          ? `${label}尚未缓存`
          : notFound
            ? '内容不存在或暂时无权访问'
            : isWebVerificationRequiredError(error)
              ? '需要完成网页验证'
              : `${label}暂时无法加载`}
      </p>
      <p className="text-xs">
        {!online
          ? '当前处于离线状态，已缓存的内容仍可查看。'
          : unavailable
            ? '暂时无法连接服务器，请检查网络后重试。'
            : notFound
              ? '可以返回查看其他内容。'
              : '请稍后重试。'}
      </p>
      {onRetry && !notFound && (
        <Button
          size="sm"
          variant="outline"
          disabled={!online}
          onClick={() => {
            void onRetry()
          }}
        >
          {online ? '重试' : '等待联网'}
        </Button>
      )}
    </div>
  )
}
