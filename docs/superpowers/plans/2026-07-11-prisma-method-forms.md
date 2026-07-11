# Prisma Method Forms — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 8 new method form components + 3 new sub-components + sidebar reorganization to cover all 17 Prisma methods.

**Architecture:** Method forms compose existing sub-components under a shared pattern: `types.ts` (value + config + toPrisma fn) + `Component.tsx` + `Demo.tsx` + `index.ts`. Each method form wraps sub-components, passes their values through `toPrisma*()` transforms, and displays the resulting JSON.

**Tech Stack:** React 19, Ant Design 6, TypeScript 6, Vite 8. Strict TS with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`.

---

## Scope Check

The spec covers 9 method forms. Each is independent and implementable in isolation. The sidebar task touches only App.tsx and is the final step.

## File Structure

### New method form components
| Component | Directory | Methods | Depends on sub-components |
|---|---|---|---|
| ProPrismaFindForm | `ProPrismaFindForm/` | findUnique, findFirst, findMany | WhereUnique, Where, Select/Include/Omit, OrderBy, Pagination, Distinct |
| ProPrismaMutationForm | `ProPrismaMutationForm/` | update, delete | WhereUnique, UpdateData, Select/Include/Omit |
| ProPrismaBatchForm | `ProPrismaBatchForm/` | createMany, createManyAndReturn, updateMany, updateManyAndReturn, deleteMany | BatchData, SkipDuplicates, Where, UpdateData, Select |
| ProPrismaCountForm | `ProPrismaCountForm/` | count | Where, OrderBy, Pagination, Select |
| ProPrismaAggregateForm | `ProPrismaAggregateForm/` | aggregate | Where, OrderBy, Pagination, Aggregate (sub-component) |
| ProPrismaGroupByForm | `ProPrismaGroupByForm/` | groupBy | GroupBy, Where, OrderBy, Pagination, Aggregate |
| ProPrismaRawForm | `ProPrismaRawForm/` | findRaw, aggregateRaw | RawFilter |

### Existing components modified
| Component | Change |
|---|---|
| ProPrismaUpsert | Add QueryShape (Select/Include/Omit) support |
| App.tsx | Reorganize sidebar with SubMenu categories |

### New sub-components
| Component | Purpose |
|---|---|
| ProPrismaBatchData | data[] table with add/remove rows |
| ProPrismaSkipDuplicates | Switch for skipDuplicates? |
| ProPrismaRawFilter | JSON textarea for raw filter/pipeline |

---

## Task 1: ProPrismaFindForm — findUnique / findFirst / findMany

**Files:**
- Create: `packages/example/src/ProPrismaFindForm/types.ts`
- Create: `packages/example/src/ProPrismaFindForm/ProPrismaFindForm.tsx`
- Create: `packages/example/src/ProPrismaFindForm/Demo.tsx`
- Create: `packages/example/src/ProPrismaFindForm/index.ts`

- [ ] **Step 1: Create types.ts**

```typescript
import type { WhereUniqueValue, UniqueFieldConfig } from "../ProPrismaWhereUnique/types";
import type { WhereValue, FieldConfig as WhereFieldConfig } from "../ProPrismaWhere/types";
import type { SelectFieldConfig, SelectValue } from "../ProPrismaSelect/types";
import type { IncludeFieldConfig, IncludeValue } from "../PrismaInclude/types";
import type { OmitFieldConfig, OmitValue } from "../ProPrismaOmit/types";
import type { OrderByFieldConfig, OrderByValue } from "../ProPrismaOrderBy/types";
import type { PaginationFieldConfig, PaginationValue } from "../ProPrismaPagination/types";
import type { DistinctFieldConfig, DistinctValue } from "../ProPrismaDistinct/types";
import { toPrismaWhereUnique } from "../ProPrismaWhereUnique/types";
import { toPrismaWhere } from "../ProPrismaWhere/types";
import { toPrismaOrderBy } from "../ProPrismaOrderBy/types";
import { toPrismaPagination } from "../ProPrismaPagination/types";
import { toPrismaDistinct } from "../ProPrismaDistinct/types";
import { toPrismaSelect } from "../ProPrismaSelect/types";
import { toPrismaInclude } from "../ProPrismaInclude/types";
import { toPrismaOmit } from "../ProPrismaOmit/types";

export type FindMethod = "findUnique" | "findFirst" | "findMany";
export type QueryShape = "none" | "select" | "include" | "omit";

export interface FindFormValue {
  method: FindMethod;
  where: WhereValue;
  whereUnique: WhereUniqueValue;
  orderBy: OrderByValue;
  pagination: PaginationValue;
  distinct: DistinctValue;
  queryShape: QueryShape;
  select: SelectValue;
  include: IncludeValue;
  omit: OmitValue;
}

export interface FindFormFieldConfig {
  whereFields: WhereFieldConfig[];
  whereUniqueFields: UniqueFieldConfig[];
  orderByFields: OrderByFieldConfig[];
  paginationFields: PaginationFieldConfig[];
  distinctFields: DistinctFieldConfig[];
  selectFields: SelectFieldConfig[];
  includeFields: IncludeFieldConfig[];
  omitFields: OmitFieldConfig[];
}

export function emptyFindFormValue(method: FindMethod = "findMany"): FindFormValue {
  return {
    method,
    where: {},
    whereUnique: { field: "id", value: null },
    orderBy: [],
    pagination: { take: "", skip: "", cursor: { field: "id", value: null } },
    distinct: [],
    queryShape: "none",
    select: {},
    include: {},
    omit: {},
  };
}

export function toPrismaFindForm(
  value: FindFormValue,
  fields: FindFormFieldConfig,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (value.method === "findUnique") {
    const where = toPrismaWhereUnique(value.whereUnique, fields.whereUniqueFields);
    if (Object.keys(where).length > 0) {
      result.where = where;
    }
  } else {
    const where = toPrismaWhere(value.where, fields.whereFields);
    if (Object.keys(where).length > 0) {
      result.where = where;
    }
    const orderBy = toPrismaOrderBy(value.orderBy, fields.orderByFields);
    if (orderBy.length > 0) {
      result.orderBy = orderBy;
    }
    const pagination = toPrismaPagination(value.pagination, fields.paginationFields);
    Object.assign(result, pagination);
    const distinct = toPrismaDistinct(value.distinct, fields.distinctFields);
    if (distinct.length > 0) {
      result.distinct = distinct;
    }
  }

  if (value.queryShape === "select") {
    const select = toPrismaSelect(value.select, fields.selectFields);
    if (Object.keys(select).length > 0) {
      result.select = select;
    }
  } else if (value.queryShape === "include") {
    const include = toPrismaInclude(value.include, fields.includeFields);
    if (Object.keys(include).length > 0) {
      result.include = include;
    }
  } else if (value.queryShape === "omit") {
    const omit = toPrismaOmit(value.omit);
    if (Object.keys(omit).length > 0) {
      result.omit = omit;
    }
  }

  return result;
}
```

- [ ] **Step 2: Create ProPrismaFindForm.tsx**

```tsx
import { Radio } from "antd";
import { useMemo } from "react";
import { ProPrismaWhereUnique } from "../ProPrismaWhereUnique/ProPrismaWhereUnique";
import { ProPrismaWhere } from "../ProPrismaWhere/ProPrismaWhere";
import { ProPrismaOrderBy } from "../ProPrismaOrderBy/ProPrismaOrderBy";
import { ProPrismaPagination } from "../ProPrismaPagination/ProPrismaPagination";
import { ProPrismaDistinct } from "../ProPrismaDistinct/ProPrismaDistinct";
import { ProPrismaSelect } from "../ProPrismaSelect/ProPrismaSelect";
import { ProPrismaInclude } from "../ProPrismaInclude/ProPrismaInclude";
import { ProPrismaOmit } from "../ProPrismaOmit/ProPrismaOmit";
import {
  toPrismaFindForm,
  type FindFormFieldConfig,
  type FindFormValue,
  type FindMethod,
  type QueryShape,
} from "./types";

interface ProPrismaFindFormProps {
  fields: FindFormFieldConfig;
  value: FindFormValue;
  onChange: (value: FindFormValue) => void;
}

