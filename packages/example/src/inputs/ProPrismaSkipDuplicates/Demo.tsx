import { useState } from "react";
import { ProPrismaSkipDuplicates } from "./ProPrismaSkipDuplicates";

export const ProPrismaSkipDuplicatesDemo = () => {
  const [value, setValue] = useState(false);
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Skip Duplicates</h1>
      <ProPrismaSkipDuplicates value={value} onChange={setValue} />
      <pre style={{ marginTop: 16 }}>{JSON.stringify(value)}</pre>
    </div>
  );
};
