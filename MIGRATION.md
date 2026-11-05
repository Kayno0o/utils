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
| `cronMatches(date, expression)` | `cronMatches(expression, date)` |
| `cronNextRuns`, `cronPreviousRuns` | `getNextCronRuns`, `getPreviousCronRuns` |
| `shuffle(array)`, shuffling in place | `const mixed = shuffle(items)`, a shuffled copy |
| `sortBy(items, ...)`, sorting in place | `sortBy(items, ...)`, a sorted copy, `items` untouched |
| `validateSemver` | `isSemver` |
| `getUuidFromIri` | `getUUIDFromIri` |
| `toCase` | `splitWords` |
| `progressBar` | `renderProgressBar` |
| `frRankLabel` | `getFrenchOrdinalSuffix` |
| `alphabetOf` | `createAlphabet` |
| `knownZone`, `wallClock`, `localDayHour`, `localDate`, `zoneOffsetMs` | `resolveTimeZone`, `getWallClock`, `getLocalDayHour`, `formatLocalDate`, `getZoneOffsetMs` |
| `age`, `diffInDays`, `diffInHours` | `getAge`, `getDaysBetween`, `getHoursBetween` |
| `copy`, `entriesFromDataTransfer`, `pickHtml` (`@kaynooo/utils/browser`) | `copyToClipboard`, `readDataTransferEntries`, `getHtmlOrText` |
| `@kaynooo/utils/unit` | `@kaynooo/utils/geo` (`haversineDistance`, `indexToCoords`, `manhattanDistance`, `euclideanDistance`) and `@kaynooo/utils/polyline` (`encodePath`, `decodePath`); the root import is unchanged |
| `CanvasFormat` `'png' \| 'jpeg' \| 'webp'` | `'image/png' \| 'image/jpeg' \| 'image/webp'` |
| `canvasMimeType(format)` | the format itself, already a MIME type |
| `canvasExtension('jpeg')`, `downloadCanvas(canvas, name, 'png')`, `copyCanvasToClipboard(canvas, 'png')` | `canvasExtension('image/jpeg')`, `downloadCanvas(canvas, name, 'image/png')`, `copyCanvasToClipboard(canvas, 'image/png')` |
| `base64FromFile(file)` | `readFileAsDataUrl(file)` |
| `readPastedImage(event)` returning `File \| undefined` | returning `File \| null` |
| `import { downloadVCard } from '@kaynooo/utils'` | `import { downloadVCard } from '@kaynooo/utils/browser'` |
| `CookieBuilder` / `CookieManager.set(name, value)...build()` writing the cookie | `...save()`; `build()` only returns the string |
| `CookieManager.update(name, value)` | `CookieManager.set(name, value)` |
| `setStorage`, `removeStorage`, `JsonStorage.remove`, `JsonStorage.update` returning `void` | returning `boolean`, `true` on success |
| `getRandomElement(values)` typed `T` | typed `T \| undefined`, `undefined` for `[]` |
| `UnitConverter` `'kB'` to `'YB'` as powers of 1024 | `'KiB'` to `'YiB'`; `'kB'` to `'YB'` are now powers of 1000, as in `formatFileSize(..., { units: 'si' })` |
| `UnitConverter.value` holding the base-unit value | `value` holds the input, in `unit` |
| `Color.from('hex', 0xff0000)`, typed but throwing | `Color.from('hex', '#ff0000')`; `'hex'` takes a string only |

`formatDayMonth`, `formatMonthYear`, `formatMonthShort`, `formatTime`, `formatRelativeTime` and `formatSessionTime` take `locale | { locale, ...Intl options }` as their second parameter, so a bare locale keeps working; `formatTime` also takes a Date, and `formatFileSize` and `formatUnit` gain `locale`.

### Stricter types

`any` is gone from the public types (`AnyFunction` is the one function constraint left), and the package builds with `exactOptionalPropertyTypes`, so options that accept an explicit `undefined` say `?: T | undefined`. What a caller may notice:

