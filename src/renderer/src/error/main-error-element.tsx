import { Button } from '@renderer/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function MainErrorElement() {
  const nav = useNavigate()
  return (
    <div className="mt-20 flex items-center justify-center gap-2">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xl font-semibold">Ooopppps! 发生了一个渲染错误 😓</span>

        <div className="flex flex-row items-center gap-2">
          <span className="text-lg font-semibold">请尝试返回</span>
          <Button
            variant="outline"
            onClick={() => {
              nav(-1)
            }}
          >
            上一层
          </Button>
          <Button variant="outline" onClick={() => nav('/')}>
            主页
          </Button>
        </div>
      </div>
    </div>
  )
}
