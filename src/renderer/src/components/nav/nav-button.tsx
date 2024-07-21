import { MyLink } from '@renderer/components/base/my-link'
import { Button } from '@renderer/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
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
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className={clsx(
            'relative flex size-16 cursor-default flex-col text-primary/65 hover:text-primary',
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
                  className="absolute bottom-6 left-0.5 top-6 w-1 rounded-xl bg-primary"
                  layoutId="underline"
                />
              ) : null}
              {isActive ? active : icon}
              {/* <span>{name}</span> */}
            </>
          </MyLink>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{name}</TooltipContent>
    </Tooltip>
  )
}
