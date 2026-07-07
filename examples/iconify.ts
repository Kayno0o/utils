import { createIconify } from '../src/tools'

const { getIconData } = createIconify({
  ti: {
    icons: {
      home: { body: '<path d="M3 12l9-9 9 9"/>' },
      user: { body: '<circle cx="12" cy="8" r="4"/>' },
    },
  },
})

console.log(getIconData('ti:home'))
console.log(getIconData('ti:user'))
