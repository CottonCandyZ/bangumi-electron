import { Button } from '@renderer/components/ui/button'
import { getSubject } from '@renderer/data/fetch/api/next-subject'

export function Component() {
  return (
    <Button
      className="w-full"
      onClick={() => {
        getSubject({ limit: 1, offset: 0 }).then((res) => {
          console.log(res)
        })
      }}
    >
      AnimeHome
    </Button>
  )
}