export function ProPrismaFindForm({ fields, value, onChange }: ProPrismaFindFormProps) {
  const result = useMemo(() => toPrismaFindForm(value, fields), [value, fields]);

  const isFindUnique = value.method === "findUnique";
  const isFindMany = value.method === "findFirst" || value.method === "findMany";

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Radio.Group
          value={value.method}
          onChange={(e) =>
            onChange({ ...emptyFindFormValue(e.target.value as FindMethod), method: e.target.value as FindMethod })
          }
        >
          <Radio.Button value="findUnique">findUnique</Radio.Button>
          <Radio.Button value="findFirst">findFirst</Radio.Button>
          <Radio.Button value="findMany">findMany</Radio.Button>
        </Radio.Group>
      </div>

      {isFindUnique && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>where (unique)</h4>
          <ProPrismaWhereUnique
            fields={fields.whereUniqueFields}
            value={value.whereUnique}
            onChange={(whereUnique) => onChange({ ...value, whereUnique })}
          />
        </div>
      )}

      {isFindMany && (
        <>
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 8 }}>where</h4>
            <ProPrismaWhere
              fields={fields.whereFields}
              value={value.where}
              onChange={(where) => onChange({ ...value, where })}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 8 }}>orderBy</h4>
            <ProPrismaOrderBy
              fields={fields.orderByFields}
              value={value.orderBy}
              onChange={(orderBy) => onChange({ ...value, orderBy })}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 8 }}>pagination</h4>
            <ProPrismaPagination
              fields={fields.paginationFields}
              value={value.pagination}
              onChange={(pagination) => onChange({ ...value, pagination })}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 8 }}>distinct</h4>
            <ProPrismaDistinct
              fields={fields.distinctFields}
              value={value.distinct}
              onChange={(distinct) => onChange({ ...value, distinct })}
            />
          </div>
        </>
      )}

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>Query Shape</h4>
        <Radio.Group
          value={value.queryShape}
          onChange={(e) => onChange({ ...value, queryShape: e.target.value as QueryShape })}
        >
          <Radio.Button value="none">None</Radio.Button>
          <Radio.Button value="select">Select</Radio.Button>
          <Radio.Button value="include">Include</Radio.Button>
          <Radio.Button value="omit">Omit</Radio.Button>
        </Radio.Group>
      </div>

      {value.queryShape === "select" && (
        <div style={{ marginBottom: 16 }}>
          <ProPrismaSelect
            fields={fields.selectFields}
            value={value.select}
            onChange={(select) => onChange({ ...value, select })}
          />
        </div>
      )}
      {value.queryShape === "include" && (
        <div style={{ marginBottom: 16 }}>
          <ProPrismaInclude
            fields={fields.includeFields}
            value={value.include}
            onChange={(include) => onChange({ ...value, include })}
          />
        </div>
      )}
      {value.queryShape === "omit" && (
        <div style={{ marginBottom: 16 }}>
          <ProPrismaOmit
            fields={fields.omitFields}
            value={value.omit}
            onChange={(omit) => onChange({ ...value, omit })}
          />
        </div>
      )}

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>
          prisma.user.{value.method}() Output:
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

Note: `emptyFindFormValue` is imported from `./types`. The component also needs the import at the top of the file — add `import { emptyFindFormValue, ... }` in the types import.

- [ ] **Step 3: Create Demo.tsx**

```tsx
import { useState } from "react";
import { ProPrismaFindForm } from "./ProPrismaFindForm";
import { emptyFindFormValue, type FindFormFieldConfig } from "./types";
import {
  dmmfToWhereFields,
  dmmfToUniqueFields,
  dmmfToOrderByFields,
  dmmfToPaginationFields,
  dmmfToSelectFields,
  dmmfToIncludeFields,
  dmmfToOmitFields,
  dmmfToDistinctFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;

const fields: FindFormFieldConfig = {
  whereFields: dmmfToWhereFields(dmmf, "User"),
  whereUniqueFields: dmmfToUniqueFields(dmmf, "User"),
  orderByFields: dmmfToOrderByFields(dmmf, "User"),
  paginationFields: dmmfToPaginationFields(dmmf, "User"),
  distinctFields: dmmfToDistinctFields(dmmf, "User"),
  selectFields: dmmfToSelectFields(dmmf, "User"),
  includeFields: dmmfToIncludeFields(dmmf, "User"),
  omitFields: dmmfToOmitFields(dmmf, "User"),
};

export const ProPrismaFindFormDemo = () => {
  const [value, setValue] = useState(emptyFindFormValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma findUnique / findFirst / findMany Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build a complete <code>prisma.user.findUnique()</code>, <code>findFirst</code>, or <code>findMany</code> call.
      </p>
      <ProPrismaFindForm fields={fields} value={value} onChange={setValue} />
    </div>
  );
};
```

- [ ] **Step 4: Create index.ts**

```typescript
export * from "./types";
export * from "./ProPrismaFindForm";
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```
git add packages/example/src/ProPrismaFindForm/
git commit -m "feat: add ProPrismaFindForm — findUnique/findFirst/findMany builder"
```

---

## Task 2: ProPrismaMutationForm — update / delete

**Files:**
- Create: `packages/example/src/ProPrismaMutationForm/types.ts`
- Create: `packages/example/src/ProPrismaMutationForm/ProPrismaMutationForm.tsx`
- Create: `packages/example/src/ProPrismaMutationForm/Demo.tsx`
- Create: `packages/example/src/ProPrismaMutationForm/index.ts`

- [ ] **Step 1: Create types.ts**

```typescript
import type { WhereUniqueValue, UniqueFieldConfig } from "../ProPrismaWhereUnique/types";
import type { SelectFieldConfig, SelectValue } from "../ProPrismaSelect/types";
import type { IncludeFieldConfig, IncludeValue } from "../ProPrismaInclude/types";
import type { OmitFieldConfig, OmitValue } from "../ProPrismaOmit/types";
import type { CreateFieldConfig } from "../ProPrismaCreateData/types";
import { toPrismaWhereUnique } from "../ProPrismaWhereUnique/types";
import { toPrismaUpdateData } from "../ProPrismaUpdateData/types";
import { toPrismaSelect } from "../ProPrismaSelect/types";
import { toPrismaInclude } from "../ProPrismaInclude/types";
import { toPrismaOmit } from "../ProPrismaOmit/types";

export type MutationMethod = "update" | "delete";
export type QueryShape = "none" | "select" | "include" | "omit";

export interface MutationFormValue {
  method: MutationMethod;
  whereUnique: WhereUniqueValue;
  data: Record<string, unknown>;
  queryShape: QueryShape;
  select: SelectValue;
  include: IncludeValue;
  omit: OmitValue;
}

export interface MutationFormFieldConfig {
  uniqueFields: UniqueFieldConfig[];
  dataFields: CreateFieldConfig[];
  selectFields: SelectFieldConfig[];
  includeFields: IncludeFieldConfig[];
  omitFields: OmitFieldConfig[];
}

export function emptyMutationFormValue(method: MutationMethod = "update"): MutationFormValue {
  return {
    method,
    whereUnique: { field: "id", value: null },
    data: {},
    queryShape: "none",
    select: {},
    include: {},
    omit: {},
  };
}

export function toPrismaMutationForm(
  value: MutationFormValue,
  fields: MutationFormFieldConfig,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const where = toPrismaWhereUnique(value.whereUnique, fields.uniqueFields);
  if (Object.keys(where).length > 0) {
    result.where = where;
  }

  if (value.method === "update") {
    const data = toPrismaUpdateData(value.data, fields.dataFields);
    if (Object.keys(data).length > 0) {
      result.data = data;
    }
  }

  if (value.queryShape === "select") {
    const select = toPrismaSelect(value.select, fields.selectFields);
    if (Object.keys(select).length > 0) {
      result.select = select;
    }
  } else if (value.queryShape === "include") {
    const include = toPrismaInclude(value.include, fields.includeFields);
    if (Object.keys(include).length > 0) {
      result.include = include;
    }
  } else if (value.queryShape === "omit") {
    const omit = toPrismaOmit(value.omit);
    if (Object.keys(omit).length > 0) {
      result.omit = omit;
    }
  }

  return result;
}
```

- [ ] **Step 2: Create ProPrismaMutationForm.tsx**

```tsx
import { Radio } from "antd";
import { useMemo } from "react";
import { ProPrismaWhereUnique } from "../ProPrismaWhereUnique/ProPrismaWhereUnique";
import { ProPrismaUpdateData } from "../ProPrismaUpdateData/ProPrismaUpdateData";
import { ProPrismaSelect } from "../ProPrismaSelect/ProPrismaSelect";
import { ProPrismaInclude } from "../ProPrismaInclude/ProPrismaInclude";
import { ProPrismaOmit } from "../ProPrismaOmit/ProPrismaOmit";
import {
  toPrismaMutationForm,
  type MutationFormFieldConfig,
  type MutationFormValue,
  type MutationMethod,
  type QueryShape,
  emptyMutationFormValue,
} from "./types";

interface ProPrismaMutationFormProps {
  fields: MutationFormFieldConfig;
  value: MutationFormValue;
  onChange: (value: MutationFormValue) => void;
}

