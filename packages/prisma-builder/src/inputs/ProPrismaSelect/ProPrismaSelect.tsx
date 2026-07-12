import { Checkbox, Select, Tree } from "antd";
import type { TreeDataNode, TreeProps } from "antd";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  hasChildren,
  resolveChildren,
  type SelectFieldConfig,
  type SelectValue,
  toPrismaSelect,
} from "./types";

interface ProPrismaSelectProps {
  fields: SelectFieldConfig[];
  value: SelectValue;
  onChange: (value: SelectValue) => void;
  disabled?: boolean;
}

function buildTreeData(
  fields: SelectFieldConfig[],
  prefix = "",
): TreeDataNode[] {
  return fields.map((field) => {
    const key = prefix ? `${prefix}.${field.name}` : field.name;
    const isLazy = typeof field.children === "function";

    const node: TreeDataNode = {
      key,
      isLeaf: !hasChildren(field),
      title: (
        <>
          {field.label}
          {isLazy && (
            <span style={{ color: "#999", fontWeight: 400 }}>
              {" "}
              ({field.name})
            </span>
          )}
        </>
      ),
    };

    if (Array.isArray(field.children)) {
      node.children = buildTreeData(field.children, key);
    }

    return node;
  });
}

function updateDisableCheckbox(
  nodes: TreeDataNode[],
  checkedKeys: Set<string>,
  parentKey = "",
): TreeDataNode[] {
  return nodes.map((node) => {
    const key = node.key as string;
    const parentChecked = !parentKey || checkedKeys.has(parentKey);
    const updated: TreeDataNode = {
      ...node,
      disableCheckbox: !parentChecked,
    };
    if (node.children) {
      updated.children = updateDisableCheckbox(
        node.children,
        checkedKeys,
        key,
      );
    }
    return updated;
  });
}

function addChildren(
  nodes: TreeDataNode[],
  targetKey: string,
  children: TreeDataNode[],
): TreeDataNode[] {
  return nodes.map((node) => {
    if (node.key === targetKey) {
      return { ...node, children };
    }
    if (node.children) {
      return {
        ...node,
        children: addChildren(node.children, targetKey, children),
      };
    }
    return node;
  });
}

function valueToCheckedKeys(value: SelectValue, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [name, val] of Object.entries(value)) {
    if (name === "_count") continue;
    const key = prefix ? `${prefix}.${name}` : name;
    keys.push(key);
    if (val && typeof val === "object" && "select" in val) {
      keys.push(...valueToCheckedKeys(val.select, key));
    }
  }
  return keys;
}

function checkedKeysToValue(
  checkedKeys: string[],
  fields: SelectFieldConfig[],
  prefix = "",
): SelectValue {
  const value: SelectValue = {};
  for (const field of fields) {
    const key = prefix ? `${prefix}.${field.name}` : field.name;
    if (!checkedKeys.includes(key)) continue;

    if (hasChildren(field)) {
      const childFields = resolveChildren(field);
      const childKeys = checkedKeys.filter((k) => k.startsWith(key + "."));
      if (childKeys.length > 0) {
        value[field.name] = {
          select: checkedKeysToValue(checkedKeys, childFields, key),
        };
      } else {
        value[field.name] = true;
      }
    } else {
      value[field.name] = true;
    }
  }
  return value;
}

function collectGetters(
  fields: SelectFieldConfig[],
  map: Map<string, () => SelectFieldConfig[]>,
  prefix = "",
) {
  for (const f of fields) {
    const key = prefix ? `${prefix}.${f.name}` : f.name;
    if (typeof f.children === "function") {
      map.set(key, f.children);
    }
  }
}

export function ProPrismaSelect({
  fields,
  value,
  onChange,
  disabled = false,
}: ProPrismaSelectProps) {
  const checkedKeys = useMemo(() => valueToCheckedKeys(value), [value]);
  const checkedSet = useMemo(() => new Set(checkedKeys), [checkedKeys]);
  const getterMapRef = useRef(new Map<string, () => SelectFieldConfig[]>());

  const [baseTreeData, setBaseTreeData] = useState<TreeDataNode[]>(() => {
    const map = new Map<string, () => SelectFieldConfig[]>();
    collectGetters(fields, map);
    getterMapRef.current = map;
    return buildTreeData(fields);
  });

  const treeData = useMemo(
    () => updateDisableCheckbox(baseTreeData, checkedSet),
    [baseTreeData, checkedSet],
  );

  const result = useMemo(() => toPrismaSelect(value, fields), [value, fields]);

  const handleCheck = useCallback(
    (keys: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] }) => {
      const checked = (Array.isArray(keys) ? keys : keys.checked) as string[];
      const newValue = checkedKeysToValue(checked, fields);
      const prev = value as Record<string, unknown>;
      if (prev._count) {
        (newValue as Record<string, unknown>)._count = prev._count;
      }
      onChange(newValue);
    },
    [fields, value, onChange],
  );

  const onLoadData: NonNullable<TreeProps["loadData"]> = useCallback(
    (node) => {
      const key = node.key as string;
      const getter = getterMapRef.current.get(key);
      if (!getter) return Promise.resolve();

      const resolvedFields = getter();
      const childNodes = buildTreeData(resolvedFields, key);

      collectGetters(resolvedFields, getterMapRef.current, key);

      return new Promise<void>((resolve) => {
        setBaseTreeData((prev) => addChildren(prev, key, childNodes));
        setTimeout(resolve, 0);
      });
    },
    [],
  );

  const relationFieldOptions = useMemo(
    () =>
      fields.filter((f) => hasChildren(f)).map((f) => ({ label: f.label, value: f.name })),
    [fields],
  );

  const countValue = (value as Record<string, unknown>)._count;
  const countIncluded = countValue !== undefined && countValue !== false;
  const countSelectedFields: string[] =
    countValue && typeof countValue === "object" && "select" in countValue
      ? Object.entries((countValue as { select: Record<string, boolean> }).select)
          .filter(([, v]) => v)
          .map(([k]) => k)
      : [];

  const handleCountToggle = useCallback(
    (checked: boolean) => {
      if (checked) {
        onChange({ ...value, _count: { select: {} } });
      } else {
        const { _count: _removed, ...rest } = value as Record<string, unknown>;
        onChange(rest as SelectValue);
      }
    },
    [value, onChange],
  );

  const handleCountFieldsChange = useCallback(
    (selected: string[]) => {
      const select: Record<string, boolean> = {};
      for (const name of selected) {
        select[name] = true;
      }
      onChange({ ...value, _count: { select } });
    },
    [value, onChange],
  );

  return (
    <div>
      <Tree
        checkable
        checkStrictly
        treeData={treeData}
        checkedKeys={checkedKeys}
        onCheck={handleCheck}
        loadData={onLoadData}
        disabled={disabled}
        selectable={false}
      />

      {relationFieldOptions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Checkbox
            checked={countIncluded}
            disabled={disabled}
            onChange={(e) => handleCountToggle(e.target.checked)}
          >
            Include _count
          </Checkbox>
          {countIncluded && (
            <Select
              allowClear
              disabled={disabled}
              mode="multiple"
              options={relationFieldOptions}
              placeholder="Select relations to count"
              style={{ minWidth: 250, marginLeft: 8 }}
              value={countSelectedFields}
              onChange={handleCountFieldsChange}
            />
          )}
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: "#f5f5f5",
          borderRadius: 6,
          border: "1px solid #d9d9d9",
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>
          Prisma Select Output:
        </div>
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 13,
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}