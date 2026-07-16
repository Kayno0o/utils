# [@kaynooo/utils](https://www.npmjs.com/package/@kaynooo/utils)

A comprehensive TypeScript utility library with type-safe builders, decorators, and helper functions for modern web development.

[![npm version](https://badge.fury.io/js/@kaynooo%2Futils.svg)](https://www.npmjs.com/package/@kaynooo/utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎯 **Type-safe** - Full TypeScript support with strict typing
- 🏗️ **Builder patterns** - Configurable loggers, endpoints, and i18n systems
- 🎨 **Color utilities** - Advanced color conversion and manipulation
- 📝 **Text processing** - Case conversion, formatting, and validation
- ⚡ **Performance** - Memoization decorators with TTL and cache invalidation
- 🌍 **Internationalization** - Type-safe i18n with dot notation keys
- 🔧 **Validation** - Comprehensive rule-based validation system

## Installation

```bash
# bun (recommended)
bun add @kaynooo/utils
# pnpm
pnpm add @kaynooo/utils
# yarn
yarn add @kaynooo/utils
# npm
npm install @kaynooo/utils
```

## Quick Start

```typescript
import { declareI18n, declareLogger } from '@kaynooo/utils/builders'
import { Memoize } from '@kaynooo/utils/decorators'
import { ColorConverter } from '@kaynooo/utils/tools'

// Type-safe logging
const logger = declareLogger({ logLevel: 2 })
logger('success', 'Application started')

// Color conversion
const hslColor = ColorConverter.from('hex', '#f0af02').to('hsl')

// Memoization with automatic cache invalidation
class DataService {
  @Memoize({ ttl: 5000 })
  get expensiveData() {
    return fetchDataFromAPI()
  }
}
```

## Core Modules

### 🏗️ Builder Patterns

Create configured instances with fluent APIs:

- **Logger Builder** - Custom loggers with levels, colors, and formatting
- **Endpoint Builder** - Type-safe API endpoint declarations
- **i18n Builder** - Internationalization with variable interpolation
- **Permission Builder** - Role-based access control systems

### 🎨 Color & Design

- **ColorConverter** - Convert between hex, RGB, HSL, and more
- **Color utilities** - Manipulation, validation, and generation
- **Text formatting** - Case conversion (camelCase, kebab-case, etc.)

### ⚡ Performance & Caching

- **createTtlCache** - TTL store with FIFO or LRU eviction and `getOrLoad` in-flight dedup
- **memoize** - Wrap any function in that cache, keyed by its arguments
- **@Memoize decorator** - Getter/method result caching with TTL
- **Cache invalidation** - Smart cache clearing based on property changes
- **Timing utilities** - Delays, intervals, and performance measurement

### 🔧 Validation & Rules

- **Rule engine** - Composable validation rules
- **Built-in validators** - Email, URL, phone, date ranges, and more
- **Custom rules** - Easy to extend with your own validation logic

### 🌍 Internationalization

Type-safe translations with dot notation keys:

```typescript
const { t } = declareI18n({
  en: { user: { profile: 'Profile of {username}' } },
  fr: { user: { profile: 'Profil de {username}' } }
})

// Full type safety - TypeScript will error on invalid keys/variables
t('en', 'user.profile', { username: 'John' }) // ✅
t('en', 'invalid.key') // ❌ TypeScript error
```

## Examples

Check out the [`examples/`](./examples) directory for comprehensive usage examples of each utility.

## Documentation

Full API documentation is available at: https://kayno0o.github.io/utils/docs/

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build the library
bun run build

# Generate documentation
bun run doc
```

## License

MIT © [Kaynooo](https://github.com/Kayno0o)
