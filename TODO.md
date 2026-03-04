- [x] dayjs-like equivalent

String / Text

- [x] truncate(str, maxLength, suffix?) — truncate with "..." (or custom suffix), respecting word boundaries
- [x] stripHtml(str) — remove HTML tags from a string (regex-based, no DOM needed)
- [x] template(str, vars) — lightweight string interpolation: template("Hello {name}", { name: "World" })
- [ ] mask(str, options?) — mask sensitive data: "john@email.com" → "j***@e***.com", credit cards → "**** **** **** 1234"
  ```ts
  mask('john@email.com') // → "j***@e***.com"
  mask('4242424242421234', { type: 'card' }) // → "**** **** **** 1234"
  mask('0612345678', { type: 'phone' }) // → "06 ** ** ** 78"
  ```
- [ ] levenshtein(a, b) — edit distance between two strings, useful for fuzzy matching / "did you mean?"
  ```ts
  levenshtein('kitten', 'sitting') // → 3
  levenshtein('hello', 'hello') // → 0
  ```

Object

- [ ] pick(obj, keys) / omit(obj, keys) — select or exclude properties with full type inference
  ```ts
  pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) // → { a: 1, c: 3 }
  omit({ a: 1, b: 2, c: 3 }, ['b']) // → { a: 1, c: 3 }
  ```
- [ ] deepClone(obj) — structuredClone wrapper with fallback, typed
  ```ts
  const clone = deepClone({ a: { b: [1, 2] } }) // → { a: { b: [1, 2] } } (new reference)
  ```
- [ ] deepEqual(a, b) — deep structural comparison
  ```ts
  deepEqual({ a: [1, 2] }, { a: [1, 2] }) // → true
  deepEqual({ a: 1 }, { a: 2 }) // → false
  ```
- [ ] flatten(obj) / unflatten(obj) — { a: { b: 1 } } ↔ { "a.b": 1 }, useful with your i18n dot notation system
  ```ts
  flatten({ a: { b: 1, c: { d: 2 } } }) // → { "a.b": 1, "a.c.d": 2 }
  unflatten({ 'a.b': 1, 'a.c.d': 2 }) // → { a: { b: 1, c: { d: 2 } } }
  ```
- [ ] diff(a, b) — return only the changed keys between two objects
  ```ts
  diff({ a: 1, b: 2, c: 3 }, { a: 1, b: 5, c: 3 }) // → { b: 5 }
  diff({ a: 1 }, { a: 1, b: 2 }) // → { b: 2 }
  ```

Array

- [x] groupBy(arr, keyFn) — group items into a Record (native Object.groupBy exists but has poor TS inference and no browser support)
  ```ts
  groupBy([{ age: 20, name: 'A' }, { age: 30, name: 'B' }, { age: 20, name: 'C' }], x => x.age)
  // → { 20: [{ age: 20, name: 'A' }, { age: 20, name: 'C' }], 30: [{ age: 30, name: 'B' }] }
  ```
- [x] partition(arr, predicate) — split into [matches, rest]
  ```ts
  partition([1, 2, 3, 4, 5], n => n % 2 === 0) // → [[2, 4], [1, 3, 5]]
  ```
- [ ] intersection / difference / union — set operations on arrays
  ```ts
  intersection([1, 2, 3], [2, 3, 4]) // → [2, 3]
  difference([1, 2, 3], [2, 3, 4]) // → [1]
  union([1, 2, 3], [2, 3, 4]) // → [1, 2, 3, 4]
  ```
- [ ] zip(a, b) — zip([1,2], ["a","b"]) → [[1,"a"], [2,"b"]]
  ```ts
  zip([1, 2, 3], ['a', 'b', 'c']) // → [[1, 'a'], [2, 'b'], [3, 'c']]
  ```
- [ ] sortBy(arr, keyFn, direction?) — sort by a derived key, stable
  ```ts
  sortBy([{ name: 'Charlie' }, { name: 'Alice' }], x => x.name) // → [{ name: 'Alice' }, { name: 'Charlie' }]
  sortBy([3, 1, 2], x => x, 'desc') // → [3, 2, 1]
  ```
- [ ] slidingWindow(arr, size) — overlapping chunks: [1,2,3,4] with size 2 → [[1,2],[2,3],[3,4]]
  ```ts
  slidingWindow([1, 2, 3, 4, 5], 3) // → [[1, 2, 3], [2, 3, 4], [3, 4, 5]]
  ```

