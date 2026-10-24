import { cn } from '@renderer/lib/utils'
import { Button } from '@renderer/components/ui/button'
import { useOnline } from '@renderer/hooks/use-online'
import { isNetworkUnavailableError, isNotFoundError } from '@renderer/lib/utils/network'
import {
  isWebVerificationRequiredError,
  WebVerificationRequiredError,
} from '@renderer/data/fetch/config/web-access'
import { useBangumiWebVerification } from '@renderer/data/hooks/web-verification'

const layoutClasses = {
  card: '',
  panel: 'min-h-0 flex-1 rounded-none border-0 text-xs',
}

export function QueryFallback({
  error,
  onRetry,
  label = '这部分内容',
  layout = 'card',
}: {
  error?: unknown
  onRetry?: () => unknown
  label?: string
  layout?: 'card' | 'panel'
}) {
  const online = useOnline()
  const requiresVerification = isWebVerificationRequiredError(error)
  const unavailable = !online || isNetworkUnavailableError(error)
  const notFound = isNotFoundError(error)
  const message = getFallbackMessage({
    online,
    unavailable,
    notFound,
    error,
    label,
  })
  return (
    <div
      role="status"
      data-query-fallback
      className={cn(
        'text-muted-foreground flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-center text-sm',
        layoutClasses[layout],
      )}
    >
      <p>{message.title}</p>
      <p className="text-xs">{message.description}</p>
      {requiresVerification ? (
        <WebVerificationRetry error={error} online={online} onRetry={onRetry} />
      ) : onRetry && !notFound ? (
        <Button
          size="sm"
          className="h-7 px-2.5"
          variant="outline"
          disabled={!online}
          onClick={() => {
            void onRetry()
          }}
        >
          {online ? '重试' : '等待联网'}
        </Button>
      ) : null}
    </div>
  )
}

function WebVerificationRetry({
  error,
  online,
  onRetry,
}: {
  error: unknown
  online: boolean
  onRetry?: () => unknown
}) {
  const verification = useBangumiWebVerification(
    'anime',
    undefined,
    error instanceof WebVerificationRequiredError ? error.url : undefined,
  )
  return (
    <Button
      size="sm"
      className="h-7 px-2.5"
      variant="outline"
      disabled={!online || verification.isPending}
      onClick={() => {
        void verification
          .mutateAsync()
          .then(() => onRetry?.())
          .catch(() => {})
      }}
    >
      {!online ? '等待联网' : verification.isPending ? '等待验证' : '打开网页验证'}
    </Button>
  )
}

function getFallbackMessage({
  online,
  unavailable,
  notFound,
  error,
  label,
}: {
  online: boolean
  unavailable: boolean
  notFound: boolean
  error: unknown
  label: string
}) {
  if (unavailable)
    return {
      title: `${label}尚未缓存`,
      description: online
        ? '暂时无法连接服务器，请检查网络后重试。'
        : '当前处于离线状态，已缓存的内容仍可查看。',
    }
  if (notFound) return { title: '内容不存在或暂时无权访问', description: '可以返回查看其他内容。' }
  if (isWebVerificationRequiredError(error))
    return { title: '需要完成网页验证', description: '完成验证后可继续加载。' }
  return {
    title: `${label}暂时无法加载`,
    description: '请稍后重试。',
  }
}
