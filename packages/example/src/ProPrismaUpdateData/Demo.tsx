import { useMemo, useState } from "react";
import { ProPrismaUpdateData } from "./ProPrismaUpdateData";
import { toPrismaUpdateData } from "./types";
import { dmmfToCreateFields, type DmmfDocument } from "../ProPrismaSelect/fromDmmf";
import { mergePlaceholders } from "../ProPrismaPlaceholder/utils";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userUpdateFields = dmmfToCreateFields(dmmf, "User");

const SAMPLE_EXTERNAL: Record<string, unknown> = {
  name: "Alice",
  role: "ADMIN",
};

export const ProPrismaUpdateDataDemo = () => {
  const [data, setData] = useState<Record<string, unknown>>({
    name: null,
    role: null,
    posts: { mode: "connect", ids: [] as number[] },
  });

  const rawOutput = useMemo(
    () => toPrismaUpdateData(data, userUpdateFields),
    [data],
  );
  const mergedOutput = useMemo(
    () => mergePlaceholders(rawOutput, SAMPLE_EXTERNAL),
    [rawOutput],
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Update Data Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build Prisma <code>update</code> data. All fields are opt-in via
        checkbox. Relations support <code>create</code>, <code>connect</code>,{" "}
        <code>connectOrCreate</code>, <code>disconnect</code>,{" "}
        <code>delete</code>, <code>update</code>, <code>updateMany</code>,{" "}
        <code>deleteMany</code>, <code>upsert</code>, and <code>set</code>. Use
        the <code>P</code> toggle to mark a value as a placeholder — it renders
        as <code>"__USERINPUT__"</code> in the output and gets replaced via{" "}
        <code>mergePlaceholders</code>.
      </p>
      <ProPrismaUpdateData
        fields={userUpdateFields}
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