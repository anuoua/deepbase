# Prisma Builder 组件库完善计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补全 Prisma 查询构建器组件库——修复现有组件缺陷 + 新建 9 个组件，覆盖 Prisma Client 完整 API。

**Architecture:** 每个组件遵循现有模式：`types.ts`（字段配置 + `toPrismaXxx` 转换函数）+ `Component.tsx`（UI）+ `Demo.tsx`（演示）+ `index.ts`（导出）。DMMF 转换函数集中在 `ProPrismaSelect/fromDmmf.ts`。所有组件注册到 `App.tsx` 的 Tabs 中。

**Tech Stack:** React 19, Ant Design 6, TypeScript 6, Vite 8, tsdown, vitest (jsdom)

**Codebase conventions:**
- `tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`
- 可选属性用条件展开：`...(cond ? { key: val } : {})`
- `children` 支持惰性加载：`FieldConfig[] | (() => FieldConfig[])`
- 类型检查命令：`npx tsc --noEmit`（在 `packages/example` 目录下）
- 无测试文件，验证靠 `tsc --noEmit` 通过

**Parallelization strategy:**
- Task 1-2（P0 修复）有依赖关系，必须顺序执行
- Task 3-5（P1 新组件）互相独立，可并行派发 3 个 subagent
- Task 6-8（P2 组件）互相独立，可并行派发 3 个 subagent（Task 8 依赖 Task 3-5 完成）
- Task 9-10（P3 组件）互相独立，可并行派发 2 个 subagent
- Task 11-13（P3 现有组件增强）互相独立，可并行派发 3 个 subagent
- Task 14-15（集成）必须在所有组件完成后执行
- Task 16（最终验证）最后执行

---

## Task 1: 修复 ProPrismaWhere — NOT 运算符 + isSet 位置 + null 值处理

**Files:**
- Modify: `packages/example/src/ProPrismaWhere/types.ts`
- Modify: `packages/example/src/ProPrismaWhere/ProPrismaWhere.tsx`

### 背景

当前 `ProPrismaWhere` 有三个问题：

1. **缺 `NOT` 逻辑运算符**：`WhereGroup.type` 只有 `"AND" | "OR"`。Prisma 支持 `NOT: { ... }`（单个条件）和 `NOT: [{ ... }, { ... }]`（数组）。NOT 的语义是：对内部条件取反。输出格式：`{ NOT: <condition> }` 或 `{ NOT: [<conditions>] }`。

2. **`isSet` 放错位置**：当前在 `SCALAR_LIST_OPERATORS` 中，但 Prisma 的 `isSet` 是给**可选标量字段**用的（`where: { middleName: { isSet: true } }`），不是给列表字段。应从 `SCALAR_LIST_OPERATORS` 移除，添加到所有标量类型的操作符列表中。

3. **`null` 值被跳过**：`toPrismaWhere` 中 `if (value === null || value === "") return {}` 会跳过 null 值。但 Prisma 中 `where: { deletedAt: null }` 表示"字段为 null"，是有效过滤条件。应区分"用户未输入"（空字符串）和"用户选择 null 值"。

### Step 1: 修改 `types.ts` — WhereGroup 支持 NOT

在 `types.ts` 中，将 `WhereGroup.type` 扩展为支持 `"NOT"`：

```typescript
export interface WhereGroup {
  type: "AND" | "OR" | "NOT";
  children: (WhereCondition | WhereGroup)[];
}
```

修改 `nodeToPrisma` 函数中处理 group 的部分，支持 NOT 输出：

```typescript
function nodeToPrisma(node: WhereNode, fields: FieldConfig[]): Record<string, unknown> {
  if ("children" in node) {
    const conditions = node.children
      .map((child) => nodeToPrisma(child, fields))
      .filter((c): c is Record<string, unknown> => Object.keys(c).length > 0);
    if (conditions.length === 0) return {};
    if (node.type === "NOT") {
      if (conditions.length === 1) return { NOT: conditions[0]! };
      return { NOT: conditions };
    }
    if (conditions.length === 1) return conditions[0]!;
    return { [node.type]: conditions };
  }
  // ... rest unchanged
```

- [ ] 完成

### Step 2: 修改 `types.ts` — 移动 isSet

从 `SCALAR_LIST_OPERATORS` 中移除 `isSet`：

```typescript
export const SCALAR_LIST_OPERATORS: { label: string; value: string }[] = [
  { label: "has", value: "has" },
  { label: "hasEvery", value: "hasEvery" },
  { label: "hasSome", value: "hasSome" },
  { label: "isEmpty", value: "isEmpty" },
  { label: "equals", value: "equals" },
];
```

创建一个新的常量数组，用于可选标量字段的 `isSet` 操作符：

```typescript
export const OPTIONAL_SCALAR_OPERATORS: { label: string; value: string }[] = [
  { label: "isSet", value: "isSet" },
];
```

在 `getOperatorsByType` 中，对标量字段（非列表、非关系）追加 `isSet`（如果字段是可选的）。需要先在 `FieldConfig` 中添加 `isRequired` 字段：

```typescript
export interface FieldConfig {
  name: string;
  label: string;
  type?: FieldType;
  enums?: { label: string; value: string | number }[];
  isList?: boolean;
  isRequired?: boolean;
  children?: FieldConfig[] | (() => FieldConfig[]);
}
```

在 `getOperatorsByType` 函数末尾，对非列表标量字段，如果 `field.isRequired === false`，追加 `OPTIONAL_SCALAR_OPERATORS`：

```typescript
export function getOperatorsByType(field: FieldConfig): { label: string; value: string }[] {
  if (hasChildren(field)) {
    return field.isList === false ? TO_ONE_OPERATORS : TO_MANY_OPERATORS;
  }
  if (isScalarList(field)) {
    return SCALAR_LIST_OPERATORS;
  }
  let ops: { label: string; value: string }[];
  switch (field.type) {
    case "string":
      ops = STRING_OPERATORS;
      break;
    case "number":
      ops = NUMBER_OPERATORS;
      break;
    case "boolean":
      ops = BOOLEAN_OPERATORS;
      break;
    case "date":
      ops = DATE_OPERATORS;
      break;
    case "enum":
      ops = ENUM_OPERATORS;
      break;
    default:
      ops = STRING_OPERATORS;
  }
  if (field.isRequired === false) {
    ops = [...ops, ...OPTIONAL_SCALAR_OPERATORS];
  }
  return ops;
}
```

- [ ] 完成

### Step 3: 修改 `types.ts` — null 值处理

在 `nodeToPrisma` 中，修改 value 为 null 时的处理。区分 `equals` 操作符的 null 值（有效）和空字符串（无效）：

```typescript
  const value = node.value;
  if (value === undefined || value === "") return {};

  // isSet 操作符：布尔值
  if (node.operator === "isSet") {
    return { [node.field]: { isSet: Boolean(value) } };
  }

  // null 值在 equals/not 操作符下是有效的过滤条件
  if (value === null) {
    if (node.operator === "equals" || node.operator === "not") {
      return { [node.field]: { [node.operator]: null } };
    }
    return {};
  }
```

同时从 `isScalarList` 分支中移除 `isSet` 的处理（已在上方统一处理）：

```typescript
  if (isScalarList(fieldConfig)) {
    if (node.operator === "isEmpty") {
      return { [node.field]: { isEmpty: Boolean(value) } };
    }
    if (node.operator === "equals") {
      if (!Array.isArray(value) || value.length === 0) return {};
      return { [node.field]: { equals: value } };
    }
  }
```

- [ ] 完成

### Step 4: 修改 `ProPrismaWhere.tsx` — UI 支持 NOT group

在 `WhereGroupEditor` 中，将 toggleType 从二选一改为三选一：

```typescript
function WhereGroupEditor({ depth, fields, group, onChange, provider }: WhereGroupEditorProps) {
  const toggleType = useCallback(() => {
    const next = group.type === "AND" ? "OR" : group.type === "OR" ? "NOT" : "AND";
    onChange({ ...group, type: next });
  }, [group, onChange]);
  // ...
```

修改 Tag 显示：

