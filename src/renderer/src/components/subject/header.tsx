import { Subject } from '@renderer/constants/types/subject'
import { isEmpty } from '@renderer/lib/utils/string'

export default function Header({ name, name_cn }: Pick<Subject, 'name' | 'name_cn'>) {
  return isEmpty(name_cn) ? (
    <header>
      <h1 className="text-2xl font-semibold">{name}</h1>
    </header>
  ) : (
    <header>
      <h1 className="text-2xl font-semibold">{name_cn}</h1>
      <h2 className="font-jp text-muted-foreground">{name}</h2>
    </header>
  )
}
