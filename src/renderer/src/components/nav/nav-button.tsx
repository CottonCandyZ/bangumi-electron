import { Button } from '@renderer/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Link, useMatch } from 'react-router-dom'

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
            'flex flex-col relative size-16 hover:text-primary text-primary/65 cursor-default',
            {
              'text-primary': isActive,
            },
          )}
          asChild
        >
          <Link to={path}>
            <>
              {isActive ? (
                <motion.div
                  className="absolute left-0.5 top-6 bottom-6 w-1 bg-primary rounded-xl"
                  layoutId="underline"
                />
              ) : null}
              {isActive ? active : icon}
              {/* <span>{name}</span> */}
            </>
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{name}</TooltipContent>
    </Tooltip>
  )
}