```typescript
        <Tag
          color={group.type === "AND" ? "blue" : group.type === "OR" ? "green" : "red"}
          style={{ cursor: "pointer", fontWeight: 600 }}
          onClick={toggleType}
        >
          {group.type}
        </Tag>
```

修改 `nodeToPrisma` 调用中的 group 输出（已在 Step 1 中修改 types.ts，此处无需额外改动）。

在 `ValueInput` 中，为 `isSet` 操作符添加布尔值输入（与 `isEmpty` 相同）：

```typescript
  if (operator === "isEmpty" || operator === "isSet") {
    return (
      <Select
        allowClear
        options={[
          { label: "true", value: true },
          { label: "false", value: false },
        ]}
        placeholder="Select"
        style={{ minWidth: 120 }}
        value={value !== undefined ? (value as boolean) : undefined}
        onChange={onChange}
      />
    );
  }
```

- [ ] 完成

### Step 5: 更新 `fromDmmf.ts` — dmmfToWhereFields 传递 isRequired

在 `dmmfToWhereFields` 中，为标量字段添加 `isRequired`：

```typescript
    } else {
      result.push({
        name: field.name,
        label: prettify(field.name),
        type: dmmfTypeToFieldType(field.type),
        isRequired: field.isRequired,
        ...(field.isList ? { isList: true } : {}),
      });
    }
```

- [ ] 完成

### Step 6: 验证

```bash
cd packages/example && npx tsc --noEmit
```

预期：无错误。

- [ ] 完成

### Step 7: Commit

```bash
git add packages/example/src/ProPrismaWhere/ packages/example/src/ProPrismaSelect/fromDmmf.ts
git commit -m "fix(ProPrismaWhere): add NOT operator, fix isSet placement, fix null value handling"
```

- [ ] 完成

---

## Task 2: 修复 ProPrismaUpdateData — 原子操作

**Files:**
- Modify: `packages/example/src/ProPrismaCreateData/types.ts`（添加 `isAtomic` 到 `CreateFieldConfig`）
- Modify: `packages/example/src/ProPrismaUpdateData/types.ts`
- Modify: `packages/example/src/ProPrismaUpdateData/ProPrismaUpdateData.tsx`

### 背景

Prisma 的 update 操作支持对数字字段进行原子操作：`{ increment: 1 }`、`{ decrement: 1 }`、`{ multiply: 2 }`、`{ divide: 2 }`、`{ set: 5 }`。当前 `ProPrismaUpdateData` 只支持直接赋值。

### Step 1: 修改 `types.ts` — toPrismaUpdateData 支持原子操作

在 `toPrismaUpdateData` 的标量字段处理分支中，检查 value 是否为原子操作对象：

```typescript
    } else if (isScalarList(field)) {
      if (Array.isArray(val) && val.length > 0) {
        result[field.name] = val;
      }
    } else {
      // 原子操作：{ _atomic: "increment", _value: 1 }
      if (val && typeof val === "object" && "_atomic" in val) {
        const r = val as { _atomic: string; _value: number };
        const numVal = Number(r._value);
        if (!isNaN(numVal)) {
          result[field.name] = { [r._atomic]: numVal };
        }
      } else {
        result[field.name] = val;
      }
    }
```

- [ ] 完成

### Step 2: 修改 `ProPrismaUpdateData.tsx` — 数字字段支持原子操作模式

在 `UpdateFieldInput` 中，对 `number` 类型的字段，添加一个 Segmented 切换："直接赋值" vs "原子操作"。当选择原子操作时，显示操作类型选择器 + 数值输入：

```tsx
function UpdateFieldInput({
  field,
  value,
  onChange,
}: {
  field: UpdateFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  // ... isScalarList, enum 分支不变 ...

  // number 类型：支持原子操作
  if (field.type === "number") {
    const isAtomic = value && typeof value === "object" && "_atomic" in value;
    const r = isAtomic ? (value as { _atomic: string; _value: number }) : null;

    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
        <Segmented
          size="small"
          options={[
            { label: "Set", value: "set" },
            { label: "Atomic", value: "atomic" },
          ]}
          value={isAtomic ? "atomic" : "set"}
          onChange={(v) => {
            if (v === "atomic") {
              onChange({ _atomic: "increment", _value: 1 });
            } else {
              onChange(null);
            }
          }}
        />
        {isAtomic ? (
          <>
            <Select
              size="small"
              style={{ minWidth: 120 }}
              options={[
                { label: "increment", value: "increment" },
                { label: "decrement", value: "decrement" },
                { label: "multiply", value: "multiply" },
                { label: "divide", value: "divide" },
              ]}
              value={r?._atomic ?? "increment"}
              onChange={(v) => onChange({ _atomic: v, _value: r?._value ?? 1 })}
            />
            <InputNumber
              size="small"
              style={{ minWidth: 100 }}
              value={r?._value ?? null}
              onChange={(v) => onChange({ _atomic: r?._atomic ?? "increment", _value: v ?? 0 })}
            />
          </>
        ) : (
          <InputNumber
            placeholder={`Enter ${field.label.toLowerCase()}`}
            style={{ minWidth: 200, flex: 1 }}
            value={(value as number) ?? null}
            onChange={(v) => onChange(v)}
          />
        )}
      </div>
    );
  }

  // ... string, boolean, date, default 分支不变 ...
```

- [ ] 完成

### Step 3: 验证

```bash
cd packages/example && npx tsc --noEmit
```

预期：无错误。

- [ ] 完成

### Step 4: Commit

```bash
git add packages/example/src/ProPrismaUpdateData/ packages/example/src/ProPrismaCreateData/types.ts
git commit -m "feat(ProPrismaUpdateData): add atomic operations (increment/decrement/multiply/divide/set)"
```

- [ ] 完成

---

## Task 3: 新建 ProPrismaInclude 组件

**Files:**
- Create: `packages/example/src/ProPrismaInclude/types.ts`
- Create: `packages/example/src/ProPrismaInclude/ProPrismaInclude.tsx`
- Create: `packages/example/src/ProPrismaInclude/Demo.tsx`
- Create: `packages/example/src/ProPrismaInclude/index.ts`
- Modify: `packages/example/src/ProPrismaSelect/fromDmmf.ts`

### 背景

Prisma 的 `include` 与 `select` 互斥。`include` 加载全部标量字段 + 指定关系。关系可以嵌套 `where`、`orderBy`、`take`、`skip`、`select`、`include`。

示例输出：
```json
{
  "posts": {
    "where": { "published": true },
    "orderBy": { "createdAt": "desc" },
    "take": 5
  },
  "profile": true,
  "_count": { "select": { "posts": true } }
}
```

### Step 1: 创建 `types.ts`

```typescript
import type { WhereGroup, FieldConfig } from "../ProPrismaWhere/types";
import type { OrderByValue } from "../ProPrismaOrderBy/types";

export interface IncludeFieldConfig {
  name: string;
  label: string;
  isList?: boolean;
  children?: IncludeFieldConfig[] | (() => IncludeFieldConfig[]);
}

export function resolveChildren(field: IncludeFieldConfig): IncludeFieldConfig[] {
  const c = field.children;
  return typeof c === "function" ? c() : c ?? [];
}

export function hasChildren(field: IncludeFieldConfig): boolean {
  return !!field.children;
}

export interface IncludeRelationOptions {
  where?: WhereGroup;
  orderBy?: OrderByValue;
  take?: number;
  skip?: number;
  include?: IncludeValue;
}

export interface IncludeCountSelect {
  [relationName: string]: boolean | { where?: WhereGroup };
}

export type IncludeValue = {
  [fieldName: string]: boolean | IncludeRelationOptions;
  _count?: boolean | { select: IncludeCountSelect };
};

export function toPrismaInclude(
  value: IncludeValue,
  fields: IncludeFieldConfig[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    if (!hasChildren(field)) continue;

    const val = value[field.name];
    if (val === true) {
      result[field.name] = true;
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      const opts = val as IncludeRelationOptions;
      const nested: Record<string, unknown> = {};

      if (opts.where) {
        const { toPrismaWhere } = require("../ProPrismaWhere/types");
        const whereResult = toPrismaWhere(opts.where, []);
        if (Object.keys(whereResult).length > 0) {
          nested.where = whereResult;
        }
      }

      if (opts.orderBy && Array.isArray(opts.orderBy) && opts.orderBy.length > 0) {
        const { toPrismaOrderBy } = require("../ProPrismaOrderBy/types");
        nested.orderBy = toPrismaOrderBy(opts.orderBy, []);
      }

      if (opts.take !== undefined && opts.take !== null) {
        nested.take = opts.take;
      }
      if (opts.skip !== undefined && opts.skip !== null) {
        nested.skip = opts.skip;
      }

      if (opts.include) {
        const nestedInclude = toPrismaInclude(opts.include, resolveChildren(field));
        if (Object.keys(nestedInclude).length > 0) {
          nested.include = nestedInclude;
        }
      }

      if (Object.keys(nested).length > 0) {
        result[field.name] = nested;
      } else {
        result[field.name] = true;
      }
    }
  }

  // Handle _count
  if (value._count) {
    if (value._count === true) {
      result._count = true;
    } else if (typeof value._count === "object" && "select" in value._count) {
      result._count = { select: value._count.select };
    }
  }

  return result;
}

export function emptyIncludeValue(fields: IncludeFieldConfig[]): IncludeValue {
  return {};
}
```

