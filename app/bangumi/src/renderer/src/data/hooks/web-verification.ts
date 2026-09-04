import {
  isWebVerificationRequired,
  subscribeWebVerificationRequired,
} from '@renderer/data/fetch/config/web-access'
import { parseTopListFromHTML } from '@renderer/data/transformer/web'
import type { SectionPath } from '@renderer/data/types/web'
import { client } from '@renderer/lib/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { restoreQueriesAfterWebVerification } from './web-verification-cache'

export function useWebVerificationRequired() {
  return useSyncExternalStore(
    subscribeWebVerificationRequired,
    isWebVerificationRequired,
    isWebVerificationRequired,
  )
}

export function useBangumiWebVerification(sectionPath: SectionPath = 'anime') {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => client.requestBangumiWebVerification({ sectionPath }),
    onSuccess: async (html) => {
      const topList = parseTopListFromHTML(html)
      await restoreQueriesAfterWebVerification(queryClient, sectionPath, topList)
      if (!isWebVerificationRequired()) toast.success('网页验证完成，已恢复各分类刷新')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '网页验证失败'
      if (message.includes('已取消')) return
      toast.error(message)
    },
  })
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
