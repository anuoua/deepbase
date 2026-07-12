import { Collapse, Input, InputNumber, Tree } from "antd";
import type { TreeDataNode, TreeProps } from "antd";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  hasChildren,
  resolveChildren,
  toPrismaInclude,
  type IncludeFieldConfig,
  type IncludeRelationOptions,
  type IncludeValue,
} from "./types";
import { ProPrismaPlaceholder } from "../ProPrismaPlaceholder/ProPrismaPlaceholder";
import { isPlaceholderValue, markPlaceholder } from "../ProPrismaPlaceholder/utils";

interface ProPrismaIncludeProps {
  fields: IncludeFieldConfig[];
  value: IncludeValue;
  onChange: (value: IncludeValue) => void;
}

function buildTreeData(fields: IncludeFieldConfig[], prefix = ""): TreeDataNode[] {
  return fields.filter(hasChildren).map((field) => {
    const key = prefix ? `${prefix}.${field.name}` : field.name;
    const node: TreeDataNode = {
      key,
      title: field.label,
      isLeaf: false,
    };
    if (Array.isArray(field.children)) {
      const nestedRelations = field.children.filter(hasChildren);
      node.children = nestedRelations.length > 0 ? buildTreeData(nestedRelations, key) : [];
    }
    return node;
  });
}

function collectGetters(
  fields: IncludeFieldConfig[],
  map: Map<string, () => IncludeFieldConfig[]>,
  prefix = "",
) {
  for (const f of fields) {
    if (!hasChildren(f)) continue;
    const key = prefix ? `${prefix}.${f.name}` : f.name;
    if (typeof f.children === "function") {
      map.set(key, f.children);
    }
  }
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
      return { ...node, children: addChildren(node.children, targetKey, children) };
    }
    return node;
  });
}

function getRelationFields(fields: IncludeFieldConfig[]): string[] {
  return fields.filter(hasChildren).map((f) => f.name);
}

