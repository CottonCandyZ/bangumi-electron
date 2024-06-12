import { ThemeProvider } from '@renderer/components/wrapper/theme-wrapper'
import { Outlet } from 'react-router-dom'

function App(): JSX.Element {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Outlet />
      {/* <Button
        onClick={() => {
          window.open(
            'https://bgm.tv/oauth/authorize?client_id=bgm31636667df1e4f404&response_type=code&redirect_uri=bangumi://callback',
            '_blank',
          )
        }}
      >
        Hello
      </Button> */}
    </ThemeProvider>
  )
}

export default App
