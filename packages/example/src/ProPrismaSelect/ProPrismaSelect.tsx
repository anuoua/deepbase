import { Tree } from "antd";
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
      onChange(newValue);
    },
    [fields, onChange],
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