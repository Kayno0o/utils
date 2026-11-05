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

### Renamed and reshaped

No alias is kept: the type checker flags each call site.

| Before | After |
| --- | --- |
| `randomInt`, `randomFloat`, `randomBool`, `getRandomElement`, `shuffle`, `sample`, `randomString`, `randomHex` with a trailing `true` | the same with `cryptoRandom`, or any `() => number` source such as `sfc32(...)` |
| `randomInt(max, true)`, `randomFloat(max, true)` | `randomInt(max, cryptoRandom)`, `randomFloat(max, cryptoRandom)` |
| Faker `lorem.paragraph(length, isCrypto, dictionary)`, `lorem.sentence`, `lorem.word`, `datatype.uuidV4(isCrypto)` | `(length, dictionary)`, `uuidV4()`, with `createFaker({ random: cryptoRandom })` for crypto output |
| `fetchWithTimeout(url, { timeoutMs })`, `combineSignals(signal, timeoutMs)`, `spawnText`/`spawnExit` option `timeoutMs` | `timeout` |
| `createTtlCache(ttlMs, options)` | `createTtlCache({ ttl, maxEntries, lru })` |
| `promptOllama`, `promptOllamaSafe`, `promptOllamaJson` given a string `(url, 'text', request, options)` | `(url, { ...request, messages: [{ role: 'user', content: 'text' }] }, options)` |
| `streamOllamaJson({ url, ...options })` | `streamOllamaJson(url, options)` |
| `msDurationToString(ms, units, { labels, maxUnits })` | `formatDuration(ms, { units, labels, maxUnits })` |
| `stringToMsDuration` | `parseDuration` |
| `formatEuro(amount, locale, options)` | `formatEuro(amount, { locale, ...options })` |
| `isBetween(date, from, to, false)` | `isBetween(date, from, to, { inclusive: false })` |
| `isWeekend(date, [5, 6])` | `isWeekend(date, { weekendDays: [5, 6] })` |
| `isIP(value, 6)` | `isIP(value, { version: 6 })` |
| `formatFileSize(bytes, true, 2)` | `formatFileSize(bytes, { units: 'si', dp: 2 })` |

`formatDayMonth`, `formatMonthYear`, `formatMonthShort`, `formatTime`, `formatRelativeTime` and `formatSessionTime` take `locale | { locale, ...Intl options }` as their second parameter, so a bare locale keeps working; `formatTime` also takes a Date, and `formatFileSize` and `formatUnit` gain `locale`.

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
- `randomString` reads `charset` by code point, so an emoji counts as one character.
- `formatDuration` keeps the sign (`-1h`, not `1h`) and takes `y`, `M` and `w` in `units`; `parseDuration` reads a leading `-`.
- `fromISODate` returns `null` for anything but a real `YYYY-MM-DD` day (`2024-02-30`, `2024-3-1`, `2024-03`) instead of an overflowed Date, and `localDayRange` throws a `RangeError` on such a date.
- `sendDiscordWebhook` and `sendGotify` time out after 15 s unless given a `timeout`, and `sendDiscordWebhook` takes `retry`.
- `streamOllama` and `readOllamaJsonStream` throw a `SyntaxError` naming the line on a line that is not JSON; `readOllamaJsonStream` used to skip it.
- `buildDate` parses `YYYY-MM-DD` and `DD/MM/YYYY` as local dates, not UTC midnight, and rolls an impossible date over (`2024-02-30` reads as March 1st).
- `decodePath` throws a `SyntaxError` on a truncated or invalid polyline instead of looping.
- `parseArgs` only reads a flag whose name starts with a letter or `_`.
- `getObjectValue` returns an own falsy value (`0`, `''`, `false`) as is instead of walking its dotted path, and returns `null` as is.
- `createIconify().renderSvg` escapes attribute values and throws a `TypeError` on an invalid attribute name.
- `parseCsv` with `headers: []` keys rows by column index.
- `mix` in `oklch` treats a color as grey below a chroma of 5e-5 instead of 1e-4, the threshold `Color.to('oklch')` uses for its hue.
