import { useEffect } from 'react'
import { useNavigate, useRouteError, useLocation } from 'react-router-dom'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { ScrollWrapper } from '@renderer/components/scroll/scroll-wrapper'
import { ERROR_CONSTANTS } from '@renderer/constants'
import { useSession } from '@renderer/modules/wrapper/session-wrapper'
import { useCopyToClipboard } from '@renderer/hooks/use-copy-to-clipboard'

export default function MainErrorElement() {
  const nav = useNavigate()
  const error = useRouteError() as Error
  const location = useLocation()
  const { userInfo } = useSession()
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
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <Card className="max-w-3xl overflow-hidden shadow-lg">
        <CardHeader className="bg-red-100/50 py-6">
          <CardTitle className="text-center text-3xl font-bold text-red-600">
            {ERROR_CONSTANTS.CARD_TITLE}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 p-6">
          {error.stack && (
            <div className="w-full rounded-lg border border-red-200 p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xl font-medium text-red-600">
                  {ERROR_CONSTANTS.ERROR_MESSAGE_LABEL}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyErrorToClipboard}
                    className="transition-all duration-200 ease-in-out hover:bg-red-50/50"
                  >
                    {copied ? (
                      <span className="flex items-center">
                        <span className="i-mingcute-check-fill mr-1 mt-0.5 text-green-500" />
                        {ERROR_CONSTANTS.COPIED_TEXT}
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <span className="i-mingcute-copy-2-line mr-1 mt-0.5" />
                        {ERROR_CONSTANTS.COPY_BUTTON_TEXT}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={submitIssue}
                    className="transition-all duration-200 ease-in-out hover:bg-red-50/50"
                  >
                    <span className="flex items-center">
                      <span className="i-mingcute-github-line mr-1 mt-0.5" />
                      {ERROR_CONSTANTS.SUBMIT_ISSUE_TEXT}
                    </span>
                  </Button>
                </div>
              </div>
              <ScrollWrapper className="max-h-60">
                <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-700">
                  {error.stack}
                </pre>
              </ScrollWrapper>
            </div>
          )}

          <div className="mt-6 flex flex-col items-center gap-4">
            <span className="text-xl font-semibold text-red-600">
              {ERROR_CONSTANTS.TRY_FOLLOWING_TEXT}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4 bg-red-50/50 p-6">
          <Button variant="outline" onClick={() => nav(-1)} className="hover:bg-red-100/50">
            <span className="i-mingcute-arrow-left-line mr-2 mt-0.5" />
            {ERROR_CONSTANTS.BACK_BUTTON_TEXT}
          </Button>
          <Button variant="outline" onClick={() => nav('/')} className="hover:bg-red-100/50">
            <span className="i-mingcute-home-5-line mr-2 mt-0.5" />
            {ERROR_CONSTANTS.HOME_BUTTON_TEXT}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="hover:bg-red-100/50"
          >
            <span className="i-mingcute-refresh-1-line mr-2 mt-0.5" />
            {ERROR_CONSTANTS.REFRESH_BUTTON_TEXT}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
