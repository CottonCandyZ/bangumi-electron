import { MyLink } from '@renderer/components/base/my-link'
import { Button } from '@renderer/components/ui/button'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useMatch } from 'react-router-dom'

export interface NavButtonProps {
  name: string
  path: string
  icon: JSX.Element
  active: JSX.Element
  children?: NavButtonProps[]
}

export default function NavButton({ name, path, icon, active }: NavButtonProps) {
  const isActive = useMatch(path)

  return (
    <Button
      variant="ghost"
      className={clsx(
        'relative flex aspect-square h-auto w-full flex-col p-2 text-primary/65 hover:text-primary',
        {
          'text-primary': isActive,
        },
      )}
      asChild
    >
      <MyLink to={path} unstable_viewTransition>
        <>
          {isActive ? (
            <motion.div
              className="absolute bottom-3 left-0.5 top-3 w-0.5 rounded-xl bg-primary"
              layoutId="underline"
            />
          ) : null}
          {isActive ? active : icon}
        </>
      </MyLink>
    </Button>
  )
}
