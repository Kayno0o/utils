import { gfm } from '@joplin/turndown-plugin-gfm'
import TurndownService from 'turndown'

let turndown: TurndownService | undefined

/** `html` as GitHub flavored markdown: tables, strikethrough and task lists included. */
export function htmlToMarkdown(html: string): string {
  if (!html)
    return ''

  turndown ??= new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' }).use(gfm)

  return turndown.turndown(html)
}