注意：`require` 在 ESM 中不可用。实际实现应使用静态 import：

```typescript
import { toPrismaWhere, type WhereGroup, type FieldConfig } from "../ProPrismaWhere/types";
import { toPrismaOrderBy, type OrderByValue, type OrderByFieldConfig } from "../ProPrismaOrderBy/types";
```

但 `toPrismaWhere` 需要 `FieldConfig[]`（Where 的字段配置），而 Include 中嵌套的 where 需要用关系模型的字段。这需要从 DMMF 生成 Where 字段配置并传递。

简化方案：`IncludeRelationOptions` 中的 `where` 和 `orderBy` 直接存储用户构建好的 Prisma 对象（由 ProPrismaWhere / ProPrismaOrderBy 组件输出），而非内部状态。`toPrismaInclude` 只做透传：

```typescript
export interface IncludeRelationOptions {
  where?: Record<string, unknown>;
  orderBy?: Record<string, unknown>[];
  take?: number;
  skip?: number;
  include?: IncludeValue;
}
```

- [ ] 完成

### Step 2: 创建 `ProPrismaInclude.tsx`

使用 antd `Tree` 组件（checkable），与 `ProPrismaSelect` 类似但只显示关系字段。勾选关系后展开配置面板（where / orderBy / take / skip）。

核心结构：
- Tree 只展示 `hasChildren(field)` 的字段（即关系字段）
- 勾选关系 → `value[field.name] = true`
- 展开关系 → 显示配置面板，可嵌入 `ProPrismaWhere`（传关系模型字段）和 `ProPrismaOrderBy` + `take`/`skip` InputNumber
- 底部显示 `_count` 配置（多选关系名称）
- 底部显示 Prisma include JSON 输出

```typescript
import { Tree, InputNumber, Checkbox, Collapse } from "antd";
import type { TreeDataNode } from "antd";
import { useCallback, useMemo, useState, useRef } from "react";
import {
  hasChildren,
  resolveChildren,
  type IncludeFieldConfig,
  type IncludeValue,
  type IncludeRelationOptions,
  toPrismaInclude,
} from "./types";

interface ProPrismaIncludeProps {
  fields: IncludeFieldConfig[];
  value: IncludeValue;
  onChange: (value: IncludeValue) => void;
}

// ... 实现 buildTreeData, valueToCheckedKeys, checkedKeysToValue 等
// 类似 ProPrismaSelect 的 Tree 模式，但只展示关系字段
// 勾选关系后展开 Where/OrderBy/take/skip 配置面板
```

- [ ] 完成

### Step 3: 创建 `Demo.tsx`

```typescript
import { useState } from "react";
import { ProPrismaInclude } from "./ProPrismaInclude";
import { toPrismaInclude, type IncludeValue } from "./types";
import { dmmfToIncludeFields, type DmmfDocument } from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userIncludeFields = dmmfToIncludeFields(dmmf, "User");

export const ProPrismaIncludeDemo = () => {
  const [include, setInclude] = useState<IncludeValue>({});
  console.log("Prisma include:", JSON.stringify(toPrismaInclude(include, userIncludeFields), null, 2));
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Include Builder</h1>
      <ProPrismaInclude fields={userIncludeFields} value={include} onChange={setInclude} />
    </div>
  );
};
```

- [ ] 完成

### Step 4: 创建 `index.ts`

```typescript
export * from "./types";
export * from "./ProPrismaInclude";
```

- [ ] 完成

### Step 5: 更新 `fromDmmf.ts` — 添加 dmmfToIncludeFields

```typescript
import type { IncludeFieldConfig } from "../ProPrismaInclude/types";

export function dmmfToIncludeFields(
  document: DmmfDocument,
  modelName: string,
): IncludeFieldConfig[] {
  const model = document.datamodel.models.find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Model "${modelName}" not found in DMMF document`);
  }

  const result: IncludeFieldConfig[] = [];

  for (const field of model.fields) {
    if (field.isReadOnly) continue;

    if (field.kind === "object") {
      result.push({
        name: field.name,
        label: prettify(field.name),
        isList: field.isList,
        children: () => dmmfToIncludeFields(document, field.type),
      });
    }
  }

  return result;
}
```

- [ ] 完成

### Step 6: 验证

```bash
cd packages/example && npx tsc --noEmit
```

- [ ] 完成

### Step 7: Commit

```bash
git add packages/example/src/ProPrismaInclude/ packages/example/src/ProPrismaSelect/fromDmmf.ts
git commit -m "feat: add ProPrismaInclude component"
```

- [ ] 完成

---

## Task 4: 新建 ProPrismaPagination 组件

**Files:**
- Create: `packages/example/src/ProPrismaPagination/types.ts`
- Create: `packages/example/src/ProPrismaPagination/ProPrismaPagination.tsx`
- Create: `packages/example/src/ProPrismaPagination/Demo.tsx`
- Create: `packages/example/src/ProPrismaPagination/index.ts`

### 背景

Prisma 分页选项：`take`（数量，负数表示反向）、`skip`（偏移量）、`cursor`（基于唯一字段）。

示例输出：
```json
{ "take": 10, "skip": 0 }
{ "take": 10, "skip": 1, "cursor": { "id": 5 } }
```

### Step 1: 创建 `types.ts`

```typescript
export interface PaginationFieldConfig {
  name: string;
  label: string;
}

export interface PaginationValue {
  take?: number;
  skip?: number;
  cursorField?: string;
  cursorValue?: string | number;
}

