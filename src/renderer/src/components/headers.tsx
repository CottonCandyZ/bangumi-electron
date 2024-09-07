import { isEmpty } from '@renderer/lib/utils/string'

export function MediumHeader({ name, name_cn }: { name: string; name_cn: string }) {
  if (isEmpty(name_cn)) return <h3 className="font-jp font-semibold">{name}</h3>
  return (
    <header>
      <h3 className="font-semibold">{name_cn}</h3>
      <h4 className="font font-jp text-sm font-semibold text-muted-foreground">{name}</h4>
    </header>
  )
}

export function CollectionHeader({ name, name_cn }: { name: string; name_cn: string }) {
  if (isEmpty(name_cn)) return <h3 className="font-jp text-sm font-medium">{name}</h3>
  return (
    <header>
      <h3 className="text-sm font-medium">{name_cn}</h3>
      <h4 className="font font-jp text-xs text-muted-foreground">{name}</h4>
    </header>
  )
}
