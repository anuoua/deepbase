import { useState, useMemo } from "react";
import { ProPrismaUpsert } from "./ProPrismaUpsert";
import { emptyUpsertValue, toPrismaUpsert, type UpsertValue, type UpsertFieldConfig } from "./types";
import { mergePlaceholders } from "../../inputs/ProPrismaPlaceholder/utils";
import {
  dmmfToUniqueFields,
  dmmfToCreateFields,
  dmmfToSelectFields,
  dmmfToIncludeFields,
  dmmfToOmitFields,
  type DmmfDocument,
} from "../../inputs/ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;

const fields: UpsertFieldConfig = {
  uniqueFields: dmmfToUniqueFields(dmmf, "User"),
  createFields: dmmfToCreateFields(dmmf, "User"),
  updateFields: dmmfToCreateFields(dmmf, "User"),
  selectFields: dmmfToSelectFields(dmmf, "User"),
  includeFields: dmmfToIncludeFields(dmmf, "User"),
  omitFields: dmmfToOmitFields(dmmf, "User"),
};

const SAMPLE_EXTERNAL = { name: "Bob", email: "bob@test.com", role: "USER" };

export const ProPrismaUpsertDemo = () => {
  const [upsert, setUpsert] = useState<UpsertValue>(emptyUpsertValue());
  const rawOutput = useMemo(() => toPrismaUpsert(upsert, fields), [upsert]);
  const mergedOutput = useMemo(() => mergePlaceholders(rawOutput, SAMPLE_EXTERNAL), [rawOutput]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Upsert Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build a Prisma <code>upsert</code> operation combining a unique where clause, create data, update data, and optional query shape.
      </p>
      <ProPrismaUpsert
        fields={fields}
        value={upsert}
        onChange={setUpsert}
      />

      <div style={{ marginTop: 16, padding: 12, background: "#fffbe6", borderRadius: 6, border: "1px solid #ffe58f" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#ad8b00" }}>Merged Output (with sample external data):</div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(mergedOutput, null, 2)}
        </pre>
      </div>
    </div>
  );
};