export function toPrismaPagination(
  value: PaginationValue,
  fields: PaginationFieldConfig[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (value.take !== undefined && value.take !== null) {
    result.take = value.take;
  }
  if (value.skip !== undefined && value.skip !== null) {
    result.skip = value.skip;
  }
  if (value.cursorField && value.cursorValue !== undefined && value.cursorValue !== null && value.cursorValue !== "") {
    const fieldConfig = fields.find((f) => f.name === value.cursorField);
    if (fieldConfig) {
      const numVal = Number(value.cursorValue);
      result.cursor = {
        [value.cursorField]: isNaN(numVal) ? value.cursorValue : numVal,
      };
    }
  }

  return result;
}

export function emptyPaginationValue(): PaginationValue {
  return {};
}
```

- [ ] 完成

### Step 2: 创建 `ProPrismaPagination.tsx`

```typescript
import { InputNumber, Select } from "antd";
import { useMemo } from "react";
import { toPrismaPagination, type PaginationFieldConfig, type PaginationValue } from "./types";

interface ProPrismaPaginationProps {
  fields: PaginationFieldConfig[];
  value: PaginationValue;
  onChange: (value: PaginationValue) => void;
}

export function ProPrismaPagination({ fields, value, onChange }: ProPrismaPaginationProps) {
  const result = useMemo(() => toPrismaPagination(value, fields), [value, fields]);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>take</label>
          <InputNumber
            placeholder="Limit"
            value={value.take ?? null}
            onChange={(v) => onChange({ ...value, take: v ?? undefined })}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>skip</label>
          <InputNumber
            placeholder="Offset"
            min={0}
            value={value.skip ?? null}
            onChange={(v) => onChange({ ...value, skip: v ?? undefined })}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>cursor field</label>
          <Select
            allowClear
            placeholder="Select unique field"
            style={{ minWidth: 150 }}
            options={fields.map((f) => ({ label: f.label, value: f.name }))}
            value={value.cursorField || undefined}
            onChange={(v) => onChange({ ...value, cursorField: v ?? undefined, cursorValue: undefined })}
          />
        </div>
        {value.cursorField && (
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>cursor value</label>
            <InputNumber
              placeholder="Cursor value"
              style={{ minWidth: 150 }}
              value={(value.cursorValue as number) ?? null}
              onChange={(v) => onChange({ ...value, cursorValue: v ?? undefined })}
            />
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>Prisma Pagination Output:</div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

- [ ] 完成

### Step 3: 创建 `Demo.tsx`

```typescript
import { useState } from "react";
import { ProPrismaPagination } from "./ProPrismaPagination";
import { toPrismaPagination, type PaginationValue } from "./types";
import { dmmfToUniqueFields, type DmmfDocument } from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userUniqueFields = dmmfToUniqueFields(dmmf, "User");

export const ProPrismaPaginationDemo = () => {
  const [pagination, setPagination] = useState<PaginationValue>({ take: 10, skip: 0 });
  console.log("Prisma pagination:", JSON.stringify(toPrismaPagination(pagination, userUniqueFields), null, 2));
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Pagination Builder</h1>
      <ProPrismaPagination fields={userUniqueFields} value={pagination} onChange={setPagination} />
    </div>
  );
};
```

- [ ] 完成

### Step 4: 创建 `index.ts`

```typescript
export * from "./types";
export * from "./ProPrismaPagination";
```

- [ ] 完成

### Step 5: 验证

```bash
cd packages/example && npx tsc --noEmit
```

- [ ] 完成

### Step 6: Commit

```bash
git add packages/example/src/ProPrismaPagination/
git commit -m "feat: add ProPrismaPagination component"
```

- [ ] 完成

---

## Task 5: 新建 ProPrismaWhereUnique 组件

**Files:**
- Create: `packages/example/src/ProPrismaWhereUnique/types.ts`
- Create: `packages/example/src/ProPrismaWhereUnique/ProPrismaWhereUnique.tsx`
- Create: `packages/example/src/ProPrismaWhereUnique/Demo.tsx`
- Create: `packages/example/src/ProPrismaWhereUnique/index.ts`
- Modify: `packages/example/src/ProPrismaSelect/fromDmmf.ts`

### 背景

`findUnique`/`update`/`delete`/`upsert` 的 `where` 只能用唯一标识符：`id`、`@unique` 字段、或 `@@unique` 复合键。

示例输出：
```json
{ "id": 1 }
{ "email": "alice@prisma.io" }
{ "firstName_lastName": { "firstName": "Alice", "lastName": "Smith" } }
```

### Step 1: 创建 `types.ts`

```typescript
export interface UniqueFieldConfig {
  name: string;
  label: string;
  type: "string" | "number";
  isCompound?: boolean;
  fields?: { name: string; label: string; type: "string" | "number" }[];
}

export interface WhereUniqueValue {
  field: string;
  value?: string | number;
  compoundValues?: Record<string, string | number>;
}

export function toPrismaWhereUnique(
  value: WhereUniqueValue,
  fields: UniqueFieldConfig[],
): Record<string, unknown> {
  const fieldConfig = fields.find((f) => f.name === value.field);
  if (!fieldConfig) return {};

  if (fieldConfig.isCompound && fieldConfig.fields) {
    const compound: Record<string, unknown> = {};
    let hasAll = true;
    for (const subField of fieldConfig.fields) {
      const v = value.compoundValues?.[subField.name];
      if (v === undefined || v === null || v === "") {
        hasAll = false;
        break;
      }
      const numVal = Number(v);
      compound[subField.name] = isNaN(numVal) ? v : numVal;
    }
    if (!hasAll) return {};
    return { [fieldConfig.name]: compound };
  }

  if (value.value === undefined || value.value === null || value.value === "") return {};
  const numVal = Number(value.value);
  return { [fieldConfig.name]: isNaN(numVal) ? value.value : numVal };
}

export function emptyWhereUniqueValue(fields: UniqueFieldConfig[]): WhereUniqueValue {
  return { field: fields[0]?.name ?? "" };
}
```

- [ ] 完成

### Step 2: 创建 `ProPrismaWhereUnique.tsx`

```typescript
import { Input, InputNumber, Select } from "antd";
import { useMemo } from "react";
import { toPrismaWhereUnique, type UniqueFieldConfig, type WhereUniqueValue } from "./types";

interface ProPrismaWhereUniqueProps {
  fields: UniqueFieldConfig[];
  value: WhereUniqueValue;
  onChange: (value: WhereUniqueValue) => void;
}

export function ProPrismaWhereUnique({ fields, value, onChange }: ProPrismaWhereUniqueProps) {
  const result = useMemo(() => toPrismaWhereUnique(value, fields), [value, fields]);
  const fieldConfig = fields.find((f) => f.name === value.field);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <Select
          allowClear={false}
          placeholder="Select unique field"
          style={{ minWidth: 200 }}
          options={fields.map((f) => ({ label: f.label, value: f.name }))}
          value={value.field || undefined}
          onChange={(v) => onChange({ field: v })}
        />

        {fieldConfig && !fieldConfig.isCompound && (
          fieldConfig.type === "number" ? (
            <InputNumber
              placeholder="Value"
              style={{ minWidth: 200 }}
              value={(value.value as number) ?? null}
              onChange={(v) => onChange({ ...value, value: v ?? undefined })}
            />
          ) : (
            <Input
              placeholder="Value"
              style={{ minWidth: 200 }}
              value={(value.value as string) ?? ""}
              onChange={(e) => onChange({ ...value, value: e.target.value || undefined })}
            />
          )
        )}
      </div>

      {fieldConfig?.isCompound && fieldConfig.fields && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {fieldConfig.fields.map((subField) => (
            <div key={subField.name} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ minWidth: 120, fontWeight: 500, fontSize: 13 }}>{subField.label}</span>
              {subField.type === "number" ? (
                <InputNumber
                  placeholder="Value"
                  style={{ minWidth: 200 }}
                  value={(value.compoundValues?.[subField.name] as number) ?? null}
                  onChange={(v) =>
                    onChange({ ...value, compoundValues: { ...value.compoundValues, [subField.name]: v ?? undefined } })
                  }
                />
              ) : (
                <Input
                  placeholder="Value"
                  style={{ minWidth: 200 }}
                  value={(value.compoundValues?.[subField.name] as string) ?? ""}
                  onChange={(e) =>
                    onChange({ ...value, compoundValues: { ...value.compoundValues, [subField.name]: e.target.value || undefined } })
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>Prisma WhereUnique Output:</div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

- [ ] 完成

### Step 3: 创建 `Demo.tsx`

```typescript
import { useState } from "react";
import { ProPrismaWhereUnique } from "./ProPrismaWhereUnique";
import { toPrismaWhereUnique, type WhereUniqueValue } from "./types";
import { dmmfToUniqueFields, type DmmfDocument } from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userUniqueFields = dmmfToUniqueFields(dmmf, "User");

export const ProPrismaWhereUniqueDemo = () => {
  const [where, setWhere] = useState<WhereUniqueValue>({ field: "id" });
  console.log("Prisma whereUnique:", JSON.stringify(toPrismaWhereUnique(where, userUniqueFields), null, 2));
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma WhereUnique Builder</h1>
      <ProPrismaWhereUnique fields={userUniqueFields} value={where} onChange={setWhere} />
    </div>
  );
};
```

- [ ] 完成

### Step 4: 创建 `index.ts`

```typescript
export * from "./types";
export * from "./ProPrismaWhereUnique";
```

- [ ] 完成

### Step 5: 更新 `fromDmmf.ts` — 添加 dmmfToUniqueFields 和 dmmfToPaginationFields

```typescript
import type { UniqueFieldConfig } from "../ProPrismaWhereUnique/types";
import type { PaginationFieldConfig } from "../ProPrismaPagination/types";

export function dmmfToUniqueFields(
  document: DmmfDocument,
  modelName: string,
): UniqueFieldConfig[] {
  const model = document.datamodel.models.find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Model "${modelName}" not found in DMMF document`);
  }

  const result: UniqueFieldConfig[] = [];

  for (const field of model.fields) {
    if (field.isReadOnly) continue;
    if (field.kind !== "scalar" && field.kind !== "enum") continue;

    // id 字段和 @unique 字段（DMMF 中 isId 标记 id 字段）
    // 注意：DMMF.json 中需要检查 field 的 isUnique 属性
    // 简化：id 字段一定是唯一的，其他 @unique 字段需要从 DMMF 获取
    const isUnique = (field as DmmfField & { isUnique?: boolean; isId?: boolean }).isId || (field as DmmfField & { isUnique?: boolean }).isUnique;
    if (!isUnique) continue;

    const fieldType = dmmfTypeToFieldType(field.type);
    result.push({
      name: field.name,
      label: prettify(field.name),
      type: fieldType === "number" ? "number" : "string",
    });
  }

  return result;
}

export function dmmfToPaginationFields(
  document: DmmfDocument,
  modelName: string,
): PaginationFieldConfig[] {
  return dmmfToUniqueFields(document, modelName).map((f) => ({
    name: f.name,
    label: f.label,
  }));
}
```

需要在 `DmmfField` 接口中添加 `isId` 和 `isUnique` 属性：

```typescript
export interface DmmfField {
  name: string;
  kind: "scalar" | "object" | "enum" | "unsupported";
  type: string;
  isRequired: boolean;
  isList: boolean;
  isReadOnly: boolean;
  isId?: boolean;
  isUnique?: boolean;
  relationName?: string;
}
```

- [ ] 完成

### Step 6: 验证

```bash
cd packages/example && npx tsc --noEmit
```

- [ ] 完成

### Step 7: Commit

```bash
git add packages/example/src/ProPrismaWhereUnique/ packages/example/src/ProPrismaPagination/ packages/example/src/ProPrismaSelect/fromDmmf.ts
git commit -m "feat: add ProPrismaWhereUnique and ProPrismaPagination components"
```

- [ ] 完成

---

## Task 6: 新建 ProPrismaUpsert 组件

**Files:**
- Create: `packages/example/src/ProPrismaUpsert/types.ts`
- Create: `packages/example/src/ProPrismaUpsert/ProPrismaUpsert.tsx`
- Create: `packages/example/src/ProPrismaUpsert/Demo.tsx`
- Create: `packages/example/src/ProPrismaUpsert/index.ts`

### 背景

`upsert` = `where` (unique) + `create` (data) + `update` (data)。可直接复用 `ProPrismaWhereUnique`、`ProPrismaCreateData`、`ProPrismaUpdateData`。

### Step 1: 创建 `types.ts`

```typescript
import type { WhereUniqueValue, UniqueFieldConfig } from "../ProPrismaWhereUnique/types";
import type { CreateFieldConfig } from "../ProPrismaCreateData/types";
import type { WhereGroup } from "../ProPrismaWhere/types";

export interface UpsertValue {
  where: WhereUniqueValue;
  create: Record<string, unknown>;
  update: Record<string, unknown>;
}

export interface UpsertFieldConfig {
  uniqueFields: UniqueFieldConfig[];
  createFields: CreateFieldConfig[];
  updateFields: CreateFieldConfig[];
}

export { toPrismaWhereUnique } from "../ProPrismaWhereUnique/types";
export { toPrismaCreateData } from "../ProPrismaCreateData/types";
export { toPrismaUpdateData } from "../ProPrismaUpdateData/types";
```

- [ ] 完成

### Step 2: 创建 `ProPrismaUpsert.tsx`

```typescript
import { useMemo } from "react";
import { ProPrismaWhereUnique } from "../ProPrismaWhereUnique/ProPrismaWhereUnique";
import { ProPrismaCreateData } from "../ProPrismaCreateData/ProPrismaCreateData";
import { ProPrismaUpdateData } from "../ProPrismaUpdateData/ProPrismaUpdateData";
import { toPrismaWhereUnique } from "../ProPrismaWhereUnique/types";
import { toPrismaCreateData } from "../ProPrismaCreateData/types";
import { toPrismaUpdateData } from "../ProPrismaUpdateData/types";
import type { UpsertValue, UpsertFieldConfig } from "./types";

interface ProPrismaUpsertProps {
  fields: UpsertFieldConfig;
  value: UpsertValue;
  onChange: (value: UpsertValue) => void;
}

export function ProPrismaUpsert({ fields, value, onChange }: ProPrismaUpsertProps) {
  const result = useMemo(() => {
    const where = toPrismaWhereUnique(value.where, fields.uniqueFields);
    const create = toPrismaCreateData(value.create, fields.createFields);
    const update = toPrismaUpdateData(value.update, fields.updateFields);
    return { where, create, update };
  }, [value, fields]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>where (unique)</h3>
        <ProPrismaWhereUnique
          fields={fields.uniqueFields}
          value={value.where}
          onChange={(where) => onChange({ ...value, where })}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>create data</h3>
        <ProPrismaCreateData
          fields={fields.createFields}
          value={value.create}
          onChange={(create) => onChange({ ...value, create })}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>update data</h3>
        <ProPrismaUpdateData
          fields={fields.updateFields}
          value={value.update}
          onChange={(update) => onChange({ ...value, update })}
        />
      </div>

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>Prisma upsert Output:</div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

- [ ] 完成

### Step 3: 创建 `Demo.tsx`

```typescript
import { useState } from "react";
import { ProPrismaUpsert } from "./ProPrismaUpsert";
import type { UpsertValue, UpsertFieldConfig } from "./types";
import { dmmfToUniqueFields, dmmfToCreateFields, type DmmfDocument } from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;

const fields: UpsertFieldConfig = {
  uniqueFields: dmmfToUniqueFields(dmmf, "User"),
  createFields: dmmfToCreateFields(dmmf, "User"),
  updateFields: dmmfToCreateFields(dmmf, "User"),
};

export const ProPrismaUpsertDemo = () => {
  const [upsert, setUpsert] = useState<UpsertValue>({
    where: { field: "id" },
    create: {},
    update: {},
  });

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Upsert Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build Prisma <code>upsert</code> — update or create a record.
      </p>
      <ProPrismaUpsert fields={fields} value={upsert} onChange={setUpsert} />
    </div>
  );
};
```

- [ ] 完成

### Step 4: 创建 `index.ts`

```typescript
export * from "./types";
export * from "./ProPrismaUpsert";
```

- [ ] 完成

### Step 5: 验证

```bash
cd packages/example && npx tsc --noEmit
```

- [ ] 完成

### Step 6: Commit

```bash
git add packages/example/src/ProPrismaUpsert/
git commit -m "feat: add ProPrismaUpsert component"
```

- [ ] 完成

---

## Task 7: 新建 ProPrismaOmit 组件

**Files:**
- Create: `packages/example/src/ProPrismaOmit/types.ts`
- Create: `packages/example/src/ProPrismaOmit/ProPrismaOmit.tsx`
- Create: `packages/example/src/ProPrismaOmit/Demo.tsx`
- Create: `packages/example/src/ProPrismaOmit/index.ts`
- Modify: `packages/example/src/ProPrismaSelect/fromDmmf.ts`

### 背景

`omit` 排除指定字段（与 `select` 互斥）。只作用于标量字段（不能 omit 关系，关系用 `include` 控制）。

示例输出：
```json
{ "password": true, "email": true }
```

### Step 1: 创建 `types.ts`

```typescript
export interface OmitFieldConfig {
  name: string;
  label: string;
  children?: OmitFieldConfig[] | (() => OmitFieldConfig[]);
}

export function resolveChildren(field: OmitFieldConfig): OmitFieldConfig[] {
  const c = field.children;
  return typeof c === "function" ? c() : c ?? [];
}

export function hasChildren(field: OmitFieldConfig): boolean {
  return !!field.children;
}

export type OmitValue = Record<string, boolean | { omit: OmitValue }>;

export function toPrismaOmit(
  value: OmitValue,
  fields: OmitFieldConfig[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    const val = value[field.name];
    if (val === true) {
      result[field.name] = true;
    } else if (val && typeof val === "object" && "omit" in val) {
      const nested = toPrismaOmit(val.omit, resolveChildren(field));
      if (Object.keys(nested).length > 0) {
        result[field.name] = { omit: nested };
      }
    }
  }

  return result;
}

export function emptyOmitValue(): OmitValue {
  return {};
}
```

- [ ] 完成

### Step 2: 创建 `ProPrismaOmit.tsx`

与 `ProPrismaSelect` 类似，使用 antd `Tree`（checkable），但输出格式为 `{ fieldName: true }`。支持嵌套关系的 omit。

```typescript
import { Tree } from "antd";
import type { TreeDataNode, TreeProps } from "antd";
import { useCallback, useMemo } from "react";
import {
  hasChildren,
  resolveChildren,
  type OmitFieldConfig,
  type OmitValue,
  toPrismaOmit,
} from "./types";

// ... buildTreeData, valueToCheckedKeys, checkedKeysToValue 实现
// 类似 ProPrismaSelect 的 Tree 模式

interface ProPrismaOmitProps {
  fields: OmitFieldConfig[];
  value: OmitValue;
  onChange: (value: OmitValue) => void;
}

export function ProPrismaOmit({ fields, value, onChange }: ProPrismaOmitProps) {
  // ... Tree 实现，输出 toPrismaOmit 的 JSON
}
```

- [ ] 完成

### Step 3: 创建 `Demo.tsx`

```typescript
import { useState } from "react";
import { ProPrismaOmit } from "./ProPrismaOmit";
import { toPrismaOmit, type OmitValue } from "./types";
import { dmmfToOmitFields, type DmmfDocument } from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userOmitFields = dmmfToOmitFields(dmmf, "User");

export const ProPrismaOmitDemo = () => {
  const [omit, setOmit] = useState<OmitValue>({});
  console.log("Prisma omit:", JSON.stringify(toPrismaOmit(omit, userOmitFields), null, 2));
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Omit Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Exclude specific fields from the result. Cannot be used with <code>select</code>.
      </p>
      <ProPrismaOmit fields={userOmitFields} value={omit} onChange={setOmit} />
    </div>
  );
};
```

- [ ] 完成

### Step 4: 创建 `index.ts`

```typescript
export * from "./types";
export * from "./ProPrismaOmit";
```

- [ ] 完成

### Step 5: 更新 `fromDmmf.ts` — 添加 dmmfToOmitFields

```typescript
import type { OmitFieldConfig } from "../ProPrismaOmit/types";

export function dmmfToOmitFields(
  document: DmmfDocument,
  modelName: string,
): OmitFieldConfig[] {
  const model = document.datamodel.models.find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Model "${modelName}" not found in DMMF document`);
  }

  const result: OmitFieldConfig[] = [];

  for (const field of model.fields) {
    if (field.isReadOnly) continue;

    if (field.kind === "object") {
      result.push({
        name: field.name,
        label: prettify(field.name),
        children: () => dmmfToOmitFields(document, field.type),
      });
    } else {
      result.push({
        name: field.name,
        label: prettify(field.name),
      });
    }
  }

  return result;
}
```

- [ ] 完成

### Step 6: 验证

```bash
cd packages/example && npx tsc --noEmit
```

- [ ] 完成

### Step 7: Commit

```bash
git add packages/example/src/ProPrismaOmit/ packages/example/src/ProPrismaSelect/fromDmmf.ts
git commit -m "feat: add ProPrismaOmit component"
```

- [ ] 完成

---

## Task 8: 新建 ProPrismaDistinct 组件

**Files:**
- Create: `packages/example/src/ProPrismaDistinct/types.ts`
- Create: `packages/example/src/ProPrismaDistinct/ProPrismaDistinct.tsx`
- Create: `packages/example/src/ProPrismaDistinct/Demo.tsx`
- Create: `packages/example/src/ProPrismaDistinct/index.ts`

### 背景

`distinct` 按字段去重，输出为字段名数组。

示例输出：
```json
["city", "country"]
```

### Step 1: 创建 `types.ts`

```typescript
export interface DistinctFieldConfig {
  name: string;
  label: string;
}

export type DistinctValue = string[];

export function toPrismaDistinct(
  value: DistinctValue,
  fields: DistinctFieldConfig[],
): string[] {
  return value.filter((name) => fields.some((f) => f.name === name));
}
```

- [ ] 完成

### Step 2: 创建 `ProPrismaDistinct.tsx`

```typescript
import { Select } from "antd";
import { useMemo } from "react";
import { toPrismaDistinct, type DistinctFieldConfig, type DistinctValue } from "./types";

interface ProPrismaDistinctProps {
  fields: DistinctFieldConfig[];
  value: DistinctValue;
  onChange: (value: DistinctValue) => void;
}

export function ProPrismaDistinct({ fields, value, onChange }: ProPrismaDistinctProps) {
  const result = useMemo(() => toPrismaDistinct(value, fields), [value, fields]);

  return (
    <div>
      <Select
        mode="multiple"
        allowClear
        placeholder="Select fields to distinct on"
        style={{ width: "100%", minWidth: 300 }}
        options={fields.map((f) => ({ label: f.label, value: f.name }))}
        value={value}
        onChange={(v) => onChange(v as string[])}
      />

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>Prisma distinct Output:</div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

- [ ] 完成

### Step 3: 创建 `Demo.tsx`

```typescript
import { useState } from "react";
import { ProPrismaDistinct } from "./ProPrismaDistinct";
import type { DistinctValue } from "./types";
import { dmmfToDistinctFields, type DmmfDocument } from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userDistinctFields = dmmfToDistinctFields(dmmf, "User");

export const ProPrismaDistinctDemo = () => {
  const [distinct, setDistinct] = useState<DistinctValue>([]);
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Distinct Builder</h1>
      <ProPrismaDistinct fields={userDistinctFields} value={distinct} onChange={setDistinct} />
    </div>
  );
};
```

- [ ] 完成

### Step 4: 创建 `index.ts`

```typescript
export * from "./types";
export * from "./ProPrismaDistinct";
```

- [ ] 完成

### Step 5: 更新 `fromDmmf.ts` — 添加 dmmfToDistinctFields

```typescript
import type { DistinctFieldConfig } from "../ProPrismaDistinct/types";

export function dmmfToDistinctFields(
  document: DmmfDocument,
  modelName: string,
): DistinctFieldConfig[] {
  const model = document.datamodel.models.find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Model "${modelName}" not found in DMMF document`);
  }

  const result: DistinctFieldConfig[] = [];

  for (const field of model.fields) {
    if (field.isReadOnly) continue;
    if (field.kind === "object") continue;

    result.push({
      name: field.name,
      label: prettify(field.name),
    });
  }

  return result;
}
```

- [ ] 完成

### Step 6: 验证

```bash
cd packages/example && npx tsc --noEmit
```

- [ ] 完成

### Step 7: Commit

```bash
git add packages/example/src/ProPrismaDistinct/ packages/example/src/ProPrismaSelect/fromDmmf.ts
git commit -m "feat: add ProPrismaDistinct component"
```

- [ ] 完成

---

## Task 9: 新建 ProPrismaAggregate 组件

**Files:**
- Create: `packages/example/src/ProPrismaAggregate/types.ts`
- Create: `packages/example/src/ProPrismaAggregate/ProPrismaAggregate.tsx`
- Create: `packages/example/src/ProPrismaAggregate/Demo.tsx`
- Create: `packages/example/src/ProPrismaAggregate/index.ts`

### 背景

Prisma `aggregate` 支持 `_sum`、`_avg`、`_min`、`_max`、`_count`。每个聚合函数选择要聚合的数字字段。

示例输出：
```json
{
  "_avg": { "age": true },
  "_sum": { "score": true },
  "_count": { "_all": true }
}
```

### Step 1: 创建 `types.ts`

```typescript
export interface AggregateFieldConfig {
  name: string;
  label: string;
  type: "string" | "number" | "boolean" | "date" | "enum";
}

export type AggregateOp = "_sum" | "_avg" | "_min" | "_max" | "_count";

export interface AggregateValue {
  [field: string]: AggregateOp[];
}

export function toPrismaAggregate(
  value: AggregateValue,
  fields: AggregateFieldConfig[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [fieldName, ops] of Object.entries(value)) {
    if (!Array.isArray(ops) || ops.length === 0) continue;
    const fieldConfig = fields.find((f) => f.name === fieldName);
    if (!fieldConfig) continue;

    for (const op of ops) {
      if (!result[op]) {
        result[op] = {};
      }
      (result[op] as Record<string, boolean>)[fieldName] = true;
    }
  }

  // _count: { _all: true } if no specific fields selected for _count
  if (result._count && Object.keys(result._count as Record<string, boolean>).length === 0) {
    result._count = { _all: true };
  }

  return result;
}
```

- [ ] 完成

### Step 2: 创建 `ProPrismaAggregate.tsx`

使用 antd `Table` 或 `List`，每行一个字段，每行有 5 个 Checkbox（_sum/_avg/_min/_max/_count）。只对数字字段启用 _sum/_avg，对所有字段启用 _min/_max/_count。

```typescript
import { Checkbox, Table } from "antd";
import { useMemo } from "react";
import { toPrismaAggregate, type AggregateFieldConfig, type AggregateValue, type AggregateOp } from "./types";

// ... 实现
```

- [ ] 完成

### Step 3: 创建 `Demo.tsx`

```typescript
// 使用 Post 模型（有 likes: Int, title: String 等字段）
```

- [ ] 完成

### Step 4: 创建 `index.ts`

```typescript
export * from "./types";
export * from "./ProPrismaAggregate";
```

- [ ] 完成

### Step 5: 更新 `fromDmmf.ts` — 添加 dmmfToAggregateFields

```typescript
import type { AggregateFieldConfig } from "../ProPrismaAggregate/types";

export function dmmfToAggregateFields(
  document: DmmfDocument,
  modelName: string,
): AggregateFieldConfig[] {
  const model = document.datamodel.models.find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Model "${modelName}" not found in DMMF document`);
  }

  const result: AggregateFieldConfig[] = [];

  for (const field of model.fields) {
    if (field.isReadOnly) continue;
    if (field.kind === "object") continue;

    result.push({
      name: field.name,
      label: prettify(field.name),
      type: dmmfTypeToFieldType(field.type),
    });
  }

  return result;
}
```

- [ ] 完成

### Step 6: 验证 + Commit

```bash
cd packages/example && npx tsc --noEmit
git add packages/example/src/ProPrismaAggregate/ packages/example/src/ProPrismaSelect/fromDmmf.ts
git commit -m "feat: add ProPrismaAggregate component"
```

- [ ] 完成

---

## Task 10: 新建 ProPrismaGroupBy 组件

**Files:**
- Create: `packages/example/src/ProPrismaGroupBy/types.ts`
- Create: `packages/example/src/ProPrismaGroupBy/ProPrismaGroupBy.tsx`
- Create: `packages/example/src/ProPrismaGroupBy/Demo.tsx`
- Create: `packages/example/src/ProPrismaGroupBy/index.ts`

### 背景

`groupBy` = `by`（字段数组）+ 聚合（同 aggregate）+ `having`（类似 where 但针对聚合值）+ `orderBy` + `take`/`skip`。

示例输出：
```json
{
  "by": ["role"],
  "_count": { _all: true },
  "_avg": { "age": true },
  "having": { "age": { "_avg": { "gt": 30 } } },
  "orderBy": { "role": "asc" }
}
```

### Step 1: 创建 `types.ts`

```typescript
import type { AggregateValue, AggregateFieldConfig } from "../ProPrismaAggregate/types";
import type { WhereGroup, FieldConfig } from "../ProPrismaWhere/types";
import type { OrderByValue } from "../ProPrismaOrderBy/types";

