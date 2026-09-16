import {
  isWebVerificationRequired,
  subscribeWebVerificationRequired,
} from '@renderer/data/fetch/config/web-access'
import { parseTopListFromHTML } from '@renderer/data/transformer/web'
import type { SectionPath, TopList } from '@renderer/data/types/web'
import { client } from '@renderer/lib/client'
import { useIsMutating, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useCallback, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { restoreQueriesAfterWebVerification } from './web-verification-cache'

const pendingVerifications = new WeakMap<QueryClient, Promise<void>>()

function verifyAndRestore(queryClient: QueryClient, sectionPath: SectionPath) {
  const pending = pendingVerifications.get(queryClient)
  if (pending) return pending
  const request = (async () => {
    const pages = await client.requestBangumiWebVerification({ sectionPath })
    const lists: Partial<Record<SectionPath, TopList[]>> = {}
    for (const section of ['anime', 'book', 'music', 'game', 'real'] as const) {
      const html = pages[section]
      if (html) lists[section] = parseTopListFromHTML(html)
    }
    await restoreQueriesAfterWebVerification(queryClient, lists)
    if (!isWebVerificationRequired()) toast.success('网页验证完成，已恢复各分类刷新')
  })().finally(() => pendingVerifications.delete(queryClient))
  pendingVerifications.set(queryClient, request)
  return request
}

export function useWebVerificationRequired() {
  return useSyncExternalStore(
    subscribeWebVerificationRequired,
    isWebVerificationRequired,
    isWebVerificationRequired,
  )
}

export function useBangumiWebVerification(sectionPath: SectionPath = 'anime') {
  const queryClient = useQueryClient()
  const pending = useIsMutating({ mutationKey: ['bangumi-web-verification'] }) > 0

  const mutation = useMutation({
    mutationKey: ['bangumi-web-verification'],
    mutationFn: () => verifyAndRestore(queryClient, sectionPath),
    onError: (error) => {
      const message = error instanceof Error ? error.message : '网页验证失败'
      if (message.includes('已取消')) return
      toast.error(message)
    },
  })
  return { ...mutation, isPending: pending || mutation.isPending }
}

export function useBangumiWebRefresh({
  onRefresh,
  sectionPath,
}: {
  onRefresh: () => Promise<unknown>
  sectionPath: SectionPath
}) {
  const verificationRequired = useWebVerificationRequired()
  const { isPending: verificationPending, mutateAsync: verify } =
    useBangumiWebVerification(sectionPath)
  const refresh = useCallback(() => {
    if (!navigator.onLine) return Promise.resolve()
    if (!verificationRequired) return onRefresh()
    return verify().catch(() => undefined)
  }, [onRefresh, verificationRequired, verify])

  return {
    refresh,
    verificationPending,
    verificationRequired,
  }
}
