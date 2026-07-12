import { useState } from "react";
import { ProPrismaFindForm } from "./ProPrismaFindForm";
import { emptyFindFormValue, type FindFormFieldConfig } from "./types";
import {
  dmmfToWhereFields,
  dmmfToUniqueFields,
  dmmfToOrderByFields,
  dmmfToPaginationFields,
  dmmfToSelectFields,
  dmmfToIncludeFields,
  dmmfToOmitFields,
  dmmfToDistinctFields,
  type DmmfDocument,
} from "../../inputs/ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;

const fields: FindFormFieldConfig = {
  whereFields: dmmfToWhereFields(dmmf, "User"),
  whereUniqueFields: dmmfToUniqueFields(dmmf, "User"),
  orderByFields: dmmfToOrderByFields(dmmf, "User"),
  paginationFields: dmmfToPaginationFields(dmmf, "User"),
  distinctFields: dmmfToDistinctFields(dmmf, "User"),
  selectFields: dmmfToSelectFields(dmmf, "User"),
  includeFields: dmmfToIncludeFields(dmmf, "User"),
  omitFields: dmmfToOmitFields(dmmf, "User"),
};

export const ProPrismaFindFormDemo = () => {
  const [value, setValue] = useState(emptyFindFormValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma findUnique / findFirst / findMany Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build a complete <code>prisma.user.findUnique()</code>, <code>findFirst</code>, or <code>findMany</code> call.
      </p>
      <ProPrismaFindForm fields={fields} value={value} onChange={setValue} />
    </div>
  );
};
