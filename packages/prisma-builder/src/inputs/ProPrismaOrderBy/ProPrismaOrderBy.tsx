import { Button, Checkbox, Select } from "antd";
import { useCallback, useMemo } from "react";
import {
  resolveChildren,
  hasChildren,
  type OrderByFieldConfig,
  type OrderByEntry,
  type OrderByValue,
  toPrismaOrderBy,
  createEmptyEntry,
} from "./types";

interface ProPrismaOrderByProps {
  fields: OrderByFieldConfig[];
  value: OrderByValue;
  onChange: (value: OrderByValue) => void;
}

function OrderByEntryEditor({
  fields,
  entry,
  onChange,
  onRemove,
  depth = 0,
}: {
  fields: OrderByFieldConfig[];
  entry: OrderByEntry;
  onChange: (entry: OrderByEntry) => void;
  onRemove: () => void;
  depth?: number;
}) {
  const fieldConfig = fields.find((f) => f.name === entry.field);
  const isRelation = !!fieldConfig && hasChildren(fieldConfig);

  const handleFieldChange = useCallback(
    (field: string) => {
      const config = fields.find((f) => f.name === field);
      onChange({
        field,
        direction: "asc",
        ...(config && hasChildren(config) ? { children: [] as OrderByEntry[] } : {}),
      });
    },
    [fields, onChange],
  );

  const handleDirectionChange = useCallback(
    (direction: "asc" | "desc") => {
      onChange({ ...entry, direction });
    },
    [entry, onChange],
  );

  const handleChildrenChange = useCallback(
    (children: OrderByValue) => {
      onChange({ ...entry, children });
    },
    [entry, onChange],
  );

  const handleCountSortChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        onChange({ ...entry, countSort: true });
      } else {
        const { countSort: _, ...rest } = entry;
        onChange(rest);
      }
    },
    [entry, onChange],
  );

  const handleNullsChange = useCallback(
    (nulls: string) => {
      if (nulls === "none") {
        const { nulls: _n, ...rest } = entry;
        onChange(rest);
      } else {
        onChange({ ...entry, nulls: nulls as "first" | "last" });
      }
    },
    [entry, onChange],
  );

  const fieldOptions = useMemo(
    () => fields.map((f) => ({ label: f.label, value: f.name })),
    [fields],
  );

  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <Select
          allowClear={false}
          options={fieldOptions}
          placeholder="Field"
          showSearch
          style={{ minWidth: 150 }}
          value={entry.field || null}
          onChange={handleFieldChange}
        />
        <Select
          allowClear={false}
          options={[
            { label: "asc", value: "asc" },
            { label: "desc", value: "desc" },
          ]}
          placeholder="Direction"
          style={{ minWidth: 100 }}
          value={entry.direction}
          onChange={handleDirectionChange}
        />
        <Button danger size="small" type="text" onClick={onRemove}>
          ✕
        </Button>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 4, marginLeft: 4 }}>
        {isRelation && (
          <Checkbox
            checked={entry.countSort === true}
            onChange={(e) => handleCountSortChange(e.target.checked)}
          >
            Sort by count
          </Checkbox>
        )}
        {!isRelation && (
          <Select
            allowClear={false}
            options={[
              { label: "nulls: default", value: "none" },
              { label: "nulls: first", value: "first" },
              { label: "nulls: last", value: "last" },
            ]}
            style={{ minWidth: 150 }}
            value={entry.nulls ?? "none"}
            onChange={handleNullsChange}
          />
        )}
      </div>

      {isRelation && !entry.countSort && entry.children && (
        <OrderByListEditor
          fields={resolveChildren(fieldConfig!)}
          value={entry.children}
          onChange={handleChildrenChange}
          depth={depth + 1}
        />
      )}
    </div>
  );
}

function OrderByListEditor({
  fields,
  value,
  onChange,
  depth = 0,
}: {
  fields: OrderByFieldConfig[];
  value: OrderByValue;
  onChange: (value: OrderByValue) => void;
  depth?: number;
}) {
  const updateEntry = useCallback(
    (index: number, entry: OrderByEntry) => {
      const newValue = [...value];
      newValue[index] = entry;
      onChange(newValue);
    },
    [value, onChange],
  );

  const removeEntry = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange],
  );

  const addEntry = useCallback(() => {
    onChange([...value, createEmptyEntry(fields)]);
  }, [value, fields, onChange]);

  return (
    <div>
      {value.map((entry, index) => (
        <OrderByEntryEditor
          key={index}
          fields={fields}
          entry={entry}
          onChange={(e) => updateEntry(index, e)}
          onRemove={() => removeEntry(index)}
          depth={depth}
        />
      ))}
      <Button
        size="small"
        type="dashed"
        onClick={addEntry}
        style={{ marginTop: 4 }}
      >
        + Add Order
      </Button>
    </div>
  );
}

export function ProPrismaOrderBy({
  fields,
  value,
  onChange,
}: ProPrismaOrderByProps) {
  const result = useMemo(
    () => toPrismaOrderBy(value, fields),
    [value, fields],
  );

  return (
    <div>
      <OrderByListEditor fields={fields} value={value} onChange={onChange} />

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
          Prisma orderBy Output:
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