export function ProPrismaMutationForm({ fields, value, onChange }: ProPrismaMutationFormProps) {
  const result = useMemo(() => toPrismaMutationForm(value, fields), [value, fields]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Radio.Group
          value={value.method}
          onChange={(e) =>
            onChange({
              ...emptyMutationFormValue(e.target.value as MutationMethod),
              method: e.target.value as MutationMethod,
            })
          }
        >
          <Radio.Button value="update">update</Radio.Button>
          <Radio.Button value="delete">delete</Radio.Button>
        </Radio.Group>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>where (unique)</h4>
        <ProPrismaWhereUnique
          fields={fields.uniqueFields}
          value={value.whereUnique}
          onChange={(whereUnique) => onChange({ ...value, whereUnique })}
        />
      </div>

      {value.method === "update" && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>data</h4>
          <ProPrismaUpdateData
            fields={fields.dataFields}
            value={value.data}
            onChange={(data) => onChange({ ...value, data })}
          />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>Query Shape</h4>
        <Radio.Group
          value={value.queryShape}
          onChange={(e) => onChange({ ...value, queryShape: e.target.value as QueryShape })}
        >
          <Radio.Button value="none">None</Radio.Button>
          <Radio.Button value="select">Select</Radio.Button>
          <Radio.Button value="include">Include</Radio.Button>
          <Radio.Button value="omit">Omit</Radio.Button>
        </Radio.Group>
      </div>

      {value.queryShape === "select" && (
        <ProPrismaSelect
          fields={fields.selectFields}
          value={value.select}
          onChange={(select) => onChange({ ...value, select })}
        />
      )}
      {value.queryShape === "include" && (
        <ProPrismaInclude
          fields={fields.includeFields}
          value={value.include}
          onChange={(include) => onChange({ ...value, include })}
        />
      )}
      {value.queryShape === "omit" && (
        <ProPrismaOmit
          fields={fields.omitFields}
          value={value.omit}
          onChange={(omit) => onChange({ ...value, omit })}
        />
      )}

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>
          prisma.user.{value.method}() Output:
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Demo.tsx**

```tsx
import { useState } from "react";
import { ProPrismaMutationForm } from "./ProPrismaMutationForm";
import { emptyMutationFormValue, type MutationFormFieldConfig } from "./types";
import {
  dmmfToUniqueFields,
  dmmfToCreateFields,
  dmmfToSelectFields,
  dmmfToIncludeFields,
  dmmfToOmitFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;

const fields: MutationFormFieldConfig = {
  uniqueFields: dmmfToUniqueFields(dmmf, "User"),
  dataFields: dmmfToCreateFields(dmmf, "User"),
  selectFields: dmmfToSelectFields(dmmf, "User"),
  includeFields: dmmfToIncludeFields(dmmf, "User"),
  omitFields: dmmfToOmitFields(dmmf, "User"),
};

export const ProPrismaMutationFormDemo = () => {
  const [value, setValue] = useState(emptyMutationFormValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma update / delete Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build a complete <code>prisma.user.update()</code> or <code>prisma.user.delete()</code> call.
      </p>
      <ProPrismaMutationForm fields={fields} value={value} onChange={setValue} />
    </div>
  );
};
```

- [ ] **Step 4: Create index.ts**

```typescript
export * from "./types";
export * from "./ProPrismaMutationForm";
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```
git add packages/example/src/ProPrismaMutationForm/
git commit -m "feat: add ProPrismaMutationForm — update/delete builder"
```

---

## Task 3: Add QueryShape to ProPrismaUpsert

**Files:**
- Modify: `packages/example/src/ProPrismaUpsert/types.ts`
- Modify: `packages/example/src/ProPrismaUpsert/ProPrismaUpsert.tsx`
- Modify: `packages/example/src/ProPrismaUpsert/Demo.tsx`

- [ ] **Step 1: Modify types.ts — add queryShape, select, include, omit**

Replace content with:

```typescript
import type { WhereUniqueValue, UniqueFieldConfig } from "../ProPrismaWhereUnique/types";
import type { CreateFieldConfig } from "../ProPrismaCreateData/types";
import type { SelectFieldConfig, SelectValue } from "../ProPrismaSelect/types";
import type { IncludeFieldConfig, IncludeValue } from "../ProPrismaInclude/types";
import type { OmitFieldConfig, OmitValue } from "../ProPrismaOmit/types";
import { toPrismaWhereUnique } from "../ProPrismaWhereUnique/types";
import { toPrismaCreateData } from "../ProPrismaCreateData/types";
import { toPrismaUpdateData } from "../ProPrismaUpdateData/types";
import { toPrismaSelect } from "../ProPrismaSelect/types";
import { toPrismaInclude } from "../ProPrismaInclude/types";
import { toPrismaOmit } from "../ProPrismaOmit/types";

export type QueryShape = "none" | "select" | "include" | "omit";

export interface UpsertValue {
  where: WhereUniqueValue;
  create: Record<string, unknown>;
  update: Record<string, unknown>;
  queryShape: QueryShape;
  select: SelectValue;
  include: IncludeValue;
  omit: OmitValue;
}

export interface UpsertFieldConfig {
  uniqueFields: UniqueFieldConfig[];
  createFields: CreateFieldConfig[];
  updateFields: CreateFieldConfig[];
  selectFields: SelectFieldConfig[];
  includeFields: IncludeFieldConfig[];
  omitFields: OmitFieldConfig[];
}

export function emptyUpsertValue(): UpsertValue {
  return {
    where: { field: "id", value: null },
    create: {},
    update: {},
    queryShape: "none",
    select: {},
    include: {},
    omit: {},
  };
}

export function toPrismaUpsert(
  value: UpsertValue,
  fields: UpsertFieldConfig,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const where = toPrismaWhereUnique(value.where, fields.uniqueFields);
  if (Object.keys(where).length > 0) {
    result.where = where;
  }

  const create = toPrismaCreateData(value.create, fields.createFields);
  if (Object.keys(create).length > 0) {
    result.create = create;
  }

  const update = toPrismaUpdateData(value.update, fields.updateFields);
  if (Object.keys(update).length > 0) {
    result.update = update;
  }

  if (value.queryShape === "select") {
    const select = toPrismaSelect(value.select, fields.selectFields);
    if (Object.keys(select).length > 0) {
      result.select = select;
    }
  } else if (value.queryShape === "include") {
    const include = toPrismaInclude(value.include, fields.includeFields);
    if (Object.keys(include).length > 0) {
      result.include = include;
    }
  } else if (value.queryShape === "omit") {
    const omit = toPrismaOmit(value.omit);
    if (Object.keys(omit).length > 0) {
      result.omit = omit;
    }
  }

  return result;
}

export { toPrismaWhereUnique } from "../ProPrismaWhereUnique/types";
export { toPrismaCreateData } from "../ProPrismaCreateData/types";
export { toPrismaUpdateData } from "../ProPrismaUpdateData/types";
```

- [ ] **Step 2: Modify ProPrismaUpsert.tsx — add QueryShape section**

```tsx
import { Radio } from "antd";
import { useMemo } from "react";
import { ProPrismaWhereUnique } from "../ProPrismaWhereUnique/ProPrismaWhereUnique";
import { ProPrismaCreateData } from "../ProPrismaCreateData/ProPrismaCreateData";
import { ProPrismaUpdateData } from "../ProPrismaUpdateData/ProPrismaUpdateData";
import { ProPrismaSelect } from "../ProPrismaSelect/ProPrismaSelect";
import { ProPrismaInclude } from "../ProPrismaInclude/ProPrismaInclude";
import { ProPrismaOmit } from "../ProPrismaOmit/ProPrismaOmit";
import { toPrismaUpsert, type UpsertValue, type UpsertFieldConfig, type QueryShape } from "./types";

interface ProPrismaUpsertProps {
  fields: UpsertFieldConfig;
  value: UpsertValue;
  onChange: (value: UpsertValue) => void;
}

export function ProPrismaUpsert({ fields, value, onChange }: ProPrismaUpsertProps) {
  const result = useMemo(() => toPrismaUpsert(value, fields), [value, fields]);

  return (
    <div>
      <div style={{ border: "1px solid #d9d9d9", borderRadius: 6, padding: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 14, color: "#333" }}>where (unique)</div>
        <ProPrismaWhereUnique
          fields={fields.uniqueFields}
          value={value.where}
          onChange={(where) => onChange({ ...value, where })}
        />
      </div>

      <div style={{ border: "1px solid #d9d9d9", borderRadius: 6, padding: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 14, color: "#333" }}>create data</div>
        <ProPrismaCreateData
          fields={fields.createFields}
          value={value.create}
          onChange={(create) => onChange({ ...value, create })}
        />
      </div>

      <div style={{ border: "1px solid #d9d9d9", borderRadius: 6, padding: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 14, color: "#333" }}>update data</div>
        <ProPrismaUpdateData
          fields={fields.updateFields}
          value={value.update}
          onChange={(update) => onChange({ ...value, update })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 14, color: "#333" }}>Query Shape</div>
        <Radio.Group
          value={value.queryShape}
          onChange={(e) => onChange({ ...value, queryShape: e.target.value as QueryShape })}
        >
          <Radio.Button value="none">None</Radio.Button>
          <Radio.Button value="select">Select</Radio.Button>
          <Radio.Button value="include">Include</Radio.Button>
          <Radio.Button value="omit">Omit</Radio.Button>
        </Radio.Group>
      </div>

      {value.queryShape === "select" && (
        <div style={{ marginBottom: 16 }}>
          <ProPrismaSelect
            fields={fields.selectFields}
            value={value.select}
            onChange={(select) => onChange({ ...value, select })}
          />
        </div>
      )}
      {value.queryShape === "include" && (
        <div style={{ marginBottom: 16 }}>
          <ProPrismaInclude
            fields={fields.includeFields}
            value={value.include}
            onChange={(include) => onChange({ ...value, include })}
          />
        </div>
      )}
      {value.queryShape === "omit" && (
        <div style={{ marginBottom: 16 }}>
          <ProPrismaOmit
            fields={fields.omitFields}
            value={value.omit}
            onChange={(omit) => onChange({ ...value, omit })}
          />
        </div>
      )}

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>Prisma Upsert Output:</div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Modify Demo.tsx — use emptyUpsertValue, add select/include/omit field configs**

```tsx
import { useState } from "react";
import { ProPrismaUpsert } from "./ProPrismaUpsert";
import { toPrismaUpsert, emptyUpsertValue, type UpsertValue, type UpsertFieldConfig } from "./types";
import {
  dmmfToUniqueFields,
  dmmfToCreateFields,
  dmmfToSelectFields,
  dmmfToIncludeFields,
  dmmfToOmitFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;

const fields: UpsertFieldConfig = {
  uniqueFields: dmmfToUniqueFields(dmmf, "User"),
  createFields: dmmfToCreateFields(dmmf, "User"),
  updateFields: dmmfToCreateFields(dmmf, "User"),
  selectFields: dmmfToSelectFields(dmmf, "User"),
  includeFields: dmmfToIncludeFields(dmmf, "User"),
  omitFields: dmmfToOmitFields(dmmf, "User"),
};

export const ProPrismaUpsertDemo = () => {
  const [upsert, setUpsert] = useState<UpsertValue>(emptyUpsertValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Upsert Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build a Prisma <code>upsert</code> operation combining a unique where clause, create data, update data, and optional query shape.
      </p>
      <ProPrismaUpsert
        fields={fields}
        value={upsert}
        onChange={setUpsert}
      />
    </div>
  );
};
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```
git add packages/example/src/ProPrismaUpsert/
git commit -m "feat: add QueryShape (select/include/omit) to ProPrismaUpsert"
```

---

## Task 4: ProPrismaBatchData + ProPrismaSkipDuplicates — new sub-components

**Files:**
- Create: `packages/example/src/ProPrismaBatchData/types.ts`
- Create: `packages/example/src/ProPrismaBatchData/ProPrismaBatchData.tsx`
- Create: `packages/example/src/ProPrismaBatchData/Demo.tsx`
- Create: `packages/example/src/ProPrismaBatchData/index.ts`
- Create: `packages/example/src/ProPrismaSkipDuplicates/ProPrismaSkipDuplicates.tsx`
- Create: `packages/example/src/ProPrismaSkipDuplicates/Demo.tsx`
- Create: `packages/example/src/ProPrismaSkipDuplicates/index.ts`

- [ ] **Step 1: Create ProPrismaBatchData/types.ts**

```typescript
export interface BatchDataValue {
  rows: Record<string, unknown>[];
}

export interface BatchDataFieldConfig {
  fields: { name: string; label: string; type: "string" | "number" | "boolean" | "date" | "enum"; enums?: { label: string; value: string }[] }[];
}

export function emptyBatchDataValue(): BatchDataValue {
  return { rows: [] };
}

export function toPrismaBatchData(value: BatchDataValue): Record<string, unknown>[] {
  return value.rows.map((row) => {
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(row)) {
      if (val !== null && val !== undefined && val !== "") {
        cleaned[key] = val;
      }
    }
    return cleaned;
  });
}
```

- [ ] **Step 2: Create ProPrismaBatchData/ProPrismaBatchData.tsx**

```tsx
import { Button, Input, InputNumber, Select, Switch } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { BatchDataFieldConfig, BatchDataValue } from "./types";

interface ProPrismaBatchDataProps {
  fields: BatchDataFieldConfig;
  value: BatchDataValue;
  onChange: (value: BatchDataValue) => void;
}

export function ProPrismaBatchData({ fields, value, onChange }: ProPrismaBatchDataProps) {
  const addRow = () => {
    const newRow: Record<string, unknown> = {};
    for (const f of fields.fields) {
      newRow[f.name] = f.type === "number" ? null : f.type === "boolean" ? false : "";
    }
    onChange({ rows: [...value.rows, newRow] });
  };

  const removeRow = (index: number) => {
    const rows = value.rows.filter((_, i) => i !== index);
    onChange({ rows });
  };

  const updateRow = (index: number, fieldName: string, val: unknown) => {
    const rows = value.rows.map((row, i) =>
      i === index ? { ...row, [fieldName]: val } : row,
    );
    onChange({ rows });
  };

  return (
    <div>
      {value.rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 8,
            padding: 8,
            border: "1px solid #e8e8e8",
            borderRadius: 4,
          }}
        >
          {fields.fields.map((field) => (
            <div key={field.name} style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{field.label}</div>
              {field.type === "string" && (
                <Input
                  size="small"
                  value={(row[field.name] as string) ?? ""}
                  onChange={(e) => updateRow(rowIndex, field.name, e.target.value)}
                />
              )}
              {field.type === "number" && (
                <InputNumber
                  size="small"
                  style={{ width: "100%" }}
                  value={row[field.name] as number | null}
                  onChange={(val) => updateRow(rowIndex, field.name, val)}
                />
              )}
              {field.type === "boolean" && (
                <Switch
                  size="small"
                  checked={!!row[field.name]}
                  onChange={(val) => updateRow(rowIndex, field.name, val)}
                />
              )}
              {field.type === "enum" && field.enums && (
                <Select
                  size="small"
                  style={{ width: "100%" }}
                  value={(row[field.name] as string) ?? undefined}
                  onChange={(val) => updateRow(rowIndex, field.name, val)}
                  options={field.enums}
                  allowClear
                />
              )}
            </div>
          ))}
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeRow(rowIndex)}
            style={{ marginTop: 18 }}
          />
        </div>
      ))}
      <Button type="dashed" onClick={addRow} icon={<PlusOutlined />} block>
        Add Row
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Create ProPrismaBatchData/Demo.tsx**

