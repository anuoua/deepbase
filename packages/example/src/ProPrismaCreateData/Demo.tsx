import { useMemo, useState } from "react";
import { ProPrismaCreateData } from "./ProPrismaCreateData";
import {
  toPrismaCreateData,
  hasChildren,
  type CreateFieldConfig,
} from "./types";
import {
  dmmfToCreateFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import { mergePlaceholders } from "../ProPrismaPlaceholder/utils";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userCreateFields = dmmfToCreateFields(dmmf, "User");

const SAMPLE_EXTERNAL: Record<string, unknown> = {
  name: "Alice Johnson",
  email: "alice@example.com",
  role: "USER",
};

export const ProPrismaCreateDataDemo = () => {
  const [data, setData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const field of userCreateFields) {
      if (field.isRequired !== false && !hasChildren(field)) {
        initial[field.name] = null;
      }
    }
    return initial;
  });

  const rawOutput = useMemo(
    () => toPrismaCreateData(data, userCreateFields),
    [data],
  );
  const mergedOutput = useMemo(
    () => mergePlaceholders(rawOutput, SAMPLE_EXTERNAL),
    [rawOutput],
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Create Data Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build Prisma <code>create</code> data. Required fields are shown by
        default; optional fields have a toggle. Relations support nested create,
        connect, and connectOrCreate. Use the <code>P</code> toggle to mark a
        value as a placeholder — it renders as <code>"__USERINPUT__"</code> in
        the output and gets replaced via <code>mergePlaceholders</code>.
      </p>
      <ProPrismaCreateData
        fields={userCreateFields}
        value={data}
        onChange={setData}
      />

      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: "#fffbe6",
          borderRadius: 6,
          border: "1px solid #ffe58f",
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#ad8b00" }}>
          Merged Output (with external data)
        </div>
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 13,
          }}
        >
          {JSON.stringify(mergedOutput, null, 2)}
        </pre>
      </div>
    </div>
  );
};