import { useState, useCallback } from 'react'
import { TIMING_CONSTANTS } from '@renderer/constants'

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), TIMING_CONSTANTS.COPY_FEEDBACK_DURATION)
  }, [])

  return { copied, copyToClipboard }
}