Function utilities

- [ ] throttle(fn, ms) — you have debounce but not throttle
  ```ts
  const throttled = throttle(() => console.log('scroll'), 200)

  window.addEventListener('scroll', throttled) // fires at most once per 200ms
  ```
- [ ] once(fn) — execute only once, return cached result after
  ```ts
  const init = once(() => {
    console.log('called')

    return 42
  })

  init() // logs "called", returns 42
  init() // returns 42 (no log)
  ```
- [ ] pipe(...fns) / compose(...fns) — typed function composition
  ```ts
  const transform = pipe((x: number) => x * 2, x => x + 1, x => `${x}`)

  transform(5) // → "11"
  ```
- [ ] memoize(fn, options?) — standalone function memoize (you have the decorator, not a plain function version)
  ```ts
  const expensive = memoize((n: number) => { /* heavy computation */ return n * 2 }, { ttl: 5000 })

  expensive(5) // → 10 (computed)
  expensive(5) // → 10 (cached)
  ```
- [ ] noop — no-op function, useful as default callback
  ```ts
  const onComplete = options.callback ?? noop
  ```

Async / Promise

- [x] retry(fn, { attempts, delay, backoff? }) — retry with exponential backoff
  ```ts
  const data = await retry(() => fetch('/api/data'), { attempts: 3, delay: 1000, backoff: 2 })
  // retries up to 3 times: 1s, 2s, 4s delays
  ```
- [x] timeout(promise, ms) — reject if a promise doesn't resolve in time
  ```ts
  await timeout(fetch('/api/slow'), 5000) // → throws TimeoutError if >5s
  ```
- [ ] pMap(items, fn, { concurrency }) — Promise.all with concurrency limit
  ```ts
  await pMap(urls, url => fetch(url), { concurrency: 5 }) // → Response[] (max 5 concurrent)
  ```
- [ ] deferred<T>() — creates a promise with externally accessible .resolve() / .reject()
  ```ts
  const d = deferred<string>()

  setTimeout(() => d.resolve('done'), 1000)
  await d.promise // → 'done'
  ```
- [ ] mutex() / semaphore(n) — async concurrency primitives
  ```ts
  const lock = mutex()

  await lock.acquire()
  // critical section
  lock.release()
  ```

Type guards

- [ ] isString, isNumber, isObject, isArray, isDate, isFunction, isPromise — type-narrowing predicates, composable with your array .filter()
  ```ts
  const values: (string | number)[] = ['a', 1, 'b', 2]

  values.filter(isString) // → ['a', 'b'] (typed as string[])
  isObject({ a: 1 }) // → true
  isDate(new Date()) // → true
  ```

Validation (standalone, not Rules-class)

- [ ] isUUID(str) — validate UUID format
  ```ts
  isUUID('550e8400-e29b-41d4-a716-446655440000') // → true
  isUUID('not-a-uuid') // → false
  ```
- [ ] isIP(str, version?) — validate IPv4/IPv6
  ```ts
  isIP('192.168.1.1') // → true
  isIP('::1', 6) // → true
  isIP('999.999.999.999') // → false
  ```
- [ ] luhn(str) — Luhn checksum (credit cards, SIRET — would pair well with your formatSiret)
  ```ts
  luhn('4242424242424242') // → true
  luhn('1234567890123456') // → false
  ```

Data structures

- [ ] LRUCache<K, V>(capacity) — least-recently-used cache with get/set/has/delete
  ```ts
  const cache = new LRUCache<string, number>(3)

  cache.set('a', 1); cache.set('b', 2); cache.set('c', 3)
  cache.set('d', 4) // evicts 'a'
  cache.get('a') // → undefined
  cache.get('b') // → 2
  ```
- [ ] BiMap<K, V> — bidirectional map, lookup by key or value
  ```ts
  const bi = new BiMap<string, number>([['a', 1], ['b', 2]])

  bi.get('a') // → 1
  bi.getByValue(2) // → 'b'
  ```

Encoding

- [ ] base64Encode(str) / base64Decode(str) — universal (works in browser and Node, unlike raw btoa/atob with unicode)
  ```ts
  base64Encode('Hello 🌍') // → "SGVsbG8g8J+MjQ=="
  base64Decode('SGVsbG8g8J+MjQ==') // → "Hello 🌍"
  ```
