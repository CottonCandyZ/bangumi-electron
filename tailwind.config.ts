import { iconsPlugin, getIconCollections } from '@egoist/tailwindcss-icons'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.tsx'],
  theme: {
    extend: {},
  },
  plugins: [
    iconsPlugin({
      collections: getIconCollections(['mingcute']),
    }),
  ],
}
