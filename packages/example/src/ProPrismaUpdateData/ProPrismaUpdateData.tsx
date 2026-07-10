import { Button, Checkbox, Input, InputNumber, Segmented, Select } from "antd";
import { useCallback, useMemo } from "react";
import {
  resolveChildren,
  hasChildren,
  isScalarList,
  isRelation,
  isToOne,
  toPrismaUpdateData,
  type UpdateFieldConfig,
} from "./types";

interface ProPrismaUpdateDataProps {
  fields: UpdateFieldConfig[];
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

function UpdateFieldInput({
  field,
  value,
  onChange,
}: {
  field: UpdateFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (isScalarList(field)) {
    return (
      <Select
        allowClear
        mode="tags"
        placeholder={`Enter ${field.label.toLowerCase()} values`}
        style={{ minWidth: 250, flex: 1 }}
        value={Array.isArray(value) ? (value as (string | number)[]) : []}
        onChange={onChange}
      />
    );
  }

  if (field.type === "enum") {
    return (
      <Select
        allowClear
        options={field.enums ?? []}
        placeholder={`Select ${field.label.toLowerCase()}`}
        style={{ minWidth: 200, flex: 1 }}
        value={(value as string | number) ?? undefined}
        onChange={onChange}
      />
    );
  }

  switch (field.type) {
    case "string":
      return (
        <Input
          allowClear
          placeholder={`Enter ${field.label.toLowerCase()}`}
          style={{ minWidth: 200, flex: 1 }}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );
    case "number":
      return (
        <InputNumber
          placeholder={`Enter ${field.label.toLowerCase()}`}
          style={{ minWidth: 200, flex: 1 }}
          value={(value as number) ?? null}
          onChange={(v) => onChange(v)}
        />
      );
    case "boolean":
      return (
        <Select
          allowClear
          options={[
            { label: "true", value: true },
            { label: "false", value: false },
          ]}
          placeholder="Select boolean"
          style={{ minWidth: 120 }}
          value={value !== undefined ? (value as boolean) : undefined}
          onChange={onChange}
        />
      );
    case "date":
      return (
        <Input
          allowClear
          placeholder="Date (e.g. 2024-01-01T00:00:00.000Z)"
          style={{ minWidth: 200, flex: 1 }}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );
    default:
      return (
        <Input
          allowClear
          placeholder={`Enter ${field.label.toLowerCase()}`}
          style={{ minWidth: 200, flex: 1 }}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );
  }
}

const RELATION_MODES = ["create", "connect", "disconnect", "delete", "update"] as const;

function UpdateRelationEditor({
  fields,
  value,
  onChange,
  toMany,
  label,
}: {
  fields: UpdateFieldConfig[];
  value: unknown;
  onChange: (value: unknown) => void;
  toMany: boolean;
  label: string;
}) {
  const r = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const mode = (r.mode as string) ?? "create";

  const handleModeChange = useCallback(
    (newMode: string) => {
      if (newMode === "create") {
        onChange({ mode: "create" });
      } else if (newMode === "connect") {
        onChange(toMany ? { mode: "connect", ids: [] } : { mode: "connect", id: undefined });
      } else if (newMode === "disconnect") {
        onChange(toMany ? { mode: "disconnect", ids: [] } : { mode: "disconnect" });
      } else if (newMode === "delete") {
        onChange(toMany ? { mode: "delete", ids: [] } : { mode: "delete" });
      } else if (newMode === "update") {
        onChange(toMany ? { mode: "update", items: [] } : { mode: "update" });
      }
    },
    [onChange, toMany],
  );

  return (
    <div style={{ marginLeft: 16, marginTop: 8 }}>
      <div style={{ marginBottom: 8 }}>
        <Segmented
          options={RELATION_MODES.map((m) => ({ label: m, value: m }))}
          value={mode}
          onChange={handleModeChange}
          size="small"
        />
      </div>

      <UpdateRelationContent
        fields={fields}
        r={r}
        mode={mode}
        onChange={onChange}
        toMany={toMany}
        label={label}
      />
    </div>
  );
}

function UpdateRelationContent({
  fields,
  r,
  mode,
  onChange,
  toMany,
  label,
}: {
  fields: UpdateFieldConfig[];
  r: Record<string, unknown>;
  mode: string;
  onChange: (value: unknown) => void;
  toMany: boolean;
  label: string;
}) {
  switch (mode) {
    case "create": {
      const data = (r.data as Record<string, unknown>) ?? {};
      const items = Array.isArray(r.items) ? (r.items as Record<string, unknown>[]) : [];

      if (!toMany) {
        return (
          <UpdateFieldsForm
            fields={fields}
            value={data}
            onChange={(v) => onChange({ mode: "create", data: v })}
          />
        );
      }

      return (
        <div>
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: 6,
                padding: 12,
                marginBottom: 8,
                position: "relative",
              }}
            >
              <div style={{ marginBottom: 8, fontWeight: 500, color: "#666", fontSize: 12 }}>
                Item {index + 1}
              </div>
              <UpdateFieldsForm
                fields={fields}
                value={item}
                onChange={(v) => {
                  const arr = [...items];
                  arr[index] = v;
                  onChange({ mode: "create", items: arr });
                }}
              />
              <Button
                danger
                size="small"
                type="text"
                style={{ position: "absolute", top: 4, right: 4 }}
                onClick={() => {
                  const arr = items.filter((_, i) => i !== index);
                  onChange({ mode: "create", items: arr });
                }}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button
            size="small"
            type="dashed"
            onClick={() => onChange({ mode: "create", items: [...items, {}] })}
          >
            + Add Item
          </Button>
        </div>
      );
    }

    case "connect": {
      if (!toMany) {
        const id = r.id as number | undefined;
        return (
          <InputNumber
            placeholder={`${label} ID`}
            style={{ minWidth: 200 }}
            value={id ?? null}
            onChange={(v) => onChange({ mode: "connect", id: v ?? undefined })}
          />
        );
      }
      const ids = Array.isArray(r.ids) ? (r.ids as number[]) : [];
      return (
        <Select
          allowClear
          mode="tags"
          placeholder={`Enter ${label} IDs`}
          style={{ minWidth: 250 }}
          value={ids}
          onChange={(v) =>
            onChange({
              mode: "connect",
              ids: Array.isArray(v) ? v.map((n) => Number(n)).filter((n) => !isNaN(n)) : [],
            })
          }
        />
      );
    }

    case "disconnect": {
      if (!toMany) {
        return <span style={{ color: "#999", fontSize: 13 }}>Will set <code>disconnect: true</code></span>;
      }
      const ids = Array.isArray(r.ids) ? (r.ids as number[]) : [];
      return (
        <Select
          allowClear
          mode="tags"
          placeholder={`Enter ${label} IDs`}
          style={{ minWidth: 250 }}
          value={ids}
          onChange={(v) =>
            onChange({
              mode: "disconnect",
              ids: Array.isArray(v) ? v.map((n) => Number(n)).filter((n) => !isNaN(n)) : [],
            })
          }
        />
      );
    }

    case "delete": {
      if (!toMany) {
        return <span style={{ color: "#999", fontSize: 13 }}>Will set <code>delete: true</code></span>;
      }
      const ids = Array.isArray(r.ids) ? (r.ids as number[]) : [];
      return (
        <Select
          allowClear
          mode="tags"
          placeholder={`Enter ${label} IDs`}
          style={{ minWidth: 250 }}
          value={ids}
          onChange={(v) =>
            onChange({
              mode: "delete",
              ids: Array.isArray(v) ? v.map((n) => Number(n)).filter((n) => !isNaN(n)) : [],
            })
          }
        />
      );
    }

    case "update": {
      if (!toMany) {
        const data = (r.data as Record<string, unknown>) ?? {};
        return (
          <UpdateFieldsForm
            fields={fields}
            value={data}
            onChange={(v) => onChange({ mode: "update", data: v })}
          />
        );
      }
      const items = Array.isArray(r.items)
        ? (r.items as { whereId?: number; data?: Record<string, unknown> }[])
        : [];
      return (
        <div>
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: 6,
                padding: 12,
                marginBottom: 8,
                position: "relative",
              }}
            >
              <div style={{ marginBottom: 8, fontWeight: 500, color: "#666", fontSize: 12 }}>
                Item {index + 1}
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 12, marginRight: 8, color: "#333" }}>where ID:</span>
                <InputNumber
                  placeholder="Record ID"
                  style={{ minWidth: 120 }}
                  value={item.whereId ?? null}
                  onChange={(v) => {
                    const arr = [...items];
                    const { whereId: _, ...rest } = item;
arr[index] = v !== null ? { ...rest, whereId: v } : rest;
                    onChange({ mode: "update", items: arr });
                  }}
                />
              </div>
              <UpdateFieldsForm
                fields={fields}
                value={item.data ?? {}}
                onChange={(v) => {
                  const arr = [...items];
                  arr[index] = { ...item, data: v };
                  onChange({ mode: "update", items: arr });
                }}
              />
              <Button
                danger
                size="small"
                type="text"
                style={{ position: "absolute", top: 4, right: 4 }}
                onClick={() => {
                  const arr = items.filter((_, i) => i !== index);
                  onChange({ mode: "update", items: arr });
                }}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button
            size="small"
            type="dashed"
            onClick={() =>
              onChange({ mode: "update", items: [...items, { whereId: undefined, data: {} }] })
            }
          >
            + Add Item
          </Button>
        </div>
      );
    }

    default:
      return null;
  }
}