export interface GroupByFieldConfig {
  scalarFields: { name: string; label: string; type: string }[];
  aggregateFields: AggregateFieldConfig[];
  whereFields: FieldConfig[];
  orderByFields: import("../ProPrismaOrderBy/types").OrderByFieldConfig[];
}

export interface GroupByValue {
  by: string[];
  aggregate: AggregateValue;
  having?: WhereGroup;
  orderBy?: OrderByValue;
  take?: number;
  skip?: number;
}

export function toPrismaGroupBy(
  value: GroupByValue,
  fields: GroupByFieldConfig,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (value.by && value.by.length > 0) {
    result.by = value.by;
  }

  // 复用 aggregate 转换
  if (value.aggregate && Object.keys(value.aggregate).length > 0) {
    const { toPrismaAggregate } = require("../ProPrismaAggregate/types");
    const aggResult = toPrismaAggregate(value.aggregate, fields.aggregateFields);
    Object.assign(result, aggResult);
  }

  // having: 直接透传（ProPrismaWhere 输出的 Prisma 对象）
  // orderBy: 直接透传

  if (value.take !== undefined && value.take !== null) {
    result.take = value.take;
  }
  if (value.skip !== undefined && value.skip !== null) {
    result.skip = value.skip;
  }

  return result;
}
```

注意：实际实现用静态 import，不用 require。

- [ ] 完成

### Step 2: 创建 `ProPrismaGroupBy.tsx`

组合 `Select`（by 多选）+ `ProPrismaAggregate`（聚合）+ `ProPrismaWhere`（having）+ `ProPrismaOrderBy` + `take`/`skip`。

- [ ] 完成

### Step 3: 创建 `Demo.tsx`

- [ ] 完成

### Step 4: 创建 `index.ts`

```typescript
export * from "./types";
export * from "./ProPrismaGroupBy";
```

- [ ] 完成

### Step 5: 验证 + Commit

```bash
cd packages/example && npx tsc --noEmit
git add packages/example/src/ProPrismaGroupBy/
git commit -m "feat: add ProPrismaGroupBy component"
```

- [ ] 完成

---

## Task 11: ProPrismaOrderBy — 关系计数排序 + null 控制

**Files:**
- Modify: `packages/example/src/ProPrismaOrderBy/types.ts`
- Modify: `packages/example/src/ProPrismaOrderBy/ProPrismaOrderBy.tsx`

### 背景

1. **按关系计数排序**：`orderBy: { posts: { _count: 'desc' } }`
2. **null 排序控制**：`orderBy: { name: { sort: 'asc', nulls: 'last' } }`

### Step 1: 修改 `types.ts`

扩展 `OrderByEntry`：

```typescript
export interface OrderByEntry {
  field: string;
  direction: "asc" | "desc";
  children?: OrderByEntry[];
  nulls?: "first" | "last";
  countSort?: boolean;
}
```

修改 `toPrismaOrderBy`：

```typescript
export function toPrismaOrderBy(
  value: OrderByValue,
  fields: OrderByFieldConfig[],
): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  for (const entry of value) {
    const fieldConfig = fields.find((f) => f.name === entry.field);
    if (!fieldConfig) continue;

    if (hasChildren(fieldConfig) && entry.countSort) {
      // 关系计数排序：{ field: { _count: 'desc' } }
      result.push({ [entry.field]: { _count: entry.direction } });
    } else if (hasChildren(fieldConfig) && entry.children && entry.children.length > 0) {
      const nested: Record<string, unknown> = {};
      for (const child of entry.children) {
        nested[child.field] = child.direction;
      }
      result.push({ [entry.field]: nested });
    } else if (entry.nulls) {
      // null 控制：{ field: { sort: 'asc', nulls: 'last' } }
      result.push({ [entry.field]: { sort: entry.direction, nulls: entry.nulls } });
    } else {
      result.push({ [entry.field]: entry.direction });
    }
  }
  return result;
}
```

- [ ] 完成

### Step 2: 修改 `ProPrismaOrderBy.tsx`

在 `OrderByEntryEditor` 中，对关系字段添加 "count sort" checkbox。对标量字段添加 "nulls" select（first/last/none）。

- [ ] 完成

### Step 3: 验证 + Commit

```bash
cd packages/example && npx tsc --noEmit
git add packages/example/src/ProPrismaOrderBy/
git commit -m "feat(ProPrismaOrderBy): add relation count sort and null handling"
```

- [ ] 完成

---

## Task 12: ProPrismaSelect — _count 支持

**Files:**
- Modify: `packages/example/src/ProPrismaSelect/types.ts`
- Modify: `packages/example/src/ProPrismaSelect/ProPrismaSelect.tsx`

### 背景

Prisma `select` 支持 `_count: { select: { posts: true } }` 来选择关系计数。

### Step 1: 修改 `types.ts`

扩展 `SelectValue`：

```typescript
export type SelectValue = {
  [fieldName: string]: boolean | { select: SelectValue };
  _count?: boolean | { select: Record<string, boolean> };
};
```

修改 `toPrismaSelect` 添加 `_count` 处理：

```typescript
export function toPrismaSelect(
  value: SelectValue,
  fields: SelectFieldConfig[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    const fieldValue = value[field.name];
    if (fieldValue === true) {
      if (hasChildren(field)) {
        result[field.name] = {
          select: toPrismaSelect({}, resolveChildren(field)),
        };
      } else {
        result[field.name] = true;
      }
    } else if (fieldValue && typeof fieldValue === "object" && "select" in fieldValue) {
      result[field.name] = {
        select: toPrismaSelect(fieldValue.select, resolveChildren(field)),
      };
    }
  }

  if (value._count) {
    if (value._count === true) {
      result._count = true;
    } else if (typeof value._count === "object" && "select" in value._count) {
      result._count = { select: value._count.select };
    }
  }

  return result;
}
```

- [ ] 完成

### Step 2: 修改 `ProPrismaSelect.tsx`

在 Tree 底部添加 `_count` 节点，展开后显示关系字段的多选。

- [ ] 完成

### Step 3: 验证 + Commit

```bash
cd packages/example && npx tsc --noEmit
git add packages/example/src/ProPrismaSelect/
git commit -m "feat(ProPrismaSelect): add _count support"
```

- [ ] 完成

---

## Task 13: ProPrismaWhere — JSON 过滤器 + 全文搜索

**Files:**
- Modify: `packages/example/src/ProPrismaWhere/types.ts`
- Modify: `packages/example/src/ProPrismaWhere/ProPrismaWhere.tsx`

### 背景

1. **JSON 过滤器**：`path`、`string_contains`、`string_startsWith`（对 Json 字段）
2. **全文搜索**：`search`（需 `@@fulltext` 索引）

### Step 1: 修改 `types.ts`

添加 `FieldType` 中的 `"json"` 类型：

```typescript
export type FieldType = "string" | "number" | "boolean" | "date" | "enum" | "json";
```

添加 JSON 操作符和全文搜索操作符：

```typescript
export const JSON_OPERATORS: { label: string; value: string }[] = [
  { label: "path (equals)", value: "path_equals" },
  { label: "string_contains", value: "string_contains" },
  { label: "string_startsWith", value: "string_startsWith" },
];

