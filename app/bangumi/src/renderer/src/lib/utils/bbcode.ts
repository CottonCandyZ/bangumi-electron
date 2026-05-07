import { createPreset } from '@bbob/preset'
import { render } from '@bbob/react'
// noinspection ES6UnusedImports
import {} from '@bbob/types'

export const preset = createPreset({
  mask: (node) => ({
    tag: 'span',
    attrs: { className: 'mask' },
    content: node.content,
  }),
})

export const renderBBCode = (content: string) => {
  return render(content, preset(), { onlyAllowTags: ['mask'] })
}
