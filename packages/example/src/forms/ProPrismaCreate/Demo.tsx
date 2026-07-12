import { useState } from "react";
import { ProPrismaCreate } from "./ProPrismaCreate";
import { emptyCreateMethodValue, type CreateMethodFieldConfig } from "./types";
import {
  dmmfToCreateFields,
  dmmfToSelectFields,
  dmmfToIncludeFields,
  dmmfToOmitFields,
  type DmmfDocument,
} from "../../inputs/ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;

const fields: CreateMethodFieldConfig = {
  dataFields: dmmfToCreateFields(dmmf, "User"),
  selectFields: dmmfToSelectFields(dmmf, "User"),
  includeFields: dmmfToIncludeFields(dmmf, "User"),
  omitFields: dmmfToOmitFields(dmmf, "User"),
};

export const ProPrismaCreateDemo = () => {
  const [value, setValue] = useState(emptyCreateMethodValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma create() Method Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build a complete <code>prisma.user.create()</code> call — data + optional
        query shape (select / include / omit).
      </p>
      <ProPrismaCreate fields={fields} value={value} onChange={setValue} />
    </div>
  );
};