export const FULLTEXT_OPERATORS: { label: string; value: string }[] = [
  { label: "search", value: "search" },
];
```

在 `getOperatorsByType` 中添加 json 分支。在 `nodeToPrisma` 中添加 json 和 search 的输出处理。

- [ ] 完成

### Step 2: 修改 `ProPrismaWhere.tsx`

在 `ValueInput` 中添加 json 类型和 search 操作符的输入 UI。JSON path 过滤器需要额外的 path 输入。

- [ ] 完成

### Step 3: 验证 + Commit

```bash
cd packages/example && npx tsc --noEmit
git add packages/example/src/ProPrismaWhere/
git commit -m "feat(ProPrismaWhere): add JSON filters and full-text search"
```

- [ ] 完成

---

## Task 14: 更新 fromDmmf.ts — 补全所有新组件的字段转换

**Files:**
- Modify: `packages/example/src/ProPrismaSelect/fromDmmf.ts`

### 背景

前面各 Task 中已逐步添加了 `dmmfToIncludeFields`、`dmmfToUniqueFields`、`dmmfToPaginationFields`、`dmmfToOmitFields`、`dmmfToDistinctFields`、`dmmfToAggregateFields`。此 Task 做最终检查，确保：

1. 所有 `dmmfToXxxFields` 函数都已导出
2. `DmmfField` 接口包含 `isId` 和 `isUnique` 属性
3. `dmmfTypeToFieldType` 支持 `Json` 类型（返回 `"json"`）
4. 没有 import 冲突

### Step 1: 检查并修复

```bash
cd packages/example && npx tsc --noEmit
```

如有错误，逐一修复。

- [ ] 完成

### Step 2: Commit

```bash
git add packages/example/src/ProPrismaSelect/fromDmmf.ts
git commit -m "chore: consolidate fromDmmf.ts with all field converters"
```

- [ ] 完成

---

## Task 15: 更新 App.tsx — 注册所有新 Demo

**Files:**
- Modify: `packages/example/src/App.tsx`

### 背景

将所有新组件的 Demo 添加到 Tabs 中。

### Step 1: 修改 `App.tsx`

```typescript
import { Tabs } from "antd";
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

