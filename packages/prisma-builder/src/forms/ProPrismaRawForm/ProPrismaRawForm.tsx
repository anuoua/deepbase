import { Radio } from "antd";
import { useMemo } from "react";
import { ProPrismaRawFilter } from "../../inputs/ProPrismaRawFilter/ProPrismaRawFilter";
import {
  toPrismaRawForm,
  type RawFormValue,
  type RawMethod,
  emptyRawFormValue,
} from "./types";

interface ProPrismaRawFormProps {
  value: RawFormValue;
  onChange: (value: RawFormValue) => void;
}

export function ProPrismaRawForm({ value, onChange }: ProPrismaRawFormProps) {
  const result = useMemo(() => toPrismaRawForm(value), [value]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Radio.Group
          value={value.method}
          onChange={(e) => onChange(emptyRawFormValue(e.target.value as RawMethod))}
        >
          <Radio.Button value="findRaw">findRaw</Radio.Button>
          <Radio.Button value="aggregateRaw">aggregateRaw</Radio.Button>
        </Radio.Group>
      </div>

      {value.method === "findRaw" && (
        <div style={{ marginBottom: 16 }}>
          <ProPrismaRawFilter
            label="filter"
            value={value.filter}
            onChange={(filter) => onChange({ ...value, filter })}
          />
        </div>
      )}

      {value.method === "aggregateRaw" && (
        <div style={{ marginBottom: 16 }}>
          <ProPrismaRawFilter
            label="pipeline"
            value={value.pipeline}
            onChange={(pipeline) => onChange({ ...value, pipeline })}
          />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <ProPrismaRawFilter
          label="options"
          value={value.options}
          onChange={(options) => onChange({ ...value, options })}
        />
      </div>

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>
          prisma.user.{value.method}() Output:
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
