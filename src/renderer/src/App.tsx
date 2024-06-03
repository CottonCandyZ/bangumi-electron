import { Button } from '@renderer/components/ui/button'

function App(): JSX.Element {
  return (
    <div className="text-3xl flex justify-center items-center h-full gap-2">
      <div className="text-blue-300 flex justify-center items-center gap-2">
        Hello <span className="i-mingcute-react-line"></span>
      </div>
      <Button>Button</Button>
    </div>
  )
}

export default App