export const App = () => {
  return (
    <div style={{ maxWidth: 960, margin: "40px auto", padding: "0 20px" }}>
      <Tabs
        items={[
          { key: "create", label: "Create Data", children: <ProPrismaCreateDataDemo /> },
          { key: "update", label: "Update Data", children: <ProPrismaUpdateDataDemo /> },
          { key: "upsert", label: "Upsert", children: <ProPrismaUpsertDemo /> },
          { key: "where", label: "Where", children: <ProPrismaWhereDemo /> },
          { key: "whereUnique", label: "Where Unique", children: <ProPrismaWhereUniqueDemo /> },
          { key: "select", label: "Select", children: <ProPrismaSelectDemo /> },
          { key: "include", label: "Include", children: <ProPrismaIncludeDemo /> },
          { key: "omit", label: "Omit", children: <ProPrismaOmitDemo /> },
          { key: "orderBy", label: "OrderBy", children: <ProPrismaOrderByDemo /> },
          { key: "pagination", label: "Pagination", children: <ProPrismaPaginationDemo /> },
          { key: "distinct", label: "Distinct", children: <ProPrismaDistinctDemo /> },
          { key: "aggregate", label: "Aggregate", children: <ProPrismaAggregateDemo /> },
          { key: "groupBy", label: "GroupBy", children: <ProPrismaGroupByDemo /> },
        ]}
      />
    </div>
  );
};
```

- [ ] 完成

### Step 2: 验证 + Commit

```bash
cd packages/example && npx tsc --noEmit
git add packages/example/src/App.tsx
git commit -m "feat: register all new component demos in App.tsx"
```

- [ ] 完成

---

## Task 16: 最终验证

### Step 1: 全量类型检查

```bash
cd packages/example && npx tsc --noEmit
```

预期：无错误。如有错误，逐一修复。

- [ ] 完成

### Step 2: Dev server 启动验证

```bash
cd packages/example && npx vite --port 3000
```

预期：Vite dev server 启动成功，无编译错误。手动检查各 Tab 页面是否正常渲染。

- [ ] 完成

### Step 3: 最终 Commit

```bash
git add -A
git commit -m "chore: final verification — all components pass tsc"
```

- [ ] 完成

---

## 并行执行策略

```
Phase 1 (顺序):
  Task 1 (ProPrismaWhere 修复)
  Task 2 (ProPrismaUpdateData 原子操作)

Phase 2 (并行 × 3):
  Task 3 (ProPrismaInclude)
  Task 4 (ProPrismaPagination)
  Task 5 (ProPrismaWhereUnique)

Phase 3 (并行 × 3, 依赖 Phase 2):
  Task 6 (ProPrismaUpsert, 依赖 Task 3-5)
  Task 7 (ProPrismaOmit)
  Task 8 (ProPrismaDistinct)

Phase 4 (并行 × 2):
  Task 9 (ProPrismaAggregate)
  Task 10 (ProPrismaGroupBy, 依赖 Task 9)

Phase 5 (并行 × 3):
  Task 11 (ProPrismaOrderBy 增强)
  Task 12 (ProPrismaSelect _count)
  Task 13 (ProPrismaWhere JSON + 全文搜索)

Phase 6 (顺序):
  Task 14 (fromDmmf.ts 整合)
  Task 15 (App.tsx 注册)
  Task 16 (最终验证)
```
