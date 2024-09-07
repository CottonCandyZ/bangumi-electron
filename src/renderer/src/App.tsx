import Wrapper from '@renderer/modules/wrapper'
import { Outlet } from 'react-router-dom'

function App() {
  return (
    <Wrapper>
      <Outlet />
    </Wrapper>
  )
}

export default App
