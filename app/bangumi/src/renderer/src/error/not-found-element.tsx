import { Button } from '@renderer/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NotFoundElement() {
  const navigate = useNavigate()

  const back = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/')
  }

  return (
    <div className="flex h-full min-h-full w-full items-center justify-center px-6 py-10">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <div className="text-muted-foreground text-sm font-medium">404</div>
        <h1 className="text-foreground text-3xl font-semibold tracking-normal">页面不存在</h1>
        <p className="text-muted-foreground text-sm leading-6">
          这个地址没有匹配到可用页面，可能是链接已经失效，或者当前版本还没有支持。
        </p>
        <Button onClick={back} type="button" variant="outline">
          <ArrowLeft className="size-4" />
          返回上一页
        </Button>
      </div>
    </div>
  )
}
