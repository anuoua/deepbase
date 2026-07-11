import { useState } from "react";
import { ProPrismaRawForm } from "./ProPrismaRawForm";
import { emptyRawFormValue, type RawFormValue } from "./types";

export const ProPrismaRawFormDemo = () => {
  const [value, setValue] = useState<RawFormValue>(emptyRawFormValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Raw Operations Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build <code>prisma.$runCommandRaw()</code>-compatible raw queries via <code>findRaw</code> or <code>aggregateRaw</code>.
      </p>
      <ProPrismaRawForm value={value} onChange={setValue} />
    </div>
  );
};
