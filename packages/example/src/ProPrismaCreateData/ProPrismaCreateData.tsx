import { Button, Checkbox, Input, InputNumber, Segmented, Select } from "antd";
import { useCallback, useMemo } from "react";
import {
  resolveChildren,
  hasChildren,
  isScalarList,
  isRelation,
  isToOne,
  type CreateFieldConfig,
  toPrismaCreateData,
} from "./types";

interface ProPrismaCreateDataProps {
  fields: CreateFieldConfig[];
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

function CreateFieldInput({
  field,
  value,
  onChange,
}: {
  field: CreateFieldConfig;
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

function CreateRelationEditor({
  fields,
  value,
  onChange,
  toMany,
  label,
}: {
  fields: CreateFieldConfig[];
  value: unknown;
  onChange: (value: unknown) => void;
  toMany: boolean;
  label: string;
}) {
  const r = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const mode = (r.mode as "create" | "connect" | "connectOrCreate") ?? "create";

  const data = useMemo(() => (r.data as Record<string, unknown>) ?? {}, [r.data]);
  const items = useMemo(() => {
    const raw = r.items;
    return Array.isArray(raw)
      ? (raw as { whereId?: number; data?: Record<string, unknown> }[])
      : [];
  }, [r.items]);
  const id = r.id as number | undefined;
  const ids = useMemo(() => {
    const raw = r.ids;
    return Array.isArray(raw) ? (raw as number[]) : [];
  }, [r.ids]);

  const handleModeChange = useCallback(
    (newMode: string) => {
      if (newMode === "create") {
        onChange({ mode: "create" });
      } else if (newMode === "connectOrCreate") {
        if (toMany) {
          onChange({ mode: "connectOrCreate", items: [] });
        } else {
          onChange({ mode: "connectOrCreate", whereId: undefined, data: {} });
        }
      } else {
        if (toMany) {
          onChange({ mode: "connect", ids: [] });
        } else {
          onChange({ mode: "connect", id: undefined });
        }
      }
    },
    [onChange, toMany],
  );

  const handleCreateDataChange = useCallback(
    (newData: Record<string, unknown>) => {
      onChange({ mode: "create", data: newData });
    },
    [onChange],
  );

  const handleCreateItemsChange = useCallback(
    (newItems: Record<string, unknown>[]) => {
      onChange({ mode: "create", items: newItems });
    },
    [onChange],
  );

  const addItem = useCallback(() => {
    onChange({ mode: "create", items: [...items, {}] });
  }, [onChange, items]);

  const updateItem = useCallback(
    (index: number, itemValue: Record<string, unknown>) => {
      const arr = [...items];
      arr[index] = itemValue;
      onChange({ mode: "create", items: arr });
    },
    [onChange, items],
  );

  const removeItem = useCallback(
    (index: number) => {
      const arr = items.filter((_, i) => i !== index);
      onChange({ mode: "create", items: arr.length > 0 ? arr : [] });
    },
    [onChange, items],
  );

  const handleIdChange = useCallback(
    (newId: number | null) => {
      onChange({ mode: "connect", id: newId ?? undefined });
    },
    [onChange],
  );

  const handleIdsChange = useCallback(
    (newIds: unknown) => {
      const arr = Array.isArray(newIds) ? newIds.map((v) => Number(v)).filter((v) => !isNaN(v)) : [];
      onChange({ mode: "connect", ids: arr });
    },
    [onChange],
  );

  return (
    <div style={{ marginLeft: 16, marginTop: 8 }}>
      <div style={{ marginBottom: 8 }}>
        <Segmented
          options={["create", "connect", "connectOrCreate"]}
          value={mode}
          onChange={handleModeChange}
          size="small"
        />
      </div>

      {mode === "connect" && !toMany && (
        <InputNumber
          placeholder={`${label} ID`}
          style={{ minWidth: 200 }}
          value={id ?? null}
          onChange={handleIdChange}
        />
      )}

      {mode === "connect" && toMany && (
        <Select
          allowClear
          mode="tags"
          placeholder={`Enter ${label} IDs`}
          style={{ minWidth: 250 }}
          value={ids}
          onChange={handleIdsChange}
        />
      )}

      {mode === "connectOrCreate" && !toMany && (
        <div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, marginRight: 8, color: "#333" }}>where ID:</span>
            <InputNumber
              placeholder="Record ID"
              style={{ minWidth: 120 }}
              value={(r.whereId as number) ?? null}
              onChange={(v) =>
                onChange({ mode: "connectOrCreate", whereId: v ?? undefined, data })
              }
            />
          </div>
          <div style={{ marginBottom: 4, fontWeight: 500, color: "#666", fontSize: 12 }}>
            create data:
          </div>
          <CreateFieldsForm
            fields={fields}
            value={data}
            onChange={(v) =>
              onChange({ mode: "connectOrCreate", whereId: r.whereId, data: v })
            }
          />
        </div>
      )}

      {mode === "connectOrCreate" && toMany && (
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
              <div
                style={{
                  marginBottom: 8,
                  fontWeight: 500,
                  color: "#666",
                  fontSize: 12,
                }}
              >
                Item {index + 1}
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 12, marginRight: 8, color: "#333" }}>
                  where ID:
                </span>
                <InputNumber
                  placeholder="Record ID"
                  style={{ minWidth: 120 }}
                  value={item.whereId ?? null}
                  onChange={(v) => {
                    const arr = [...items];
                    const { whereId: _, ...rest } = item;
                    arr[index] = v !== null ? { ...rest, whereId: v } : rest;
                    onChange({ mode: "connectOrCreate", items: arr });
                  }}
                />
              </div>
              <div style={{ marginBottom: 4, fontWeight: 500, color: "#666", fontSize: 12 }}>
                create data:
              </div>
              <CreateFieldsForm
                fields={fields}
                value={item.data ?? {}}
                onChange={(v) => {
                  const arr = [...items];
                  arr[index] = { ...item, data: v };
                  onChange({ mode: "connectOrCreate", items: arr });
                }}
              />
              <Button
                danger
                size="small"
                type="text"
                style={{ position: "absolute", top: 4, right: 4 }}
                onClick={() => {
                  const arr = items.filter((_, i) => i !== index);
                  onChange({ mode: "connectOrCreate", items: arr });
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
              onChange({
                mode: "connectOrCreate",
                items: [...items, { whereId: undefined, data: {} }],
              })
            }
          >
            + Add Item
          </Button>
        </div>
      )}

      {mode === "create" && !toMany && (
        <CreateFieldsForm
          fields={fields}
          value={data}
          onChange={handleCreateDataChange}
        />
      )}

      {mode === "create" && toMany && (
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
              <div
                style={{
                  marginBottom: 8,
                  fontWeight: 500,
                  color: "#666",
                  fontSize: 12,
                }}
              >
                Item {index + 1}
              </div>
              <CreateFieldsForm
                fields={fields}
                value={item}
                onChange={(v) => updateItem(index, v)}
              />
              <Button
                danger
                size="small"
                type="text"
                style={{ position: "absolute", top: 4, right: 4 }}
                onClick={() => removeItem(index)}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button size="small" type="dashed" onClick={addItem}>
            + Add Item
          </Button>
        </div>
      )}
    </div>
  );
}

