import { useEffect } from 'react'
import { useNavigate, useRouteError, useLocation } from 'react-router-dom'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { ScrollWrapper } from '@renderer/components/scroll/scroll-wrapper'
import { ERROR_CONSTANTS } from '@renderer/constants'
import { useSession } from '@renderer/data/hooks/session'
import { useCopyToClipboard } from '@renderer/hooks/use-copy-to-clipboard'
import { AlertTriangle, ArrowLeft, Check, Clipboard, Github, Home, RefreshCcw } from 'lucide-react'

export default function MainErrorElement() {
  const nav = useNavigate()
  const error = useRouteError() as Error
  const location = useLocation()
  const userInfo = useSession()
  const { copied, copyToClipboard } = useCopyToClipboard()

  useEffect(() => {
    console.error('Original error:', error)
  }, [error])

  const copyErrorToClipboard = () => {
    copyToClipboard(error.stack || error.message)
  }

  const submitIssue = () => {
    const issueTitle = encodeURIComponent(ERROR_CONSTANTS.ISSUE_TITLE)
    const issueBody = encodeURIComponent(
      `Error Stack:\n\`\`\`\n${error.stack || error.message}\n\`\`\`\n\nCurrent Page Path: ${location.pathname}\n\nLogin Status: ${userInfo ? 'Logged In' : 'Not Logged In'}`,
    )
    const issueUrl = `${ERROR_CONSTANTS.GITHUB_ISSUE_URL}?title=${issueTitle}&body=${issueBody}`
    window.open(issueUrl, '_blank')
  }

  return (
    <div className="bg-background text-foreground flex h-full min-h-full w-full items-center justify-center p-6">
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex flex-row items-center gap-3 border-b px-6 py-5">
          <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
            <AlertTriangle className="text-muted-foreground size-4" />
          </div>
          <CardTitle className="text-xl font-semibold">{ERROR_CONSTANTS.CARD_TITLE}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 p-6">
          {error.stack && (
            <div className="border-border bg-muted/30 w-full rounded-lg border p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium">{ERROR_CONSTANTS.ERROR_MESSAGE_LABEL}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyErrorToClipboard}>
                    {copied ? (
                      <span className="flex items-center gap-2">
                        <Check className="size-4" />
                        {ERROR_CONSTANTS.COPIED_TEXT}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Clipboard className="size-4" />
                        {ERROR_CONSTANTS.COPY_BUTTON_TEXT}
                      </span>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={submitIssue}>
                    <span className="flex items-center gap-2">
                      <Github className="size-4" />
                      {ERROR_CONSTANTS.SUBMIT_ISSUE_TEXT}
                    </span>
                  </Button>
                </div>
              </div>
              <ScrollWrapper className="border-border bg-background max-h-60 rounded-md border">
                <pre className="text-muted-foreground p-3 font-mono text-xs break-words whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </ScrollWrapper>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <span className="text-muted-foreground text-sm">
              {ERROR_CONSTANTS.TRY_FOLLOWING_TEXT}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-center gap-3 border-t p-6">
          <Button variant="outline" onClick={() => nav(-1)}>
            <ArrowLeft className="size-4" />
            <span>{ERROR_CONSTANTS.BACK_BUTTON_TEXT}</span>
          </Button>
          <Button variant="outline" onClick={() => nav('/')}>
            <Home className="size-4" />
            <span>{ERROR_CONSTANTS.HOME_BUTTON_TEXT}</span>
          </Button>
          <Button onClick={() => window.location.reload()}>
            <RefreshCcw className="size-4" />
            <span>{ERROR_CONSTANTS.REFRESH_BUTTON_TEXT}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
