# Prisma Method Forms — Design Spec

Build a complete set of Prisma method form components for the demo app, composed from existing builder sub-components.

## Architecture

- **9 component directories** under `packages/example/src/`, each with `types.ts`, `Component.tsx`, `Demo.tsx`, `index.ts`
- Sidebar organized into **method categories** (collapsible SubMenu) + **sub-component** reference section (flat)
- Each method form outputs the complete Prisma call argument as JSON (same pattern as the existing `ProPrismaCreate`)
- No shared generic base — each component independently composes the sub-components it needs

### Sub-component re-use

| Sub-component | Used by |
|---|---|
| ProPrismaCreateData | create, createManyBatch, update, upsert, updateManyBatch |
| ProPrismaUpdateData | update, upsert, updateManyBatch |
| ProPrismaWhere | findFirst, findMany, count, aggregate, groupBy, deleteMany, updateManyBatch |
| ProPrismaWhereUnique | findUnique, update, delete, upsert |
| ProPrismaSelect | create, findUnique, findFirst, findMany, update, delete, createManyAndReturn, updateManyAndReturn |
| ProPrismaInclude | create, findUnique, findFirst, findMany, update, delete |
| ProPrismaOmit | findUnique, findFirst, findMany |
| ProPrismaOrderBy | findFirst, findMany, count, aggregate, groupBy |
| ProPrismaPagination | findFirst, findMany, count, aggregate, groupBy |
| ProPrismaDistinct | findFirst, findMany |
| ProPrismaAggregate (fields) | aggregate, groupBy, count (via select._count) |
| ProPrismaGroupBy | — only used inside GroupBy form itself |

### New sub-components needed

| New component | Purpose |
|---|---|
| ProPrismaBatchData | data[] input with add/remove rows, each row = single object fields |
| ProPrismaSkipDuplicates | Simple Switch for `skipDuplicates?` boolean |
| ProPrismaRawFilter | JSON textarea for `filter` / `pipeline` + options |

## Component Specifications

### 1. ProPrismaFindForm — findUnique / findFirst / findMany

**Params by method:**
- `findUnique` → `(whereUnique, select/include/omit)`
- `findFirst` → `(where, orderBy, pagination, distinct, select/include/omit)`
- `findMany` → `(where, orderBy, pagination, distinct, select/include/omit)`

**UI:**
- Radio at top: `findUnique` | `findFirst` | `findMany`
- `findUnique`: WhereUnique section + QueryShape radio (Select/Include/Omit/None)
- `findFirst`/`findMany`: Where + OrderBy + Pagination + Distinct + QueryShape
- Output: `{ where, orderBy, take, skip, cursor, distinct, select/include/omit }` (keys vary by method)

### 2. ProPrismaCreateForm — create ✅

Already implemented. Refer to existing `ProPrismaCreate`.

### 3. ProPrismaMutationForm — update / delete

**Params by method:**
- `update` → `(whereUnique, data, select/include/omit)`
- `delete` → `(whereUnique, select/include/omit)`

**UI:**
- Radio: `update` | `delete`
- `update`: WhereUnique + UpdateData + QueryShape
- `delete`: WhereUnique + QueryShape
- Output: `{ where: {...}, data: {...}, select/include/omit: {...} }`

### 4. ProPrismaUpsertForm — upsert

**Params:** `(whereUnique, create, update, select/include/omit)`

**UI:**
- WhereUnique + CreateData + UpdateData + QueryShape
- Output: `{ where: {...}, create: {...}, update: {...}, select/include/omit: {...} }`

### 5. ProPrismaBatchForm — createMany/createManyAndReturn/updateMany/updateManyAndReturn/deleteMany

**Params by method:**
- `createMany` → `(data[], skipDuplicates?)`
- `createManyAndReturn` → `(data[], skipDuplicates?, select)`
- `updateMany` → `(where, data)`
- `updateManyAndReturn` → `(where, data, select)`
- `deleteMany` → `(where)`