- [ ] base64url — URL-safe base64 variant (useful with your JWT builder)
  ```ts
  base64url.encode('data?with+special/chars') // → "ZGF0YT93aXRoK3NwZWNpYWwvY2hhcnM"
  ```
- [ ] hexEncode(bytes) / hexDecode(str) — you already do this inline in crypto.ts, could extract it
  ```ts
  hexEncode(new Uint8Array([255, 0, 171])) // → "ff00ab"
  hexDecode('ff00ab') // → Uint8Array([255, 0, 171])
  ```

Environment

- [ ] isBrowser() / isNode() / isWorker() / isBun() — runtime detection, relevant since your lib has both browser and Node code
  ```ts
  if (isBrowser()) { /* DOM available */ }

  if (isBun()) { /* Bun-specific APIs available */ }
  ```

Result pattern

- [ ] Result<T, E> type + ok(value) / err(error) helpers — type-safe error handling without try/catch, increasingly popular pattern (used by Effect, neverthrow, etc.)
  ```ts
  function divide(a: number, b: number): Result<number, string> {
    if (b === 0)
      return err('Division by zero')

    return ok(a / b)
  }

  const result = divide(10, 2)

  if (result.ok)
    console.log(result.value) // → 5

  result.map(v => v * 2) // → ok(10)
  result.unwrapOr(0) // → 5
  ```

Reactive

- [ ] signal(initialValue) / computed(fn) — minimal reactive primitives (framework-agnostic, like Preact signals but zero-dep)
  ```ts
  const count = signal(0)
  const double = computed(() => count.value * 2)

  count.value = 5
  double.value // → 10
  ```

Event system

- [ ] EventEmitter<EventMap>() — typed pub/sub event emitter with on/off/once/emit, useful across frontend, CLI, and API layers
  ```ts
  interface Events { login: { userId: string }, logout: void }
  const emitter = new EventEmitter<Events>()

  emitter.on('login', ({ userId }) => console.log(userId))
  emitter.emit('login', { userId: '123' })
  emitter.once('logout', () => cleanup())
  ```
- [ ] EventBus (singleton variant) — global typed event bus for decoupled communication between modules
  ```ts
  const bus = EventBus.getInstance<Events>()

  bus.on('login', handler)
  bus.emit('login', { userId: '123' })
  ```

Math / Statistics

- [ ] sum(arr, keyFn?) / average(arr, keyFn?) / median(arr) — common aggregations, useful with ORM result sets and data processing
  ```ts
  sum([1, 2, 3]) // → 6
  sum([{ price: 10 }, { price: 20 }], x => x.price) // → 30
  average([1, 2, 3, 4]) // → 2.5
  median([1, 3, 5, 7, 9]) // → 5
  ```
- [ ] lerp(a, b, t) / inverseLerp(a, b, value) — linear interpolation and its inverse (you have `map` but not the standard lerp pair)
  ```ts
  lerp(0, 100, 0.5) // → 50
  lerp(10, 20, 0.75) // → 17.5
  inverseLerp(0, 100, 50) // → 0.5
  ```
- [ ] percentile(arr, p) — compute the p-th percentile of a numeric array
  ```ts
  percentile([10, 20, 30, 40, 50], 0.9) // → 46
  percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.5) // → 5.5
  ```

URL

- [ ] parseUrl(url) — typed URL parsing returning { protocol, host, pathname, query (as typed object), hash }, works in both browser and Node
  ```ts
  parseUrl('https://example.com/api/users?page=2&sort=name#top')
  // → { protocol: 'https', host: 'example.com', pathname: '/api/users', query: { page: '2', sort: 'name' }, hash: 'top' }
  ```
- [ ] joinUrl(...parts) — safely join URL path segments (handles leading/trailing slashes), like path.join but for URLs
  ```ts
  joinUrl('https://api.example.com/', '/v2/', '/users') // → "https://api.example.com/v2/users"
  joinUrl('/api', 'users', '123') // → "/api/users/123"
  ```

Crypto / ID

- [ ] nanoid(size?, alphabet?) — short, URL-safe unique ID generator (like nanoid but zero-dep), useful for DB keys, session tokens, file names
  ```ts
  nanoid() // → "V1StGXR8_Z5jdHi6B-myT" (21 chars, default)
  nanoid(10) // → "IRFa-VaY2b"
  nanoid(8, '0123456789') // → "48293720"
  ```
