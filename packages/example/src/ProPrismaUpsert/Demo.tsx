import { useState } from "react";
import { ProPrismaUpsert } from "./ProPrismaUpsert";
import { emptyUpsertValue, type UpsertValue, type UpsertFieldConfig } from "./types";
import {
  dmmfToUniqueFields,
  dmmfToCreateFields,
  dmmfToSelectFields,
  dmmfToIncludeFields,
  dmmfToOmitFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;

const fields: UpsertFieldConfig = {
  uniqueFields: dmmfToUniqueFields(dmmf, "User"),
  createFields: dmmfToCreateFields(dmmf, "User"),
  updateFields: dmmfToCreateFields(dmmf, "User"),
  selectFields: dmmfToSelectFields(dmmf, "User"),
  includeFields: dmmfToIncludeFields(dmmf, "User"),
  omitFields: dmmfToOmitFields(dmmf, "User"),
};

export const ProPrismaUpsertDemo = () => {
  const [upsert, setUpsert] = useState<UpsertValue>(emptyUpsertValue());

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
    </div>
  );
};