```tsx
import { useState } from "react";
import { ProPrismaBatchData } from "./ProPrismaBatchData";
import { emptyBatchDataValue, toPrismaBatchData, type BatchDataValue, type BatchDataFieldConfig } from "./types";

const fields: BatchDataFieldConfig = {
  fields: [
    { name: "email", label: "Email", type: "string" },
    { name: "name", label: "Name", type: "string" },
    { name: "age", label: "Age", type: "number" },
    { name: "role", label: "Role", type: "enum", enums: [{ label: "User", value: "USER" }, { label: "Admin", value: "ADMIN" }] },
  ],
};

export const ProPrismaBatchDataDemo = () => {
  const [value, setValue] = useState<BatchDataValue>(emptyBatchDataValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Batch Data Input</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>Add rows of data for batch create/update operations.</p>
      <ProPrismaBatchData fields={fields} value={value} onChange={setValue} />
      <pre style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, fontSize: 13 }}>
        {JSON.stringify(toPrismaBatchData(value), null, 2)}
      </pre>
    </div>
  );
};
```

- [ ] **Step 4: Create ProPrismaBatchData/index.ts**

```typescript
export * from "./types";
export * from "./ProPrismaBatchData";
```

- [ ] **Step 5: Create ProPrismaSkipDuplicates/ProPrismaSkipDuplicates.tsx**

```tsx
import { Switch } from "antd";

interface ProPrismaSkipDuplicatesProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function ProPrismaSkipDuplicates({ value, onChange }: ProPrismaSkipDuplicatesProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span>skipDuplicates</span>
      <Switch checked={value} onChange={onChange} />
    </div>
  );
}
```

- [ ] **Step 6: Create ProPrismaSkipDuplicates/Demo.tsx**

```tsx
import { useState } from "react";
import { ProPrismaSkipDuplicates } from "./ProPrismaSkipDuplicates";

export const ProPrismaSkipDuplicatesDemo = () => {
  const [value, setValue] = useState(false);
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Skip Duplicates</h1>
      <ProPrismaSkipDuplicates value={value} onChange={setValue} />
      <pre style={{ marginTop: 16 }}>{JSON.stringify(value)}</pre>
    </div>
  );
};
```

- [ ] **Step 7: Create ProPrismaSkipDuplicates/index.ts**

```typescript
export * from "./ProPrismaSkipDuplicates";
```

- [ ] **Step 8: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 9: Commit**

```
git add packages/example/src/ProPrismaBatchData/ packages/example/src/ProPrismaSkipDuplicates/
git commit -m "feat: add ProPrismaBatchData and ProPrismaSkipDuplicates sub-components"
```

---

## Task 5: ProPrismaBatchForm — createMany/createManyAndReturn/updateMany/updateManyAndReturn/deleteMany

**Files:**
- Create: `packages/example/src/ProPrismaBatchForm/types.ts`
- Create: `packages/example/src/ProPrismaBatchForm/ProPrismaBatchForm.tsx`
- Create: `packages/example/src/ProPrismaBatchForm/Demo.tsx`
- Create: `packages/example/src/ProPrismaBatchForm/index.ts`

- [ ] **Step 1: Create types.ts**

