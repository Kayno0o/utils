import type { IntRange } from '../../../types/types'

export type DateTranslations = Record<`m-${IntRange<1, 12>}` | `ms-${IntRange<1, 12>}` | `w-${IntRange<1, 7>}` | `ws-${IntRange<1, 7>}`, string>
