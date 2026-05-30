import { useOutlet } from 'react-router-dom'

export function MainOutlet() {
  const outlet = useOutlet()
  return outlet
}
