import { createPreset } from '@bbob/preset'

export const preset = createPreset({
  mask: (node) => ({
    tag: 'span',
    attrs: { className: 'mask' },
    content: node.content,
  }),
})