function CreateFieldsForm({
  fields,
  value,
  onChange,
}: {
  fields: CreateFieldConfig[];
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}) {
  const updateField = useCallback(
    (name: string, fieldValue: unknown) => {
      onChange({ ...value, [name]: fieldValue });
    },
    [value, onChange],
  );

  const toggleOptional = useCallback(
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
        const isOpt = field.isRequired === false;
        const enabled = isOpt ? fieldValue !== undefined : true;

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
              {isOpt && (
                <Checkbox
                  checked={enabled}
                  onChange={(e) => toggleOptional(field.name, e.target.checked)}
                >
                  {field.label}
                </Checkbox>
              )}

              {!isOpt && (
                <span
                  style={{
                    minWidth: 120,
                    fontWeight: 500,
                    color: "#333",
                    fontSize: 13,
                  }}
                >
                  {field.label}
                </span>
              )}

              {enabled && !isRelation(field) && (
                <CreateFieldInput
                  field={field}
                  value={fieldValue}
                  onChange={(v) => updateField(field.name, v)}
                />
              )}
            </div>

            {enabled && isRelation(field) && (
              <CreateRelationEditor
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

export function ProPrismaCreateData({
  fields,
  value,
  onChange,
}: ProPrismaCreateDataProps) {
  const result = useMemo(
    () => toPrismaCreateData(value, fields),
    [value, fields],
  );

  return (
    <div>
      <CreateFieldsForm fields={fields} value={value} onChange={onChange} />

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
          Prisma create Output:
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