import { useMemo, useState } from "react";
import { ProPrismaBatchData } from "./ProPrismaBatchData";
import { emptyBatchDataValue, toPrismaBatchData, type BatchDataValue, type BatchDataFieldConfig } from "./types";
import { mergePlaceholders } from "../ProPrismaPlaceholder/utils";

const SAMPLE_EXTERNAL = { email: "alice@test.com", name: "Alice", age: 30, role: "USER" };

const fields: BatchDataFieldConfig = {
  fields: [
    { name: "email", label: "Email", type: "string" },
    { name: "name", label: "Name", type: "string" },
    { name: "age", label: "Age", type: "number" },
    { name: "role", label: "Role", type: "enum", enums: [{ label: "User", value: "USER" }, { label: "Admin", value: "ADMIN" }] },
  ],
};

export const ProPrismaBatchDataDemo = () => {
  const [value, setValue] = useState<BatchDataValue>(emptyBatchDataValue());
  const rawOutput = useMemo(() => toPrismaBatchData(value), [value]);
  const mergedOutput = useMemo(() => rawOutput.map((row) => mergePlaceholders(row, SAMPLE_EXTERNAL)), [rawOutput]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Batch Data Input</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>Add rows of data for batch create/update operations.</p>
      <ProPrismaBatchData fields={fields} value={value} onChange={setValue} />
      <pre style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, fontSize: 13 }}>
        {JSON.stringify(rawOutput, null, 2)}
      </pre>
      <div style={{ marginTop: 16, padding: 12, background: "#fffbe6", borderRadius: 6, border: "1px solid #ffe58f" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#ad8b00" }}>
          Merged Output (with external data)
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(mergedOutput, null, 2)}
        </pre>
      </div>
    </div>
  );
};