- [ ] hmac(key, message, algorithm?) — HMAC signing using Web Crypto API, useful for webhook signature verification in APIs
  ```ts
  await hmac('secret-key', 'payload-to-sign') // → "a1b2c3d4e5..." (hex string)
  await hmac('secret', 'data', 'SHA-512') // → "f6e7d8c9..."
  ```

Serialization

- [ ] serialize(value) / deserialize(str) — JSON superset that handles Date, Map, Set, BigInt, RegExp, undefined — useful for API payloads and SSR hydration
  ```ts
  serialize({ date: new Date('2024-01-01'), set: new Set([1, 2]), big: 123n })
  // → '{"date":{"$type":"Date","value":"2024-01-01T00:00:00.000Z"},"set":{"$type":"Set","value":[1,2]},"big":{"$type":"BigInt","value":"123"}}'
  deserialize(str) // → { date: Date, set: Set<number>, big: 123n }
  ```
- [ ] safeJsonParse<T>(str, fallback?) — JSON.parse wrapped with error handling and optional fallback, returns T | fallback
  ```ts
  safeJsonParse<User>('{"name":"Alice"}') // → { name: "Alice" }
  safeJsonParse<User>('invalid json', null) // → null (no throw)
  safeJsonParse('not json') // → undefined
  ```

Schema / Validation (builder)

- [ ] declareSchema<T>(definition) — lightweight typed schema builder for runtime validation: `schema({ name: s.string().min(3), age: s.number().min(0) })`, returns `{ parse, safeParse, partial }`. Useful with ORM models, API input validation, and form validation
  ```ts
  const UserSchema = declareSchema({
    name: s.string().min(3).max(50),
    email: s.string().email(),
    age: s.number().min(0).optional(),
  })

  UserSchema.parse({ name: 'Alice', email: 'a@b.com' }) // → { name: 'Alice', email: 'a@b.com' }
  UserSchema.safeParse({ name: 'Al' }) // → { ok: false, errors: [{ path: 'name', message: 'min length is 3' }] }
  type User = InferSchema<typeof UserSchema> // → { name: string; email: string; age?: number }
  ```

Tree / Graph

- [ ] buildTree<T>(items, { id, parentId }) — converts a flat array (e.g. DB rows) into a nested tree structure, common ORM/API pattern
  ```ts
  const rows = [
    { id: 1, parentId: null, name: 'Root' },
    { id: 2, parentId: 1, name: 'Child A' },
    { id: 3, parentId: 1, name: 'Child B' },
    { id: 4, parentId: 2, name: 'Grandchild' },
  ]

  buildTree(rows, { id: 'id', parentId: 'parentId' })
  // → [{ id: 1, name: 'Root', children: [{ id: 2, name: 'Child A', children: [{ id: 4, ... }] }, { id: 3, ... }] }]
  ```
- [ ] flattenTree<T>(root, childrenKey) — inverse of buildTree, flatten a nested tree back to an array with depth info
  ```ts
  flattenTree(tree, 'children') // → [{ ...node, depth: 0 }, { ...child, depth: 1 }, ...]
  ```
- [ ] traverseTree(root, visitor, mode?) — BFS or DFS traversal with visitor callback
  ```ts
  traverseTree(tree, (node, depth) => console.log(' '.repeat(depth) + node.name), 'dfs')
  // Root
  //   Child A
  //     Grandchild
  //   Child B
  ```

CSV / Data

- [ ] csvParse<T>(str, options?) — parse a CSV string into typed objects (with header row mapping), useful for data import in APIs and CLIs
  ```ts
  csvParse<{ name: string, age: string }>('name,age\nAlice,30\nBob,25')
  // → [{ name: 'Alice', age: '30' }, { name: 'Bob', age: '25' }]
  csvParse('a;b\n1;2', { separator: ';' }) // → [{ a: '1', b: '2' }]
  ```
- [ ] csvStringify(rows, options?) — serialize objects/arrays to CSV string, pairs with your existing escapeCSV
  ```ts
  csvStringify([{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }])
  // → "name,age\nAlice,30\nBob,25"
  csvStringify(data, { separator: ';', headers: ['Name', 'Age'] })
  ```

