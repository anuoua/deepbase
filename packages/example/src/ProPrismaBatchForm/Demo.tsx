import { useState } from "react";
import { ProPrismaBatchForm } from "./ProPrismaBatchForm";
import { emptyBatchFormValue, type BatchFormFieldConfig } from "./types";
import {
  dmmfToCreateFields,
  dmmfToWhereFields,
  dmmfToSelectFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;

const fields: BatchFormFieldConfig = {
  createFields: dmmfToCreateFields(dmmf, "User"),
  whereFields: dmmfToWhereFields(dmmf, "User"),
  selectFields: dmmfToSelectFields(dmmf, "User"),
};

export const ProPrismaBatchFormDemo = () => {
  const [value, setValue] = useState(emptyBatchFormValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Batch Operations Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build batch create, update, and delete calls.
      </p>
      <ProPrismaBatchForm fields={fields} value={value} onChange={setValue} />
    </div>
  );
};
