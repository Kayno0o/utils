# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Build**: `bun run build` - Builds the library using tsup to generate CJS and ESM outputs
- **Lint**: `bun run lint` - Runs ESLint with @kaynooo/eslint config
- **Lint Fix**: `bun run lint:fix` - Automatically fixes linting issues
- **Test**: `bun run test` - Runs tests with Bun and generates coverage report with genhtml
- **Documentation**: `bun run doc` - Generates TypeDoc documentation with GitHub theme
- **Benchmark**: `bun run benchmark` - Runs performance benchmarks

## Architecture

This is a TypeScript utility library (`@kaynooo/utils`) that provides a collection of helper functions and builders organized into several categories:

### Core Structure
- **Entry Point**: `index.ts` - Re-exports all utilities from src/ and types/
- **Source**: `src/` - Main utility functions organized by category
- **Types**: `types/` - Type definitions and interfaces
- **Examples**: `examples/` - Usage examples for each utility
- **Tests**: `tests/` - Test files using Bun test runner

### Module Categories
- **Array utilities** (`src/array.ts`)
- **Builder patterns** (`src/builder/`) - Factory functions for creating configured instances:
  - `endpoint.ts` - API endpoint builders
  - `i18n.ts` - Internationalization system with type-safe keys and variable interpolation
  - `isGranted.ts` - Permission checking builders
  - `logger.ts` - Logger configuration builders
- **Tools** (`src/tools/`) - Specialized utility classes:
  - `ColorConverter.ts` - Color format conversion utilities
  - `Faker.ts` - Data generation utilities
  - `colors.ts` - Color manipulation functions
- **Decorators** (`src/decorators/`) - Function decorators like memoization
- **Domain-specific utilities** - Colors, crypto, date, image, text, etc.

### Key Features
- **Type Safety**: Heavy use of TypeScript generics and type inference
- **Builder Pattern**: Many utilities use builder patterns for configuration
- **Path Aliases**: Uses `~` prefix for internal imports (configured in tsconfig.json)
- **Dual Output**: Builds to both CJS and ESM formats
- **i18n System**: Type-safe internationalization with dot notation keys and variable interpolation

### Development Notes
- Uses Bun as the runtime and test runner
- ESLint configuration extends `@kaynooo/eslint`
- TypeDoc generates documentation to GitHub Pages
- Coverage reports generated with lcov/genhtml
- Path mapping allows imports like `~/tools/ColorConverter` and `~/types`
