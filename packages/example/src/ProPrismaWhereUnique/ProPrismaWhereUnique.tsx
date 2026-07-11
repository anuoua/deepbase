import { Input, InputNumber, Select } from "antd";
import { useCallback, useMemo } from "react";
import {
  toPrismaWhereUnique,
  type UniqueFieldConfig,
  type WhereUniqueValue,
} from "./types";

interface ProPrismaWhereUniqueProps {
  fields: UniqueFieldConfig[];
  value: WhereUniqueValue;
  onChange: (value: WhereUniqueValue) => void;
}

export function ProPrismaWhereUnique({
  fields,
  value,
  onChange,
}: ProPrismaWhereUniqueProps) {
  const result = useMemo(
    () => toPrismaWhereUnique(value, fields),
    [value, fields],
  );

  const fieldOptions = useMemo(
    () => fields.map((f) => ({ label: f.label, value: f.name })),
    [fields],
  );

  const fieldConfig = fields.find((f) => f.name === value.field);

  const handleFieldChange = useCallback(
    (field: string) => {
      onChange({ field });
    },
    [onChange],
  );

  const handleValueChange = useCallback(
    (val: number | null) => {
      onChange({ ...value, ...(val === null ? {} : { value: val }) });
    },
    [value, onChange],
  );

  const handleStringValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, value: e.target.value });
    },
    [value, onChange],
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "#666" }}>unique field</label>
          <Select
            allowClear={false}
            options={fieldOptions}
            placeholder="Field"
            showSearch
            style={{ minWidth: 150 }}
            value={value.field || null}
            onChange={handleFieldChange}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "#666" }}>value</label>
          {fieldConfig?.type === "number" ? (
            <InputNumber
              placeholder="Value"
              style={{ minWidth: 200 }}
              value={
                value.value !== undefined && value.value !== null
                  ? Number(value.value)
                  : null
              }
              onChange={handleValueChange}
            />
          ) : (
            <Input
              allowClear
              placeholder="Value"
              style={{ minWidth: 200 }}
              value={(value.value as string) ?? ""}
              onChange={handleStringValueChange}
            />
          )}
        </div>
      </div>

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
          Prisma Where Unique Output:
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
