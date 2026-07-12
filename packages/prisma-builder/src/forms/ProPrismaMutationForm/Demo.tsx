import { useState } from "react";
import { ProPrismaMutationForm } from "./ProPrismaMutationForm";
import { emptyMutationFormValue, type MutationFormFieldConfig } from "./types";
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

const fields: MutationFormFieldConfig = {
  uniqueFields: dmmfToUniqueFields(dmmf, "User"),
  dataFields: dmmfToCreateFields(dmmf, "User"),
  selectFields: dmmfToSelectFields(dmmf, "User"),
  includeFields: dmmfToIncludeFields(dmmf, "User"),
  omitFields: dmmfToOmitFields(dmmf, "User"),
};

export const ProPrismaMutationFormDemo = () => {
  const [value, setValue] = useState(emptyMutationFormValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma update / delete Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build a complete <code>prisma.user.update()</code> or <code>prisma.user.delete()</code> call.
      </p>
      <ProPrismaMutationForm fields={fields} value={value} onChange={setValue} />
    </div>
  );
};
