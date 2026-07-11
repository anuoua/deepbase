import { Button, Input, InputNumber, Select, Switch } from "antd";
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
            onClick={() => removeRow(rowIndex)}
            style={{ marginTop: 18 }}
          >
            ✕
          </Button>
        </div>
      ))}
      <Button type="dashed" onClick={addRow} block>
        + Add Row
      </Button>
    </div>
  );
}
