# Migrating

## 3.0.0

### Removed aliases

Each deprecated name is gone; use the one it pointed to.

| Removed | Use |
| --- | --- |
| `uniqueArray` | `unique` |
| `shuffleArray` | `shuffle` |
| `chunkArray` | `splitIntoParts` |
| `downloadFromURL` | `downloadFromUrl` |
| `storageGet`, `storageSet`, `storageRemove` | `getStorage`, `setStorage`, `removeStorage` |
| `opacityColor` | `blendRgb` |
| `hashStr` | `hashString` |
| `csvParse`, `csvStringify` | `parseCsv`, `stringifyCsv` |
| `weekStartISO` | `startOfWeekISO` |
| `map` | `mapRange` |
| `numberFromString(nb, min, max)` | `mapRange(nb, 0, 1, min, max)` |
| `unfunction` | `resolveValue` |
| `ObjectEntries`, `ObjectKeys`, `ObjectValues` | `typedObjectEntries`, `typedObjectKeys`, `typedObjectValues` |
| `firstUpper` | `capitalize` |
| `matchLength`, `matchingSubstring` | `commonPrefixLength`, `commonPrefix` |
| `strTemplate` | `renderTemplate` |
| `posFrom1D`, `get2DPosFrom1D` | `indexToCoords` |
| `LRU` | `createTtlCache(ttlMs, { maxEntries, lru: true })` |
| `spawnText(cmd, args)`, `spawnBytes(cmd, args)`, `spawnExit(cmd, args)` | `spawnText([cmd, ...args])`, and the same for the others |

### Changed defaults

- `buildUrlQuery` and `declareGetEndpoint` URL-encode keys and values; pass `{ encode: false }` for the old output.
- `formatSessionTime` counts calendar days, so 23:00 yesterday reads "Yesterday" at 01:00, and a future date reads as a short date.
- `declareLogger` sends errors to `console.error` and warnings to `console.warn`, and an `Error` logs its stack.
- `Rules.isNumber` fails with "Must be a number".
- `Color.to('oklab')` and `Color.to('oklch')` round once from the unrounded value, so a last digit may move (red's oklch hue reads 29.23, not 29.22).
- `mapConcurrent` stops handing out items after the first failure.
- `JWTBuilder.validate` reads `expired` only from the library's own expiry error, never from the token's unverified `exp`.
- `parseCsv` drops a leading byte order mark, and `trim` keeps the whitespace inside a quoted field.
- `parseArgs`: a boolean flag only takes the next token when it is `true`, `false`, `1` or `0`, and `-5` reads as a value.
- `decryptCaesar` and `decryptVigenere` shift lowercase letters too, keeping their case.
- `cronMatches` and the run helpers AND the day fields when one starts with `*` (`*/2`), as Vixie cron does.
- `randomString(length, charset, true)` throws a `RangeError` past 256 characters instead of looping.