- `getObjectValue` and `toJSONWithGetters` return `unknown` and `Record<string, unknown>`; `queryToNestedObject` returns `NestedQuery`, so a nested read needs narrowing.
- `sendDiscordWebhook<T = unknown>` resolves `Promise<T>`; pass `T` to read the reply.
- `isArray` narrows to `unknown[]`, `isPromise` to `Promise<unknown>`; the type guards and `isEmpty` take `unknown`, while `isUUID` and `isIP` keep taking a string.
- `partial` types its preset arguments, `delay` resolves `ReturnType<T>`, and a logger's `log` takes `...unknown[]`, so a handler with narrower parameters no longer type-checks.
- `DiscordWebhookPayload` types `allowed_mentions` and `poll` (`DiscordAllowedMentions`, `DiscordPoll`), each `components` entry needs a numeric `type`, and `files` is `unknown[]`.
- An optional field with no value is left out instead of set to `undefined`: `cronExpressionExplainer`'s `command`, `buildOllamaMeta`'s `thinking`, so `'command' in explanation` now tells whether one was given.

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
- `randomString` reads `charset` by code point, so an emoji counts as one character, and draws each character through its source: with `cryptoRandom` (53 bits) the bias stays below charset size / 2^53 rather than exactly zero, and the 256 character cap is gone.
- `randomInt` and `randomFloat` throw a `TypeError` when given something other than a function as their source, so an untyped `randomInt(max, true)` fails instead of quietly using `Math.random`.
- `randomHex` can return `#FFFFFF`.
- `closestMatch` ignores case by default, like `searchOne`, `searchAll` and `searchFuzzy`; pass `{ caseSensitive: true }` for the old behaviour.
- `sortBy` orders numbers before strings when keys mix both types, instead of leaving their order unspecified.
- `mean`, `median`, `percentile` and `percentiles` of no values return `NaN` instead of `0`.
- `setStorage`, `removeStorage` and every `JsonStorage` method no longer throw when storage is full, disabled, in private mode or absent (SSR): a setter or remover returns `false`, a getter its default, `JsonStorage.has` `false`. The default storage is resolved at call time, so importing under SSR is safe.
- `convertImage`, `cropImage`, `transformImage` and `loadImageDimensions` load an http(s) or protocol-relative (`//host/...`) source with `crossOrigin = 'anonymous'`, so a remote crop no longer taints the canvas but the server must send CORS headers; `convertImage` rejects with an `Error` instead of the raw event.
- `downloadFile`, `downloadFromString`, `downloadCanvas` and `downloadVCard` attach their anchor to `document.body` and revoke their object URL 40 s after the click, once the browser has read it.
- `streamOllamaJson` keeps a `fetchOptions.signal` when no `signal` is given, instead of dropping it.
- `declareI18n`'s `t` returns the key and warns when it names a group of translations, instead of returning the group object.
- `CookieManager.get` and `getAll` return the raw text of a name or value with invalid percent-encoding instead of throwing a `URIError`.
- `UnitConverter` factors for km/h, kn, oz, psi, inHg, mmHg, BTU, acre, ft2, yd2, mi2 and the US volumes (tsp to gal, in3, ft3) are exact, so results move in the 5th to 7th significant digit.
- `formatUnit` with a `locale` writes a count under 1000 in that locale too (`1,5` in `fr-FR`).
- `renderProgressBar` throws a `RangeError` for a NaN `value`, a non-finite `min` or `max`, or a `totalChars` that is not a non-negative integer; `applyLowQuality` throws one for `levels` below 2.
- `groupBy`, `keyBy` and `countBy` keep a `__proto__` key as an own key, and no longer read inherited names such as `toString` as existing keys.
- `tokenizeLines` drops the `\r` of a `\r\n` ending, so `diffLines` ignores mixed line endings.
- `diffTokens`, `diffLines` and `diffWords` throw a `RangeError` past `MAX_DIFF_CELLS` (25 million table cells) instead of allocating without bound; `diffTokens` and `diffLines` take `{ maxCells }` to raise it.
- `formatDuration` keeps the sign (`-1h`, not `1h`) and takes `y`, `M` and `w` in `units`; `parseDuration` reads a leading `-`.
- `fromISODate` returns `null` for anything but a real `YYYY-MM-DD` day (`2024-02-30`, `2024-3-1`, `2024-03`) instead of an overflowed Date, and `localDayRange` throws a `RangeError` on such a date.
- `sendDiscordWebhook` and `sendGotify` time out after 15 s unless given a `timeout`, and `sendDiscordWebhook` takes `retry`, sends `Accept: application/json` and rejects a 2xx body that is not JSON with a `FetchParseError` instead of a `SyntaxError`.
- `streamOllama` and `readOllamaJsonStream` throw a `SyntaxError` naming the line on a line that is not JSON; `readOllamaJsonStream` used to skip it.
- `buildDate` parses `YYYY-MM-DD` and `DD/MM/YYYY` as local dates, not UTC midnight, and rolls an impossible date over (`2024-02-30` reads as March 1st).
- `decodePath` throws a `SyntaxError` on a truncated or invalid polyline instead of looping.
- `parseArgs` only reads a flag whose name starts with a letter or `_`.
- `getObjectValue` returns an own falsy value (`0`, `''`, `false`) as is instead of walking its dotted path, and returns `null` as is.
- `createIconify().renderSvg` escapes attribute values and throws a `TypeError` on an invalid attribute name.
- `parseCsv` with `headers: []` keys rows by column index.
- `mix` in `oklch` treats a color as grey below a chroma of 5e-5 instead of 1e-4, the threshold `Color.to('oklch')` uses for its hue.
