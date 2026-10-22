import { copyText } from '@renderer/components/context-menu/link-entries'
import { Subject } from '@renderer/data/types/subject'
import { isEmpty } from '@renderer/lib/utils/string'

export function Header({ name, name_cn }: Pick<Subject, 'name' | 'name_cn'>) {
  return (
    <header>
      {isEmpty(name_cn) ? (
        <h1 className="text-3xl font-medium">
          <CopyableTitle text={name} />
        </h1>
      ) : (
        <>
          <h1 className="text-3xl font-medium">
            <CopyableTitle text={name_cn} />
          </h1>
          <h2 className="font-jp text-muted-foreground text-center @3xl:text-start">
            <CopyableTitle text={name} />
          </h2>
        </>
      )}
    </header>
  )
}

/** 标题点一下就复制，比拖选整段更顺手 */
function CopyableTitle({ text }: { text: string }) {
  return (
    <button
      type="button"
      className="focus-visible:ring-ring cursor-copy rounded-sm [text-align:inherit] text-inherit outline-none hover:opacity-75 focus-visible:ring-2 active:opacity-60"
      onClick={() => copyText(text, '已复制标题')}
    >
      {text}
    </button>
  )
}
