import { Image } from '@renderer/components/image/image'
import { Subject } from '@renderer/data/types/subject'
import { isEmpty } from '@renderer/lib/utils/string'
import { AnimatePresence, motion } from 'motion/react'
import { ReactNode } from 'react'

export function StaticHeaderTitle({
  image,
  imageOverlay,
  imageFallback,
  name,
  nameCn,
  presenceKey,
  visible = true,
}: {
  image?: string
  imageOverlay?: ReactNode
  imageFallback?: ReactNode
  name: string
  nameCn?: string
  presenceKey?: string | number
  visible?: boolean
}) {
  return (
    <div className="flex h-full items-center overflow-hidden select-none">
      <AnimatePresence key={presenceKey}>
        {visible && (
          <motion.div
            className="flex min-w-0 flex-row items-center gap-3"
            animate={{ y: 0, opacity: 1 }}
            initial={{ y: '120%', opacity: 0 }}
            exit={{ y: '120%', opacity: 0 }}
          >
            {image ? (
              <Image className="group size-9 shrink-0 overflow-hidden rounded-lg" imageSrc={image}>
                {imageOverlay}
              </Image>
            ) : imageFallback ? (
              <div className="bg-muted text-muted-foreground group relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-medium">
                {imageFallback}
                {imageOverlay}
              </div>
            ) : null}
            <Header name={name} name_cn={nameCn ?? ''} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Header({ name, name_cn }: Pick<Subject, 'name' | 'name_cn'>) {
  return (
    <header className="flex flex-auto flex-col">
      {isEmpty(name_cn) ? (
        <h1 className="line-clamp-2 font-medium">{name}</h1>
      ) : (
        <>
          <h1 className="line-clamp-1 font-medium">{name_cn}</h1>
          <h2 className="font-jp text-muted-foreground line-clamp-1 text-xs">{name}</h2>
        </>
      )}
    </header>
  )
}
