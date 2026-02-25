- [x] dayjs-like equivalent

String / Text

- [x] truncate(str, maxLength, suffix?) — truncate with "..." (or custom suffix), respecting word boundaries
- [x] stripHtml(str) — remove HTML tags from a string (regex-based, no DOM needed)
- [x] template(str, vars) — lightweight string interpolation: template("Hello {name}", { name: "World" })
- [ ] mask(str, options?) — mask sensitive data: "john@email.com" → "j***@e***.com", credit cards → "**** **** **** 1234"
- [ ] levenshtein(a, b) — edit distance between two strings, useful for fuzzy matching / "did you mean?"

Object

- [ ] pick(obj, keys) / omit(obj, keys) — select or exclude properties with full type inference
- [ ] deepClone(obj) — structuredClone wrapper with fallback, typed
- [ ] deepEqual(a, b) — deep structural comparison
- [ ] flatten(obj) / unflatten(obj) — { a: { b: 1 } } ↔ { "a.b": 1 }, useful with your i18n dot notation system
- [ ] diff(a, b) — return only the changed keys between two objects

Array

- [ ] groupBy(arr, keyFn) — group items into a Record (native Object.groupBy exists but has poor TS inference and no browser support)
- [ ] partition(arr, predicate) — split into [matches, rest]
- [ ] intersection / difference / union — set operations on arrays
- [ ] zip(a, b) — zip([1,2], ["a","b"]) → [[1,"a"], [2,"b"]]
- [ ] sortBy(arr, keyFn, direction?) — sort by a derived key, stable
- [ ] slidingWindow(arr, size) — overlapping chunks: [1,2,3,4] with size 2 → [[1,2],[2,3],[3,4]]

Function utilities

- [ ] throttle(fn, ms) — you have debounce but not throttle
- [ ] once(fn) — execute only once, return cached result after
- [ ] pipe(...fns) / compose(...fns) — typed function composition
- [ ] memoize(fn, options?) — standalone function memoize (you have the decorator, not a plain function version)
- [ ] noop — no-op function, useful as default callback

Async / Promise

- [ ] retry(fn, { attempts, delay, backoff? }) — retry with exponential backoff
- [ ] timeout(promise, ms) — reject if a promise doesn't resolve in time
- [ ] pMap(items, fn, { concurrency }) — Promise.all with concurrency limit
- [ ] deferred<T>() — creates a promise with externally accessible .resolve() / .reject()
- [ ] mutex() / semaphore(n) — async concurrency primitives

Type guards

- [ ] isString, isNumber, isObject, isArray, isDate, isFunction, isPromise — type-narrowing predicates, composable with your array .filter()

Validation (standalone, not Rules-class)

- [ ] isUUID(str) — validate UUID format
- [ ] isIP(str, version?) — validate IPv4/IPv6
- [ ] luhn(str) — Luhn checksum (credit cards, SIRET — would pair well with your formatSiret)

Data structures

- [ ] LRUCache<K, V>(capacity) — least-recently-used cache with get/set/has/delete
- [ ] BiMap<K, V> — bidirectional map, lookup by key or value

Encoding

- [ ] base64Encode(str) / base64Decode(str) — universal (works in browser and Node, unlike raw btoa/atob with unicode)
- [ ] base64url — URL-safe base64 variant (useful with your JWT builder)
- [ ] hexEncode(bytes) / hexDecode(str) — you already do this inline in crypto.ts, could extract it

Environment

- [ ] isBrowser() / isNode() / isWorker() / isBun() — runtime detection, relevant since your lib has both browser and Node code

Result pattern

- [ ] Result<T, E> type + ok(value) / err(error) helpers — type-safe error handling without try/catch, increasingly popular pattern (used by Effect, neverthrow, etc.)

Reactive

- [ ] signal(initialValue) / computed(fn) — minimal reactive primitives (framework-agnostic, like Preact signals but zero-dep)
