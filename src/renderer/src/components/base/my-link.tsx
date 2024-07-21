import { forwardRef } from 'react'
import { Link, LinkProps } from 'react-router-dom'

export const MyLink = forwardRef<HTMLAnchorElement, LinkProps>(({ ...props }, ref) => {
  return <Link ref={ref} draggable={false} {...props} />
})

MyLink.displayName = 'MyLink'
