import { Outlet } from 'react-router-dom'
import Wrapper from '@renderer/components/wrapper'
function App() {
  return (
    <Wrapper>
      <Outlet />
    </Wrapper>
  )
}

export default App
