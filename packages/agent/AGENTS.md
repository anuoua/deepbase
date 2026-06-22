# AGENTS.md - Development Guidelines for @deepbase/agent

## Project Structure

```
.
├── src/
│   ├── app.ts              # Express + tRPC + OpenAPI setup
│   ├── index.ts            # Standalone server entry point
│   ├── vite-plugin.ts      # Vite plugin for middleware injection
│   ├── lib/
│   │   ├── trpc.ts         # tRPC initialization & context
│   │   └── prisma.ts       # Database client
│   ├── router/
│   │   ├── index.ts        # Root router (aggregates modules)
│   │   └── {module}/       # Module folder
│   │       ├── index.ts    # Module router
│   │       ├── procedure.ts # Module procedure
│   │       └── methods/    # Handler implementations
│   └── shared/             # Shared utilities
├── package.json
├── tsconfig.json
└── .env
```

## Build & Development Commands

```bash
pnpm run build            # Compile TypeScript (no emit, type-check only)
pnpm run watch            # Watch mode for TypeScript
pnpm install              # Install dependencies
```

## Testing

No test framework configured. Use **Vitest** when adding tests:

```bash
pnpm add -D vitest
pnpm vitest run path/to/test.ts
```

## Code Style & Conventions

### TypeScript Configuration

- `strict: true` - Full strict mode
- `verbatimModuleSyntax` - Use `import type` for types
- `isolatedModules: true` - Modules transpile independently
- `noUncheckedIndexedAccess: true` - Index access returns `T | undefined`
- `exactOptionalPropertyTypes: true` - Optional props must be exact type
- `module: "nodenext"` - ES modules
- `noEmit: true` - Type-check only, no output

### Imports

- Always include `.ts` extension: `import { x } from "./file.ts"`
- Use `import type` for type-only imports
- Import order: Node builtins → External packages → Internal modules

```typescript
import { dirname } from "node:path";
import express from "express";
import { router } from "../lib/trpc.ts";
```

### Naming Conventions

- **Variables/Functions**: camelCase (`getConfig`, `appRouter`)
- **Types/Interfaces**: PascalCase (`AppRouter`, `Context`)
- **Files**: camelCase (`app.ts`, `vite-plugin.ts`)
- **Directories**: lowercase (`lib`, `router`, `shared`)

### Formatting

- 2-space indentation
- Double quotes for strings
- Semicolons required
- Trailing commas in multiline objects
- Prettier installed (empty config, uses defaults)

### Error Handling

- Validate inputs with Zod schemas
- Return structured responses: `{ code, data, message }`
- Log errors in standalone mode; framework handles middleware errors

## Router Module Structure

Each module under `src/router/` follows a fixed structure:

### Module Files

**`{module}/index.ts`** - Module router that aggregates all methods:

```typescript
import { router } from "../../lib/trpc.ts";
import { getConfig } from "./methods/getConfig.ts";

export const utils = router({ getConfig });
```

**`{module}/procedure.ts`** - Module procedure definition:

```typescript
import { publicProcedure } from "../../lib/trpc.ts";

export const procedure = publicProcedure;
```

**`{module}/methods/{handler}.ts`** - Handler implementation:

```typescript
import z from "zod";
import { procedure } from "../procedure.ts";

const input = z.object({ name: z.string().optional() }).optional();
const output = z.object({
  code: z.number(),
  data: z.any().optional(),
  message: z.string().optional(),
});

export const getConfig = procedure
  .meta({ openapi: { method: "GET", path: "/utils/get-config" } })
  .input(input)
  .output(output)
  .query(async ({ ctx, input }) => {
    return { code: 0, data: {} };
  });
```

### Creating a New Module

1. Create folder: `src/router/{moduleName}/`
2. Create `procedure.ts` - export module procedure
3. Create `methods/` folder with handler files
4. Create `index.ts` - aggregate all methods into router
5. Register in `src/router/index.ts`:

```typescript
import { router } from "../lib/trpc.ts";
import { utils } from "./utils/index.ts";
import { newModule } from "./newModule/index.ts";

export const appRouter = router({ utils, newModule });
```

## tRPC Patterns

### Creating Procedures

```typescript
import { procedure } from "../procedure.ts";

export const myHandler = procedure
  .meta({ openapi: { method: "GET", path: "/utils/my-handler" } })
  .input(z.object({ name: z.string().optional() }).optional())
  .output(z.object({ code: z.number(), data: z.any() }))
  .query(async ({ ctx, input }) => {
    return { code: 0, data: {} };
  });
```

### Context

```typescript
// src/lib/trpc.ts
export const createContext = ({ req, res }) => ({ req, res });
export type Context = Awaited<ReturnType<typeof createContext>>;
```

## API Endpoints

| Endpoint           | Method | Description        |
| ------------------ | ------ | ------------------ |
| `/__agent/trpc`    | POST   | tRPC requests      |
| `/__agent/openapi` | \*     | REST-style OpenAPI |
| `/__agent/swagger` | GET    | Swagger UI docs    |

## Environment

- `.env` loaded via dotenv
- ES modules: `"type": "module"` in package.json
- Server: port 3000, prefix `/__agent/`

## Key Dependencies

| Package            | Purpose            |
| ------------------ | ------------------ |
| tRPC               | RPC framework      |
| Express            | HTTP server        |
| Zod                | Schema validation  |
| trpc-to-openapi    | OpenAPI generation |
| swagger-ui-express | API documentation  |
| Prisma             | Database ORM       |

## Notes

- No ESLint configured
- No test suite exists
- `.prettierrc` is empty
- Standalone server: `src/index.ts`
- Vite plugin: `src/vite-plugin.ts`
