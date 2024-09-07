import { Button } from '@renderer/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function NavButton() {
  const navigate = useNavigate()
  const { key } = useLocation()
  const [backDisable, setBackDisable] = useState(true)
  const [forwardDisable, setForwardDisable] = useState(true)

  useEffect(() => {
    setBackDisable(history.state.idx === 0)
    setForwardDisable(history.state.idx === history.length - 1)
  }, [key])
  return (
    <div className="flex items-center justify-center gap-0.5">
      <Button
        variant="ghost"
        className="no-drag-region aspect-square p-0.5 shadow-none"
        onClick={() => navigate(-1)}
        disabled={backDisable}
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="ghost"
        className="no-drag-region aspect-square p-0.5 shadow-none"
        onClick={() => navigate(1)}
        disabled={forwardDisable}
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
