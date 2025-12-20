import { Link, LinkProps } from 'react-router-dom'

export const MyLink = ({ ...props }: LinkProps) => {
  return <Link draggable={false} {...props} />
}