function UpdateFieldsForm({
  fields,
  value,
  onChange,
}: {
  fields: UpdateFieldConfig[];
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}) {
  const updateField = useCallback(
    (name: string, fieldValue: unknown) => {
      onChange({ ...value, [name]: fieldValue });
    },
    [value, onChange],
  );

  const toggleField = useCallback(
    (name: string, enabled: boolean) => {
      const field = fields.find((f) => f.name === name);
      if (enabled) {
        if (field && isRelation(field)) {
          onChange({ ...value, [name]: { mode: "create" } });
        } else {
          onChange({ ...value, [name]: null });
        }
      } else {
        const { [name]: _, ...rest } = value;
        onChange(rest);
      }
    },
    [value, fields, onChange],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {fields.map((field) => {
        const fieldValue = value[field.name];
        const enabled = fieldValue !== undefined;

        return (
          <div key={field.name}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Checkbox
                checked={enabled}
                onChange={(e) => toggleField(field.name, e.target.checked)}
              >
                {field.label}
              </Checkbox>

              {enabled && !isRelation(field) && (
                <UpdateFieldInput
                  field={field}
                  value={fieldValue}
                  onChange={(v) => updateField(field.name, v)}
                />
              )}
            </div>

            {enabled && isRelation(field) && (
              <UpdateRelationEditor
                fields={resolveChildren(field)}
                value={fieldValue}
                onChange={(v) => updateField(field.name, v)}
                toMany={field.isList === true}
                label={field.label}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ProPrismaUpdateData({
  fields,
  value,
  onChange,
}: ProPrismaUpdateDataProps) {
  const result = useMemo(
    () => toPrismaUpdateData(value, fields),
    [value, fields],
  );

  return (
    <div>
      <UpdateFieldsForm fields={fields} value={value} onChange={onChange} />

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
          Prisma update Output:
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