**UI:**
- Radio: all 5 methods
- BatchData section (reusable table-like input with add/remove rows)
- Each row shows the relevant fields for the model (reusing single-field editors from CreateData)
- Conditional sections: Where (for update/delete variants), Select (for ...AndReturn variants), SkipDuplicates Switch
- Output: `{ data: [...], where: {...}, skipDuplicates: true, select: {...} }`

**New sub-component: ProPrismaBatchData**
- Props: `fields: CreateFieldConfig[]`, `value: Record<string, unknown>[]`, `onChange`
- Shows a table with "+ Add Row" and "×" remove buttons
- Each cell is a simple field editor (text input, enum select, etc.)

### 6. ProPrismaCountForm — count

**Params:** `(where, orderBy, pagination, select?)`

**UI:**
- Where + OrderBy + Pagination
- Select section: checkbox list of field names + "_all" option
- Output: `{ where: {...}, orderBy: [...], take: N, skip: N, cursor: { id: N }, select: { _all: true } }`

### 7. ProPrismaAggregateForm — aggregate

**Params:** `(where, orderBy, pagination, _count, _avg, _sum, _min, _max)`

**UI:**
- Where + OrderBy + Pagination
- Aggregation fields section (reuse ProPrismaAggregate component)
- Output: `{ where: {...}, orderBy: [...], take: N, skip: N, _count: true, _avg: { score: true } }`

### 8. ProPrismaGroupByForm — groupBy

**Params:** `(by, where, orderBy, pagination, having, _count, _avg, _sum, _min, _max)`

**UI:**
- By: multi-select of fields to group by
- Where + OrderBy + Pagination
- Aggregation fields section
- Having: optional filter on aggregated values (simplified Where-like filter)
- Output: `{ by: [...], where: {...}, orderBy: [...], take: N, _count: true }`

### 9. ProPrismaRawForm — findRaw / aggregateRaw

**Params by method:**
- `findRaw` → `(filter, options)`
- `aggregateRaw` → `(pipeline, options)`

**UI:**
- Radio: `findRaw` | `aggregateRaw`
- `findRaw`: JSON textarea for `filter` + options (JSON)
- `aggregateRaw`: JSON textarea for pipeline (array of stages) + options
- Output: verbatim — `{ filter: {...} }` or `{ pipeline: [...] }`

**New sub-component: ProPrismaRawFilter**
- Props: `label: string`, `value: string`, `onChange`
- Simple JSON textarea with syntax highlighting placeholder

## Sidebar Organization

```
▶ Find          → findUnique / findFirst / findMany
▶ Create        → create / createMany / createManyAndReturn
▶ Update        → update / upsert / updateMany / updateManyAndReturn
▶ Delete        → delete / deleteMany
▶ Count
▶ Aggregate
▶ GroupBy
▶ Raw           → findRaw / aggregateRaw
───────────────  (divider)
▶ Filters       → Where / WhereUnique / Select / Include / Omit
▶ Sorting       → OrderBy
▶ Pagination    → Pagination / Distinct
▶ Data          → Create Data / Update Data
▶ Computation   → Aggregate / GroupBy
```

Method form sidebar items use SubMenu with method labels as clickable items.
Sub-component reference section stays as flat Menu items (existing).

## Data Flow

Each method form follows the same pattern:
1. `value: MethodValue` — flat value object with all sections
2. `onChange: (value) => void` — replace on any change
3. `toPrisma<Method>(value, fields) → Record<string, unknown>` — pure transform function
4. Output displayed as JSON below the form

## Implementation Order

1. ProPrismaFindForm (covers 3 methods, demonstrates method-switching pattern)
2. ProPrismaMutationForm (update + delete)
3. ProPrismaUpsertForm (migrate existing to new pattern)
4. ProPrismaBatchForm (needs new BatchData sub-component)
5. ProPrismaCountForm (simple)
6. ProPrismaAggregateForm
7. ProPrismaGroupByForm
8. ProPrismaRawForm (standalone, no sub-component dependencies)
9. Sidebar reorganization (SubMenu + divider)
