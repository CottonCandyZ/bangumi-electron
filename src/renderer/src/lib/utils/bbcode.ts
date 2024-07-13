import { createPreset } from '@bbob/preset'

export const preset = createPreset({
  mask: (node) => ({
    tag: 'span',
    attrs: { class: 'mask' },
    content: node.content,
  }),
})