export function ProPrismaInclude({ fields, value, onChange }: ProPrismaIncludeProps) {
  const relationFields = useMemo(() => getRelationFields(fields), [fields]);
  const getterMapRef = useRef(new Map<string, () => IncludeFieldConfig[]>());

  const [baseTreeData, setBaseTreeData] = useState<TreeDataNode[]>(() => {
    const map = new Map<string, () => IncludeFieldConfig[]>();
    collectGetters(fields, map);
    getterMapRef.current = map;
    return buildTreeData(fields);
  });

  const treeData = useMemo(() => baseTreeData, [baseTreeData]);

  const onLoadData: NonNullable<TreeProps["loadData"]> = useCallback((node) => {
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
  }, []);

  const checkedKeys = useMemo(() => {
    const keys: string[] = [];
    function walk(obj: IncludeValue, prefix: string) {
      for (const [k, v] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${k}` : k;
        if (v === true) {
          keys.push(path);
        } else if (v && typeof v === "object" && !Array.isArray(v)) {
          keys.push(path);
          const opts = v as IncludeRelationOptions;
          if (opts.include) {
            walk(opts.include, path);
          }
        }
      }
    }
    walk(value, "");
    return keys;
  }, [value]);

  const result = useMemo(() => toPrismaInclude(value, fields), [value, fields]);

  const handleCheck = useCallback(
    (
      checked:
        | React.Key[]
        | { checked: React.Key[]; halfChecked: React.Key[] },
    ) => {
      const keys = (Array.isArray(checked) ? checked : checked.checked) as string[];
      const newValue: IncludeValue = {};

      for (const field of fields.filter(hasChildren)) {
        const dot = `${field.name}.`;
        const matched = keys.filter((k) => k === field.name || k.startsWith(dot));
        if (matched.length === 0) continue;

        const nestedPaths = matched
          .filter((k) => k.startsWith(dot))
          .map((k) => k.slice(dot.length));

        const existing = value[field.name];
        const hasOptions = typeof existing === "object" && existing !== null && !Array.isArray(existing);

        if (nestedPaths.length === 0) {
          if (hasOptions) {
            const { include: _, ...opts } = existing as IncludeRelationOptions;
            newValue[field.name] = Object.keys(opts).length > 0 ? opts : true;
          } else {
            newValue[field.name] = true;
          }
        } else {
          const nestedInclude: IncludeValue = {};
          for (const path of nestedPaths) {
            const parts = path.split(".");
            let target = nestedInclude;
            for (let i = 0; i < parts.length; i++) {
              const part = parts[i]!;
              if (i === parts.length - 1) {
                target[part] = true;
              } else {
                if (!target[part] || typeof target[part] !== "object") {
                  target[part] = { include: {} };
                }
                target = (target[part] as IncludeRelationOptions).include!;
              }
            }
          }

          if (hasOptions) {
            newValue[field.name] = { ...(existing as IncludeRelationOptions), include: nestedInclude };
          } else {
            newValue[field.name] = { include: nestedInclude };
          }
        }
      }

      onChange(newValue);
    },
    [fields, value, onChange],
  );

  const updateRelationOptions = useCallback(
    (fieldName: string, mutate: (opts: IncludeRelationOptions) => void) => {
      const current = value[fieldName];
      const base: IncludeRelationOptions =
        typeof current === "object" && current !== null
          ? { ...current }
          : {};
      mutate(base);
      onChange({ ...value, [fieldName]: base });
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
        selectable={false}
      />

      {relationFields
        .filter((name) => checkedKeys.includes(name))
        .map((fieldName) => {
          const fieldConfig = fields.find((f) => f.name === fieldName)!;
          const raw = value[fieldName];
          const opts = (
            typeof raw === "object" && raw !== null ? raw : {}
          ) as IncludeRelationOptions;

          return (
            <Collapse
              key={fieldName}
              size="small"
              style={{ marginTop: 8 }}
              items={[
                {
                  key: fieldName,
                  label: `${fieldConfig.label} options`,
                  children: (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#666" }}>where (JSON)</label>
                          <Input.TextArea
                            rows={2}
                            placeholder={isPlaceholderValue(opts.where) ? "Runtime value" : '{ "published": true }'}
                            value={isPlaceholderValue(opts.where) ? "" : (opts.where ? JSON.stringify(opts.where) : "")}
                            onChange={(e) => {
                              try {
                                const parsed = e.target.value.trim() ? JSON.parse(e.target.value) : undefined;
                                updateRelationOptions(fieldName, (o) => {
                                  if (parsed) o.where = parsed;
                                  else delete o.where;
                                });
                              } catch { /* ignore */ }
                            }}
                          />
                        </div>
                        <ProPrismaPlaceholder
                          enabled={isPlaceholderValue(opts.where)}
                          onChange={(p) => updateRelationOptions(fieldName, (o) => {
                            if (p) o.where = markPlaceholder() as Record<string, unknown>;
                            else delete o.where;
                          })}
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#666" }}>orderBy (JSON)</label>
                          <Input.TextArea
                            rows={2}
                            placeholder={isPlaceholderValue(opts.orderBy) ? "Runtime value" : '[{ "createdAt": "desc" }]'}
                            value={isPlaceholderValue(opts.orderBy) ? "" : (opts.orderBy ? JSON.stringify(opts.orderBy) : "")}
                            onChange={(e) => {
                              try {
                                const parsed = e.target.value.trim() ? JSON.parse(e.target.value) : undefined;
                                updateRelationOptions(fieldName, (o) => {
                                  if (parsed) o.orderBy = parsed;
                                  else delete o.orderBy;
                                });
                              } catch { /* ignore */ }
                            }}
                          />
                        </div>
                        <ProPrismaPlaceholder
                          enabled={isPlaceholderValue(opts.orderBy)}
                          onChange={(p) => updateRelationOptions(fieldName, (o) => {
                            if (p) o.orderBy = markPlaceholder() as unknown as Record<string, unknown>[];
                            else delete o.orderBy;
                          })}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div>
                            <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#666" }}>take</label>
                            <InputNumber
                              value={isPlaceholderValue(opts.take) ? null : (opts.take ?? null)}
                              onChange={(v) => updateRelationOptions(fieldName, (o) => {
                                if (v != null) o.take = v;
                                else delete o.take;
                              })}
                            />
                          </div>
                          <ProPrismaPlaceholder
                            enabled={isPlaceholderValue(opts.take)}
                            onChange={(p) => updateRelationOptions(fieldName, (o) => {
                              if (p) o.take = markPlaceholder() as unknown as number;
                              else delete o.take;
                            })}
                          />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div>
                            <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#666" }}>skip</label>
                            <InputNumber
                              value={isPlaceholderValue(opts.skip) ? null : (opts.skip ?? null)}
                              onChange={(v) => updateRelationOptions(fieldName, (o) => {
                                if (v != null) o.skip = v;
                                else delete o.skip;
                              })}
                            />
                          </div>
                          <ProPrismaPlaceholder
                            enabled={isPlaceholderValue(opts.skip)}
                            onChange={(p) => updateRelationOptions(fieldName, (o) => {
                              if (p) o.skip = markPlaceholder() as unknown as number;
                              else delete o.skip;
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          );
        })}

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
          Prisma include Output:
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
