// The package ships no types of its own
declare module '@joplin/turndown-plugin-gfm' {
  import type TurndownService from 'turndown'

  export const gfm: TurndownService.Plugin
}
