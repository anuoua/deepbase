import { Select } from "antd";
import { useMemo } from "react";
import { toPrismaDistinct, type DistinctFieldConfig, type DistinctValue } from "./types";

interface ProPrismaDistinctProps {
  fields: DistinctFieldConfig[];
  value: DistinctValue;
  onChange: (value: DistinctValue) => void;
}

export function ProPrismaDistinct({
  fields,
  value,
  onChange,
}: ProPrismaDistinctProps) {
  const result = useMemo(() => toPrismaDistinct(value), [value]);

  const options = useMemo(
    () => fields.map((f) => ({ label: f.label, value: f.name })),
    [fields],
  );

  return (
    <div>
      <Select
        allowClear
        mode="multiple"
        options={options}
        placeholder="Select fields for distinct"
        showSearch
        style={{ minWidth: 300 }}
        value={value}
        onChange={onChange}
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
          Prisma Distinct Output:
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