```typescript
import type { CreateFieldConfig } from "../ProPrismaCreateData/types";
import type { WhereValue, FieldConfig as WhereFieldConfig } from "../ProPrismaWhere/types";
import type { SelectFieldConfig, SelectValue } from "../ProPrismaSelect/types";
import { toPrismaWhere } from "../ProPrismaWhere/types";
import { toPrismaSelect } from "../ProPrismaSelect/types";

export type BatchMethod = "createMany" | "createManyAndReturn" | "updateMany" | "updateManyAndReturn" | "deleteMany";

export interface BatchFormValue {
  method: BatchMethod;
  rows: Record<string, unknown>[];
  where: WhereValue;
  select: SelectValue;
  skipDuplicates: boolean;
}

export interface BatchFormFieldConfig {
  createFields: CreateFieldConfig[];
  whereFields: WhereFieldConfig[];
  selectFields: SelectFieldConfig[];
}

export function emptyBatchFormValue(method: BatchMethod = "createMany"): BatchFormValue {
  return {
    method,
    rows: [],
    where: {},
    select: {},
    skipDuplicates: false,
  };
}

export function toPrismaBatchForm(
  value: BatchFormValue,
  fields: BatchFormFieldConfig,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (value.method === "createMany" || value.method === "createManyAndReturn") {
    result.data = value.rows.map((row) => {
      const cleaned: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(row)) {
        if (val !== null && val !== undefined && val !== "") {
          cleaned[key] = val;
        }
      }
      return cleaned;
    });
    if (value.skipDuplicates) {
      result.skipDuplicates = true;
    }
    if (value.method === "createManyAndReturn") {
      const select = toPrismaSelect(value.select, fields.selectFields);
      if (Object.keys(select).length > 0) {
        result.select = select;
      }
    }
  } else {
    const where = toPrismaWhere(value.where, fields.whereFields);
    if (Object.keys(where).length > 0) {
      result.where = where;
    }
    if (value.method !== "deleteMany") {
      result.data = value.rows.map((row) => {
        const cleaned: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(row)) {
          if (val !== null && val !== undefined && val !== "") {
            cleaned[key] = val;
          }
        }
        return cleaned;
      });
    }
    if (value.method === "updateManyAndReturn") {
      const select = toPrismaSelect(value.select, fields.selectFields);
      if (Object.keys(select).length > 0) {
        result.select = select;
      }
    }
  }

  return result;
}
```

- [ ] **Step 2: Create ProPrismaBatchForm.tsx**