CLI enhancements

- [ ] spinner(text) — terminal spinner with .start() / .stop(symbol?) / .update(text), useful for CLI tools
  ```ts
  const s = spinner('Loading data...')

  s.start()
  await fetchData()
  s.stop('✔') // replaces spinner with ✔ Loading data...
  ```
- [ ] prompt(question, options?) — interactive CLI prompt with type coercion (string/number/boolean/select), pairs with your existing parseArgs
  ```ts
  const name = await prompt('What is your name?') // → "Alice"
  const age = await prompt('Age?', { type: 'number' }) // → 30
  const confirm = await prompt('Continue?', { type: 'boolean' }) // → true
  const color = await prompt('Pick a color', { type: 'select', choices: ['red', 'blue', 'green'] }) // → "blue"
  ```

HTTP

- [ ] fetchWithRetry(url, options?) — fetch wrapper with retry, timeout, and response type inference (json/text/blob), useful across API and frontend projects
  ```ts
  const data = await fetchWithRetry<User>('/api/user/1', { retries: 3, timeout: 5000, responseType: 'json' })
  // → User (typed, retried up to 3 times, aborted if >5s)
  ```
- [ ] rateLimit(fn, { interval, limit }) — rate limiter decorator for API calls, prevents exceeding external API quotas
  ```ts
  const limitedFetch = rateLimit(fetch, { interval: 1000, limit: 10 }) // max 10 calls/sec

  await Promise.all(urls.map(url => limitedFetch(url))) // automatically queues excess calls
  ```

Format

- [ ] formatDuration(ms, options?) — human-readable duration: 90061000 → "1d 1h 1m 1s" or "1 day, 1 hour", pairs with your stringToMsDuration (inverse operation)
  ```ts
  formatDuration(90061000) // → "1d 1h 1m 1s"
  formatDuration(90061000, { long: true }) // → "1 day, 1 hour, 1 minute, 1 second"
  formatDuration(3600000) // → "1h"
  ```
- [ ] formatRelativeTime(date) — "2 minutes ago", "in 3 hours", "yesterday" — useful in frontend and CLI
  ```ts
  formatRelativeTime(new Date(Date.now() - 120000)) // → "2 minutes ago"
  formatRelativeTime(new Date(Date.now() + 3600000)) // → "in 1 hour"
  formatRelativeTime(yesterday) // → "yesterday"
  ```
- [ ] formatNumber(num, locale?) — locale-aware number formatting with Intl.NumberFormat (thousands separators, decimal handling)
  ```ts
  formatNumber(1234567.89) // → "1,234,567.89" (en)
  formatNumber(1234567.89, 'fr-FR') // → "1 234 567,89"
  ```
- [ ] formatList(items, options?) — "A, B and C" or "A, B, and C" (Oxford comma) — useful for CLI output and user-facing messages
  ```ts
  formatList(['Alice', 'Bob', 'Charlie']) // → "Alice, Bob and Charlie"
  formatList(['Alice', 'Bob', 'Charlie'], { oxford: true }) // → "Alice, Bob, and Charlie"
  formatList(['Alice']) // → "Alice"
  ```

Types (new)

- [ ] Prettify<T> — flattens intersection types for better IDE hover display: `Prettify<A & B>` shows all fields instead of `A & B`
  ```ts
  type User = Prettify<{ name: string } & { age: number }> // hover shows: { name: string; age: number }
  ```
- [ ] StrictOmit<T, K> / StrictPick<T, K> — like Omit/Pick but K is constrained to keyof T (catches typos at compile time)
  ```ts
  interface User { name: string, age: number, email: string }
  type A = StrictOmit<User, 'age'> // → { name: string; email: string }
  type B = StrictOmit<User, 'typo'> // → TS error! 'typo' is not assignable to keyof User
  ```
- [ ] DeepReadonly<T> — recursive Readonly that works on nested objects, arrays, Maps, and Sets
  ```ts
  type Config = DeepReadonly<{ db: { host: string, ports: number[] } }>
  // config.db.host = 'x' → TS error
  // config.db.ports.push(3) → TS error
  ```
- [ ] Entries<T> — typed version of Object.entries return type: `[key, value][]` where key-value pairs are correctly correlated
  ```ts
  type UserEntries = Entries<{ name: string, age: number }> // → (['name', string] | ['age', number])[]
  ```
