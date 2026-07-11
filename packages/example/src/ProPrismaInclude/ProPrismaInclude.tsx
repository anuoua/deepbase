import { Collapse, Input, InputNumber, Tree } from "antd";
import type { TreeDataNode } from "antd";
import { useCallback, useMemo } from "react";
import {
  hasChildren,
  resolveChildren,
  toPrismaInclude,
  type IncludeFieldConfig,
  type IncludeRelationOptions,
  type IncludeValue,
} from "./types";

interface ProPrismaIncludeProps {
  fields: IncludeFieldConfig[];
  value: IncludeValue;
  onChange: (value: IncludeValue) => void;
}

function buildTreeData(fields: IncludeFieldConfig[], prefix = ""): TreeDataNode[] {
  return fields.filter(hasChildren).map((field) => {
    const key = prefix ? `${prefix}.${field.name}` : field.name;
    const childFields = resolveChildren(field);
    const node: TreeDataNode = {
      key,
      title: field.label,
      isLeaf: !childFields.some(hasChildren),
    };
    const nestedRelations = childFields.filter(hasChildren);
    if (nestedRelations.length > 0) {
      node.children = buildTreeData(nestedRelations, key);
    }
    return node;
  });
}

function getRelationFields(fields: IncludeFieldConfig[]): string[] {
  return fields.filter(hasChildren).map((f) => f.name);
}

export function ProPrismaInclude({ fields, value, onChange }: ProPrismaIncludeProps) {
  const relationFields = useMemo(() => getRelationFields(fields), [fields]);
  const treeData = useMemo(() => buildTreeData(fields), [fields]);

  const checkedKeys = useMemo(() => {
    return Object.entries(value)
      .filter(([, v]) => v === true || typeof v === "object")
      .map(([k]) => k);
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
        if (keys.includes(field.name)) {
          newValue[field.name] = value[field.name] ?? true;
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
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#666" }}>
                          where (JSON)
                        </label>
                        <Input.TextArea
                          rows={2}
                          placeholder='{ "published": true }'
                          value={opts.where ? JSON.stringify(opts.where) : ""}
                          onChange={(e) => {
                            try {
                              const parsed = e.target.value.trim()
                                ? JSON.parse(e.target.value)
                                : undefined;
                              updateRelationOptions(fieldName, (o) => {
                                if (parsed) o.where = parsed;
                                else delete o.where;
                              });
                            } catch {
                              /* ignore parse errors */
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#666" }}>
                          orderBy (JSON)
                        </label>
                        <Input.TextArea
                          rows={2}
                          placeholder='[{ "createdAt": "desc" }]'
                          value={opts.orderBy ? JSON.stringify(opts.orderBy) : ""}
                          onChange={(e) => {
                            try {
                              const parsed = e.target.value.trim()
                                ? JSON.parse(e.target.value)
                                : undefined;
                              updateRelationOptions(fieldName, (o) => {
                                if (parsed) o.orderBy = parsed;
                                else delete o.orderBy;
                              });
                            } catch {
                              /* ignore parse errors */
                            }
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 16 }}>
                        <div>
                          <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#666" }}>
                            take
                          </label>
                          <InputNumber
                            value={opts.take ?? null}
                            onChange={(v) =>
                              updateRelationOptions(fieldName, (o) => {
                                if (v != null) o.take = v;
                                else delete o.take;
                              })
                            }
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#666" }}>
                            skip
                          </label>
                          <InputNumber
                            value={opts.skip ?? null}
                            onChange={(v) =>
                              updateRelationOptions(fieldName, (o) => {
                                if (v != null) o.skip = v;
                                else delete o.skip;
                              })
                            }
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
