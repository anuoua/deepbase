import { useState } from "react";
import { ProPrismaBatchData } from "./ProPrismaBatchData";
import { emptyBatchDataValue, toPrismaBatchData, type BatchDataValue, type BatchDataFieldConfig } from "./types";

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

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Batch Data Input</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>Add rows of data for batch create/update operations.</p>
      <ProPrismaBatchData fields={fields} value={value} onChange={setValue} />
      <pre style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, fontSize: 13 }}>
        {JSON.stringify(toPrismaBatchData(value), null, 2)}
      </pre>
    </div>
  );
};
