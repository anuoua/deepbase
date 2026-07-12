import { Checkbox } from "antd";
import { useMemo } from "react";
import { toPrismaOmit, type OmitFieldConfig, type OmitValue } from "./types";

interface ProPrismaOmitProps {
  fields: OmitFieldConfig[];
  value: OmitValue;
  onChange: (value: OmitValue) => void;
}

export function ProPrismaOmit({ fields, value, onChange }: ProPrismaOmitProps) {
  const result = useMemo(() => toPrismaOmit(value), [value]);

  const options = useMemo(
    () => fields.map((f) => ({ label: f.label, value: f.name })),
    [fields],
  );

  const checkedNames = useMemo(
    () => Object.keys(value).filter((k) => value[k] === true),
    [value],
  );

  return (
    <div>
      <Checkbox.Group
        options={options}
        value={checkedNames}
        onChange={(checked) => {
          const checkedSet = new Set(checked as string[]);
          const next: OmitValue = {};
          for (const f of fields) {
            next[f.name] = checkedSet.has(f.name);
          }
          onChange(next);
        }}
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
          Prisma Omit Output:
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