```tsx
import { Radio } from "antd";
import { useMemo } from "react";
import { ProPrismaBatchData } from "../ProPrismaBatchData/ProPrismaBatchData";
import { ProPrismaSkipDuplicates } from "../ProPrismaSkipDuplicates/ProPrismaSkipDuplicates";
import { ProPrismaWhere } from "../ProPrismaWhere/ProPrismaWhere";
import { ProPrismaSelect } from "../ProPrismaSelect/ProPrismaSelect";
import {
  toPrismaBatchForm,
  type BatchFormFieldConfig,
  type BatchFormValue,
  type BatchMethod,
  emptyBatchFormValue,
} from "./types";

interface ProPrismaBatchFormProps {
  fields: BatchFormFieldConfig;
  value: BatchFormValue;
  onChange: (value: BatchFormValue) => void;
}

export function ProPrismaBatchForm({ fields, value, onChange }: ProPrismaBatchFormProps) {
  const result = useMemo(() => toPrismaBatchForm(value, fields), [value, fields]);

  const isCreate = value.method === "createMany" || value.method === "createManyAndReturn";
  const isUpdateDelete = !isCreate;
  const hasReturn = value.method === "createManyAndReturn" || value.method === "updateManyAndReturn";
  const isDelete = value.method === "deleteMany";

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Radio.Group
          value={value.method}
          onChange={(e) =>
            onChange({ ...emptyBatchFormValue(e.target.value as BatchMethod), method: e.target.value as BatchMethod })
          }
        >
          <Radio.Button value="createMany">createMany</Radio.Button>
          <Radio.Button value="createManyAndReturn">createManyAndReturn</Radio.Button>
          <Radio.Button value="updateMany">updateMany</Radio.Button>
          <Radio.Button value="updateManyAndReturn">updateManyAndReturn</Radio.Button>
          <Radio.Button value="deleteMany">deleteMany</Radio.Button>
        </Radio.Group>
      </div>

      {isCreate && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>data</h4>
          <ProPrismaBatchData
            fields={{ fields: fields.createFields.map((f) => ({
              name: f.name,
              label: f.label,
              type: "type" in f ? (f.type === "number" ? "number" : f.type === "boolean" ? "boolean" : f.type === "enum" ? "enum" : "string") : "string",
              ...("enums" in f ? { enums: f.enums } : {}),
            })) }}
            value={{ rows: value.rows }}
            onChange={(batchData) => onChange({ ...value, rows: batchData.rows })}
          />
        </div>
      )}

      {isCreate && (
        <div style={{ marginBottom: 16 }}>
          <ProPrismaSkipDuplicates
            value={value.skipDuplicates}
            onChange={(skipDuplicates) => onChange({ ...value, skipDuplicates })}
          />
        </div>
      )}

      {isUpdateDelete && !isDelete && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>data</h4>
          <ProPrismaBatchData
            fields={{ fields: fields.createFields.map((f) => ({
              name: f.name,
              label: f.label,
              type: "type" in f ? (f.type === "number" ? "number" : f.type === "boolean" ? "boolean" : f.type === "enum" ? "enum" : "string") : "string",
              ...("enums" in f ? { enums: f.enums } : {}),
            })) }}
            value={{ rows: value.rows }}
            onChange={(batchData) => onChange({ ...value, rows: batchData.rows })}
          />
        </div>
      )}

      {isUpdateDelete && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>where</h4>
          <ProPrismaWhere
            fields={fields.whereFields}
            value={value.where}
            onChange={(where) => onChange({ ...value, where })}
          />
        </div>
      )}

      {hasReturn && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>select</h4>
          <ProPrismaSelect
            fields={fields.selectFields}
            value={value.select}
            onChange={(select) => onChange({ ...value, select })}
          />
        </div>
      )}

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>
          prisma.user.{value.method}() Output:
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Demo.tsx**

```tsx
import { useState } from "react";
import { ProPrismaBatchForm } from "./ProPrismaBatchForm";
import { emptyBatchFormValue, type BatchFormFieldConfig } from "./types";
import {
  dmmfToCreateFields,
  dmmfToWhereFields,
  dmmfToSelectFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;

const fields: BatchFormFieldConfig = {
  createFields: dmmfToCreateFields(dmmf, "User"),
  whereFields: dmmfToWhereFields(dmmf, "User"),
  selectFields: dmmfToSelectFields(dmmf, "User"),
};

export const ProPrismaBatchFormDemo = () => {
  const [value, setValue] = useState(emptyBatchFormValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Batch Operations Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build batch create, update, and delete calls.
      </p>
      <ProPrismaBatchForm fields={fields} value={value} onChange={setValue} />
    </div>
  );
};
```

- [ ] **Step 4: Create index.ts**

```typescript
export * from "./types";
export * from "./ProPrismaBatchForm";
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```
git add packages/example/src/ProPrismaBatchForm/
git commit -m "feat: add ProPrismaBatchForm — createMany/updateMany/deleteMany builder"
```

---

## Task 6: ProPrismaCountForm — count

**Files:**
- Create: `packages/example/src/ProPrismaCountForm/types.ts`
- Create: `packages/example/src/ProPrismaCountForm/ProPrismaCountForm.tsx`
- Create: `packages/example/src/ProPrismaCountForm/Demo.tsx`
- Create: `packages/example/src/ProPrismaCountForm/index.ts`

- [ ] **Step 1: Create types.ts**

```typescript
import type { WhereValue, FieldConfig as WhereFieldConfig } from "../ProPrismaWhere/types";
import type { OrderByFieldConfig, OrderByValue } from "../ProPrismaOrderBy/types";
import type { PaginationFieldConfig, PaginationValue } from "../ProPrismaPagination/types";
import { toPrismaWhere } from "../ProPrismaWhere/types";
import { toPrismaOrderBy } from "../ProPrismaOrderBy/types";
import { toPrismaPagination } from "../ProPrismaPagination/types";

export interface CountFormValue {
  where: WhereValue;
  orderBy: OrderByValue;
  pagination: PaginationValue;
  selectAll: boolean;
  selectFields: string[];
}

export interface CountFormFieldConfig {
  whereFields: WhereFieldConfig[];
  orderByFields: OrderByFieldConfig[];
  paginationFields: PaginationFieldConfig[];
  allFieldNames: string[];
}

export function emptyCountFormValue(): CountFormValue {
  return {
    where: {},
    orderBy: [],
    pagination: { take: "", skip: "", cursor: { field: "id", value: null } },
    selectAll: true,
    selectFields: [],
  };
}

export function toPrismaCountForm(
  value: CountFormValue,
  _fields: CountFormFieldConfig,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const where = toPrismaWhere(value.where, _fields.whereFields);
  if (Object.keys(where).length > 0) {
    result.where = where;
  }

  const orderBy = toPrismaOrderBy(value.orderBy, _fields.orderByFields);
  if (orderBy.length > 0) {
    result.orderBy = orderBy;
  }

  const pagination = toPrismaPagination(value.pagination, _fields.paginationFields);
  Object.assign(result, pagination);

  if (value.selectAll) {
    result.select = { _all: true };
  } else if (value.selectFields.length > 0) {
    const select: Record<string, boolean> = {};
    for (const f of value.selectFields) {
      select[f] = true;
    }
    result.select = select;
  }

  return result;
}
```

- [ ] **Step 2: Create ProPrismaCountForm.tsx**

```tsx
import { Checkbox, Radio } from "antd";
import { useMemo } from "react";
import { ProPrismaWhere } from "../ProPrismaWhere/ProPrismaWhere";
import { ProPrismaOrderBy } from "../ProPrismaOrderBy/ProPrismaOrderBy";
import { ProPrismaPagination } from "../ProPrismaPagination/ProPrismaPagination";
import {
  toPrismaCountForm,
  type CountFormFieldConfig,
  type CountFormValue,
} from "./types";

interface ProPrismaCountFormProps {
  fields: CountFormFieldConfig;
  value: CountFormValue;
  onChange: (value: CountFormValue) => void;
}

export function ProPrismaCountForm({ fields, value, onChange }: ProPrismaCountFormProps) {
  const result = useMemo(() => toPrismaCountForm(value, fields), [value, fields]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>where</h4>
        <ProPrismaWhere
          fields={fields.whereFields}
          value={value.where}
          onChange={(where) => onChange({ ...value, where })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>orderBy</h4>
        <ProPrismaOrderBy
          fields={fields.orderByFields}
          value={value.orderBy}
          onChange={(orderBy) => onChange({ ...value, orderBy })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>pagination</h4>
        <ProPrismaPagination
          fields={fields.paginationFields}
          value={value.pagination}
          onChange={(pagination) => onChange({ ...value, pagination })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>select</h4>
        <div style={{ marginBottom: 8 }}>
          <Radio.Group
            value={value.selectAll ? "all" : "fields"}
            onChange={(e) => {
              if (e.target.value === "all") {
                onChange({ ...value, selectAll: true, selectFields: [] });
              } else {
                onChange({ ...value, selectAll: false });
              }
            }}
          >
            <Radio value="all">_all (count all records)</Radio>
            <Radio value="fields">Specific fields</Radio>
          </Radio.Group>
        </div>
        {!value.selectAll && (
          <Checkbox.Group
            options={fields.allFieldNames.map((f) => ({ label: f, value: f }))}
            value={value.selectFields}
            onChange={(vals) => onChange({ ...value, selectFields: vals as string[] })}
          />
        )}
      </div>

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>
          prisma.user.count() Output:
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Demo.tsx**

```tsx
import { useState } from "react";
import { ProPrismaCountForm } from "./ProPrismaCountForm";
import { emptyCountFormValue, type CountFormFieldConfig } from "./types";
import {
  dmmfToWhereFields,
  dmmfToOrderByFields,
  dmmfToPaginationFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const model = dmmf.datamodel.models.find((m) => m.name === "User")!;

const fields: CountFormFieldConfig = {
  whereFields: dmmfToWhereFields(dmmf, "User"),
  orderByFields: dmmfToOrderByFields(dmmf, "User"),
  paginationFields: dmmfToPaginationFields(dmmf, "User"),
  allFieldNames: model.fields
    .filter((f) => !f.isReadOnly && f.kind !== "object")
    .map((f) => f.name),
};

export const ProPrismaCountFormDemo = () => {
  const [value, setValue] = useState(emptyCountFormValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma count() Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build a <code>prisma.user.count()</code> call.
      </p>
      <ProPrismaCountForm fields={fields} value={value} onChange={setValue} />
    </div>
  );
};
```

- [ ] **Step 4: Create index.ts**

```typescript
export * from "./types";
export * from "./ProPrismaCountForm";
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```
git add packages/example/src/ProPrismaCountForm/
git commit -m "feat: add ProPrismaCountForm — count builder"
```

---

## Task 7: ProPrismaAggregateForm — aggregate

**Files:**
- Create: `packages/example/src/ProPrismaAggregateForm/types.ts`
- Create: `packages/example/src/ProPrismaAggregateForm/ProPrismaAggregateForm.tsx`
- Create: `packages/example/src/ProPrismaAggregateForm/Demo.tsx`
- Create: `packages/example/src/ProPrismaAggregateForm/index.ts`

- [ ] **Step 1: Create types.ts**

```typescript
import type { WhereValue, FieldConfig as WhereFieldConfig } from "../ProPrismaWhere/types";
import type { OrderByFieldConfig, OrderByValue } from "../ProPrismaOrderBy/types";
import type { PaginationFieldConfig, PaginationValue } from "../ProPrismaPagination/types";
import type { AggregateFieldConfig, AggregateValue } from "../ProPrismaAggregate/types";
import { toPrismaWhere } from "../ProPrismaWhere/types";
import { toPrismaOrderBy } from "../ProPrismaOrderBy/types";
import { toPrismaPagination } from "../ProPrismaPagination/types";
import { toPrismaAggregate } from "../ProPrismaAggregate/types";

export interface AggregateFormValue {
  where: WhereValue;
  orderBy: OrderByValue;
  pagination: PaginationValue;
  aggregate: AggregateValue;
}

export interface AggregateFormFieldConfig {
  whereFields: WhereFieldConfig[];
  orderByFields: OrderByFieldConfig[];
  paginationFields: PaginationFieldConfig[];
  aggregateFields: AggregateFieldConfig[];
}

export function emptyAggregateFormValue(): AggregateFormValue {
  return {
    where: {},
    orderBy: [],
    pagination: { take: "", skip: "", cursor: { field: "id", value: null } },
    aggregate: {},
  };
}

export function toPrismaAggregateForm(
  value: AggregateFormValue,
  fields: AggregateFormFieldConfig,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const where = toPrismaWhere(value.where, fields.whereFields);
  if (Object.keys(where).length > 0) {
    result.where = where;
  }

  const orderBy = toPrismaOrderBy(value.orderBy, fields.orderByFields);
  if (orderBy.length > 0) {
    result.orderBy = orderBy;
  }

  const pagination = toPrismaPagination(value.pagination, fields.paginationFields);
  Object.assign(result, pagination);

  const agg = toPrismaAggregate(value.aggregate, fields.aggregateFields);
  Object.assign(result, agg);

  return result;
}
```

- [ ] **Step 2: Create ProPrismaAggregateForm.tsx**

```tsx
import { useMemo } from "react";
import { ProPrismaWhere } from "../ProPrismaWhere/ProPrismaWhere";
import { ProPrismaOrderBy } from "../ProPrismaOrderBy/ProPrismaOrderBy";
import { ProPrismaPagination } from "../ProPrismaPagination/ProPrismaPagination";
import { ProPrismaAggregate as ProPrismaAggregateFields } from "../ProPrismaAggregate/ProPrismaAggregate";
import {
  toPrismaAggregateForm,
  type AggregateFormFieldConfig,
  type AggregateFormValue,
} from "./types";

interface ProPrismaAggregateFormProps {
  fields: AggregateFormFieldConfig;
  value: AggregateFormValue;
  onChange: (value: AggregateFormValue) => void;
}

export function ProPrismaAggregateForm({ fields, value, onChange }: ProPrismaAggregateFormProps) {
  const result = useMemo(() => toPrismaAggregateForm(value, fields), [value, fields]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>where</h4>
        <ProPrismaWhere
          fields={fields.whereFields}
          value={value.where}
          onChange={(where) => onChange({ ...value, where })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>orderBy</h4>
        <ProPrismaOrderBy
          fields={fields.orderByFields}
          value={value.orderBy}
          onChange={(orderBy) => onChange({ ...value, orderBy })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>pagination</h4>
        <ProPrismaPagination
          fields={fields.paginationFields}
          value={value.pagination}
          onChange={(pagination) => onChange({ ...value, pagination })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>aggregation fields</h4>
        <ProPrismaAggregateFields
          fields={fields.aggregateFields}
          value={value.aggregate}
          onChange={(aggregate) => onChange({ ...value, aggregate })}
        />
      </div>

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>
          prisma.user.aggregate() Output:
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Demo.tsx**

```tsx
import { useState } from "react";
import { ProPrismaAggregateForm } from "./ProPrismaAggregateForm";
import { emptyAggregateFormValue, type AggregateFormFieldConfig } from "./types";
import {
  dmmfToWhereFields,
  dmmfToOrderByFields,
  dmmfToPaginationFields,
  dmmfToAggregateFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;

const fields: AggregateFormFieldConfig = {
  whereFields: dmmfToWhereFields(dmmf, "User"),
  orderByFields: dmmfToOrderByFields(dmmf, "User"),
  paginationFields: dmmfToPaginationFields(dmmf, "User"),
  aggregateFields: dmmfToAggregateFields(dmmf, "User"),
};

export const ProPrismaAggregateFormDemo = () => {
  const [value, setValue] = useState(emptyAggregateFormValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma aggregate() Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build a <code>prisma.user.aggregate()</code> call.
      </p>
      <ProPrismaAggregateForm fields={fields} value={value} onChange={setValue} />
    </div>
  );
};
```

- [ ] **Step 4: Create index.ts**

```typescript
export * from "./types";
export * from "./ProPrismaAggregateForm";
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```
git add packages/example/src/ProPrismaAggregateForm/
git commit -m "feat: add ProPrismaAggregateForm — aggregate builder"
```

---

## Task 8: ProPrismaGroupByForm — groupBy

**Files:**
- Create: `packages/example/src/ProPrismaGroupByForm/types.ts`
- Create: `packages/example/src/ProPrismaGroupByForm/ProPrismaGroupByForm.tsx`
- Create: `packages/example/src/ProPrismaGroupByForm/Demo.tsx`
- Create: `packages/example/src/ProPrismaGroupByForm/index.ts`

- [ ] **Step 1: Create types.ts**

```typescript
import type { WhereValue, FieldConfig as WhereFieldConfig } from "../ProPrismaWhere/types";
import type { OrderByFieldConfig, OrderByValue } from "../ProPrismaOrderBy/types";
import type { PaginationFieldConfig, PaginationValue } from "../ProPrismaPagination/types";
import type { AggregateFieldConfig, AggregateValue } from "../ProPrismaAggregate/types";
import { toPrismaWhere } from "../ProPrismaWhere/types";
import { toPrismaOrderBy } from "../ProPrismaOrderBy/types";
import { toPrismaPagination } from "../ProPrismaPagination/types";
import { toPrismaAggregate } from "../ProPrismaAggregate/types";

export interface GroupByFormValue {
  by: string[];
  where: WhereValue;
  orderBy: OrderByValue;
  pagination: PaginationValue;
  having: string;
  aggregate: AggregateValue;
}

export interface GroupByFormFieldConfig {
  byFieldNames: string[];
  whereFields: WhereFieldConfig[];
  orderByFields: OrderByFieldConfig[];
  paginationFields: PaginationFieldConfig[];
  aggregateFields: AggregateFieldConfig[];
}

export function emptyGroupByFormValue(): GroupByFormValue {
  return {
    by: [],
    where: {},
    orderBy: [],
    pagination: { take: "", skip: "", cursor: { field: "id", value: null } },
    having: "",
    aggregate: {},
  };
}

export function toPrismaGroupByForm(
  value: GroupByFormValue,
  fields: GroupByFormFieldConfig,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (value.by.length > 0) {
    result.by = value.by;
  }

  const where = toPrismaWhere(value.where, fields.whereFields);
  if (Object.keys(where).length > 0) {
    result.where = where;
  }

  const orderBy = toPrismaOrderBy(value.orderBy, fields.orderByFields);
  if (orderBy.length > 0) {
    result.orderBy = orderBy;
  }

  const pagination = toPrismaPagination(value.pagination, fields.paginationFields);
  Object.assign(result, pagination);

  const agg = toPrismaAggregate(value.aggregate, fields.aggregateFields);
  Object.assign(result, agg);

  if (value.having && value.having !== "" && value.having !== "{}") {
    try {
      result.having = JSON.parse(value.having);
    } catch {
      result.having = value.having;
    }
  }

  return result;
}
```

- [ ] **Step 2: Create ProPrismaGroupByForm.tsx**

```tsx
import { Select, Input } from "antd";
import { useMemo } from "react";
import { ProPrismaWhere } from "../ProPrismaWhere/ProPrismaWhere";
import { ProPrismaOrderBy } from "../ProPrismaOrderBy/ProPrismaOrderBy";
import { ProPrismaPagination } from "../ProPrismaPagination/ProPrismaPagination";
import { ProPrismaAggregate as ProPrismaAggregateFields } from "../ProPrismaAggregate/ProPrismaAggregate";
import {
  toPrismaGroupByForm,
  type GroupByFormFieldConfig,
  type GroupByFormValue,
} from "./types";

interface ProPrismaGroupByFormProps {
  fields: GroupByFormFieldConfig;
  value: GroupByFormValue;
  onChange: (value: GroupByFormValue) => void;
}

export function ProPrismaGroupByForm({ fields, value, onChange }: ProPrismaGroupByFormProps) {
  const result = useMemo(() => toPrismaGroupByForm(value, fields), [value, fields]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>by</h4>
        <Select
          mode="multiple"
          style={{ width: "100%" }}
          placeholder="Select fields to group by"
          value={value.by}
          onChange={(by) => onChange({ ...value, by })}
          options={fields.byFieldNames.map((f) => ({ label: f, value: f }))}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>where</h4>
        <ProPrismaWhere
          fields={fields.whereFields}
          value={value.where}
          onChange={(where) => onChange({ ...value, where })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>orderBy</h4>
        <ProPrismaOrderBy
          fields={fields.orderByFields}
          value={value.orderBy}
          onChange={(orderBy) => onChange({ ...value, orderBy })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>pagination</h4>
        <ProPrismaPagination
          fields={fields.paginationFields}
          value={value.pagination}
          onChange={(pagination) => onChange({ ...value, pagination })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>aggregation fields</h4>
        <ProPrismaAggregateFields
          fields={fields.aggregateFields}
          value={value.aggregate}
          onChange={(aggregate) => onChange({ ...value, aggregate })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>having (JSON)</h4>
        <Input.TextArea
          rows={4}
          value={value.having}
          onChange={(e) => onChange({ ...value, having: e.target.value })}
          placeholder='{"some_count": {"gte": 5}}'
          style={{ fontFamily: "monospace", fontSize: 13 }}
        />
      </div>

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>
          prisma.user.groupBy() Output:
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Demo.tsx**

```tsx
import { useState } from "react";
import { ProPrismaGroupByForm } from "./ProPrismaGroupByForm";
import { emptyGroupByFormValue, type GroupByFormFieldConfig } from "./types";
import {
  dmmfToWhereFields,
  dmmfToOrderByFields,
  dmmfToPaginationFields,
  dmmfToAggregateFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const model = dmmf.datamodel.models.find((m) => m.name === "User")!;

const fields: GroupByFormFieldConfig = {
  byFieldNames: model.fields
    .filter((f) => !f.isReadOnly && f.kind !== "object")
    .map((f) => f.name),
  whereFields: dmmfToWhereFields(dmmf, "User"),
  orderByFields: dmmfToOrderByFields(dmmf, "User"),
  paginationFields: dmmfToPaginationFields(dmmf, "User"),
  aggregateFields: dmmfToAggregateFields(dmmf, "User"),
};

export const ProPrismaGroupByFormDemo = () => {
  const [value, setValue] = useState(emptyGroupByFormValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma groupBy() Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build a <code>prisma.user.groupBy()</code> call.
      </p>
      <ProPrismaGroupByForm fields={fields} value={value} onChange={setValue} />
    </div>
  );
};
```

- [ ] **Step 4: Create index.ts**

```typescript
export * from "./types";
export * from "./ProPrismaGroupByForm";
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```
git add packages/example/src/ProPrismaGroupByForm/
git commit -m "feat: add ProPrismaGroupByForm — groupBy builder"
```

---

## Task 9: ProPrismaRawForm + ProPrismaRawFilter — findRaw / aggregateRaw

**Files:**
- Create: `packages/example/src/ProPrismaRawFilter/ProPrismaRawFilter.tsx`
- Create: `packages/example/src/ProPrismaRawFilter/index.ts`
- Create: `packages/example/src/ProPrismaRawForm/types.ts`
- Create: `packages/example/src/ProPrismaRawForm/ProPrismaRawForm.tsx`
- Create: `packages/example/src/ProPrismaRawForm/Demo.tsx`
- Create: `packages/example/src/ProPrismaRawForm/index.ts`

- [ ] **Step 1: Create ProPrismaRawFilter/ProPrismaRawFilter.tsx**

```tsx
import { Input } from "antd";

const { TextArea } = Input;

interface ProPrismaRawFilterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ProPrismaRawFilter({ label, value, onChange }: ProPrismaRawFilterProps) {
  return (
    <div>
      <div style={{ marginBottom: 4, fontWeight: 500, fontSize: 13, color: "#333" }}>{label}</div>
      <TextArea
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter JSON for ${label.toLowerCase()}...`}
        style={{ fontFamily: "monospace", fontSize: 13 }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create ProPrismaRawFilter/index.ts**

```typescript
export * from "./ProPrismaRawFilter";
```

- [ ] **Step 3: Create ProPrismaRawForm/types.ts**

```typescript
export type RawMethod = "findRaw" | "aggregateRaw";

export interface RawFormValue {
  method: RawMethod;
  filter: string;
  pipeline: string;
  options: string;
}

export function emptyRawFormValue(method: RawMethod = "findRaw"): RawFormValue {
  return {
    method,
    filter: "{}",
    pipeline: "[]",
    options: "{}",
  };
}

export function toPrismaRawForm(value: RawFormValue): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (value.method === "findRaw") {
    try {
      const filter = JSON.parse(value.filter);
      result.filter = filter;
    } catch {
      result.filter = value.filter;
    }
  } else {
    try {
      const pipeline = JSON.parse(value.pipeline);
      result.pipeline = pipeline;
    } catch {
      result.pipeline = value.pipeline;
    }
  }

  try {
    const options = JSON.parse(value.options);
    if (Object.keys(options).length > 0) {
      result.options = options;
    }
  } catch {
    // ignore malformed options
  }

  return result;
}
```

- [ ] **Step 4: Create ProPrismaRawForm/ProPrismaRawForm.tsx**

```tsx
import { Radio } from "antd";
import { useMemo } from "react";
import { ProPrismaRawFilter } from "../ProPrismaRawFilter/ProPrismaRawFilter";
import {
  toPrismaRawForm,
  type RawFormValue,
  type RawMethod,
  emptyRawFormValue,
} from "./types";

interface ProPrismaRawFormProps {
  value: RawFormValue;
  onChange: (value: RawFormValue) => void;
}

export function ProPrismaRawForm({ value, onChange }: ProPrismaRawFormProps) {
  const result = useMemo(() => toPrismaRawForm(value), [value]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Radio.Group
          value={value.method}
          onChange={(e) =>
            onChange({ ...emptyRawFormValue(e.target.value as RawMethod), method: e.target.value as RawMethod })
          }
        >
          <Radio.Button value="findRaw">findRaw</Radio.Button>
          <Radio.Button value="aggregateRaw">aggregateRaw</Radio.Button>
        </Radio.Group>
      </div>

      {value.method === "findRaw" && (
        <div style={{ marginBottom: 16 }}>
          <ProPrismaRawFilter
            label="filter"
            value={value.filter}
            onChange={(filter) => onChange({ ...value, filter })}
          />
        </div>
      )}

      {value.method === "aggregateRaw" && (
        <div style={{ marginBottom: 16 }}>
          <ProPrismaRawFilter
            label="pipeline"
            value={value.pipeline}
            onChange={(pipeline) => onChange({ ...value, pipeline })}
          />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <ProPrismaRawFilter
          label="options"
          value={value.options}
          onChange={(options) => onChange({ ...value, options })}
        />
      </div>

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>
          prisma.user.{value.method}() Output:
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create ProPrismaRawForm/Demo.tsx**

```tsx
import { useState } from "react";
import { ProPrismaRawForm } from "./ProPrismaRawForm";
import { emptyRawFormValue, type RawFormValue } from "./types";

export const ProPrismaRawFormDemo = () => {
  const [value, setValue] = useState<RawFormValue>(emptyRawFormValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Raw Operations Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build <code>prisma.$runCommandRaw()</code>-compatible raw queries via <code>findRaw</code> or <code>aggregateRaw</code>.
      </p>
      <ProPrismaRawForm value={value} onChange={setValue} />
    </div>
  );
};
```

- [ ] **Step 6: Create ProPrismaRawForm/index.ts**

```typescript
export * from "./types";
export * from "./ProPrismaRawForm";
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 8: Commit**

```
git add packages/example/src/ProPrismaRawFilter/ packages/example/src/ProPrismaRawForm/
git commit -m "feat: add ProPrismaRawFilter and ProPrismaRawForm — findRaw/aggregateRaw builder"
```

---

## Task 10: Sidebar reorganization

**Files:**
- Modify: `packages/example/src/App.tsx`

- [ ] **Step 1: Rewrite App.tsx sidebar with SubMenu categories**

Replace the flat `items` array with a hierarchical structure using Ant Design Menu's `items` with `type: "group"` and children.

```tsx
import { Layout, Menu } from "antd";
import { useState } from "react";
import { ProPrismaWhereDemo } from "./ProPrismaWhere/Demo";
import { ProPrismaSelectDemo } from "./ProPrismaSelect/Demo";
import { ProPrismaOrderByDemo } from "./ProPrismaOrderBy/Demo";
import { ProPrismaCreateDataDemo } from "./ProPrismaCreateData/Demo";
import { ProPrismaUpdateDataDemo } from "./ProPrismaUpdateData/Demo";
import { ProPrismaIncludeDemo } from "./ProPrismaInclude/Demo";
import { ProPrismaPaginationDemo } from "./ProPrismaPagination/Demo";
import { ProPrismaWhereUniqueDemo } from "./ProPrismaWhereUnique/Demo";
import { ProPrismaUpsertDemo } from "./ProPrismaUpsert/Demo";
import { ProPrismaOmitDemo } from "./ProPrismaOmit/Demo";
import { ProPrismaDistinctDemo } from "./ProPrismaDistinct/Demo";
import { ProPrismaAggregateDemo } from "./ProPrismaAggregate/Demo";
import { ProPrismaGroupByDemo } from "./ProPrismaGroupBy/Demo";
import { ProPrismaCreateDemo } from "./ProPrismaCreate/Demo";
import { ProPrismaFindFormDemo } from "./ProPrismaFindForm/Demo";
import { ProPrismaMutationFormDemo } from "./ProPrismaMutationForm/Demo";
import { ProPrismaBatchFormDemo } from "./ProPrismaBatchForm/Demo";
import { ProPrismaCountFormDemo } from "./ProPrismaCountForm/Demo";
import { ProPrismaAggregateFormDemo } from "./ProPrismaAggregateForm/Demo";
import { ProPrismaGroupByFormDemo } from "./ProPrismaGroupByForm/Demo";
import { ProPrismaRawFormDemo } from "./ProPrismaRawForm/Demo";
import { ProPrismaBatchDataDemo } from "./ProPrismaBatchData/Demo";
import { ProPrismaSkipDuplicatesDemo } from "./ProPrismaSkipDuplicates/Demo";

const { Sider, Content } = Layout;

type MenuItem = {
  key: string;
  label: string;
  children?: MenuItem[];
  type?: "group";
  render?: () => JSX.Element;
};

const demos: Record<string, () => JSX.Element> = {
  findForm: () => <ProPrismaFindFormDemo />,
  create: () => <ProPrismaCreateDemo />,
  mutation: () => <ProPrismaMutationFormDemo />,
  upsert: () => <ProPrismaUpsertDemo />,
  batch: () => <ProPrismaBatchFormDemo />,
  count: () => <ProPrismaCountFormDemo />,
  aggregateForm: () => <ProPrismaAggregateFormDemo />,
  groupByForm: () => <ProPrismaGroupByFormDemo />,
  raw: () => <ProPrismaRawFormDemo />,
  where: () => <ProPrismaWhereDemo />,
  whereUnique: () => <ProPrismaWhereUniqueDemo />,
  select: () => <ProPrismaSelectDemo />,
  include: () => <ProPrismaIncludeDemo />,
  omit: () => <ProPrismaOmitDemo />,
  orderBy: () => <ProPrismaOrderByDemo />,
  pagination: () => <ProPrismaPaginationDemo />,
  distinct: () => <ProPrismaDistinctDemo />,
  createData: () => <ProPrismaCreateDataDemo />,
  updateData: () => <ProPrismaUpdateDataDemo />,
  aggregate: () => <ProPrismaAggregateDemo />,
  groupBy: () => <ProPrismaGroupByDemo />,
  batchData: () => <ProPrismaBatchDataDemo />,
};

const methodItems: MenuItem[] = [
  {
    key: "findForm", label: "findUnique / findFirst / findMany", type: "group",
  },
  { key: "create", label: "create" },
  { key: "mutation", label: "update / delete" },
  { key: "upsert", label: "upsert" },
  { key: "batch", label: "createMany / updateMany / deleteMany" },
  { key: "count", label: "count" },
  { key: "aggregateForm", label: "aggregate" },
  { key: "groupByForm", label: "groupBy" },
  { key: "raw", label: "findRaw / aggregateRaw" },
];

const subComponentItems: MenuItem[] = [
  {
    key: "divider", label: "", type: "group", children: undefined,
  },
  { key: "where", label: "Where" },
  { key: "whereUnique", label: "Where Unique" },
  { key: "select", label: "Select" },
  { key: "include", label: "Include" },
  { key: "omit", label: "Omit" },
  { key: "orderBy", label: "OrderBy" },
  { key: "pagination", label: "Pagination" },
  { key: "distinct", label: "Distinct" },
  { key: "createData", label: "Create Data" },
  { key: "updateData", label: "Update Data" },
  { key: "aggregate", label: "Aggregate (fields)" },
  { key: "groupBy", label: "GroupBy (sub)" },
  { key: "batchData", label: "Batch Data" },
];

const items = [
  { key: "methods", label: "Prisma Methods", type: "group" as const, children: methodItems },
  { key: "menuDivider", type: "divider" as const },
  { key: "subComponents", label: "Sub-Components", type: "group" as const, children: subComponentItems },
];

export const App = () => {
  const [active, setActive] = useState("findForm");

  const findDemo = (key: string): (() => JSX.Element) | null => {
    return demos[key] ?? null;
  };

  const currentDemo = findDemo(active);
  const defaultOpenKeys = ["methods", "subComponents"];

  const flattenItems = (menuItems: MenuItem[]): { key: string; label: string }[] => {
    const result: { key: string; label: string }[] = [];
    for (const item of menuItems) {
      if (item.children) {
        result.push(...flattenItems(item.children));
      } else {
        result.push({ key: item.key, label: item.label });
      }
    }
    return result;
  };

  const allItems = flattenItems([...methodItems, ...subComponentItems.filter(i => i.key !== "divider")]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={220} theme="light">
        <Menu
          mode="inline"
          selectedKeys={[active]}
          defaultOpenKeys={defaultOpenKeys}
          items={[
            {
              key: "methods",
              label: "Prisma Methods",
              type: "group",
              children: methodItems.map(({ key, label }) => ({ key, label })),
            },
            { type: "divider" as const },
            {
              key: "subComponents",
              label: "Sub-Components",
              type: "group",
              children: subComponentItems.filter(i => i.key !== "divider").map(({ key, label }) => ({ key, label })),
            },
          ]}
          onClick={(e) => setActive(e.key as string)}
          style={{ height: "100%", borderRight: 0 }}
        />
      </Sider>
      <Content style={{ padding: "40px 24px", maxWidth: 1000, width: "100%", margin: "0 auto" }}>
        {currentDemo ? currentDemo() : <div>Select a component</div>}
      </Content>
    </Layout>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```
git add packages/example/src/App.tsx
git commit -m "refactor: reorganize sidebar with grouped method forms"
```
