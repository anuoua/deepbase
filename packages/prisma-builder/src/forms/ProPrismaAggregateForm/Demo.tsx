import { useState } from "react";
import { ProPrismaAggregateForm } from "./ProPrismaAggregateForm";
import { emptyAggregateFormValue, type AggregateFormFieldConfig } from "./types";
import {
  dmmfToWhereFields,
  dmmfToOrderByFields,
  dmmfToPaginationFields,
  dmmfToAggregateFields,
  type DmmfDocument,
} from "../../inputs/ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;

const fields: AggregateFormFieldConfig = {
  whereFields: dmmfToWhereFields(dmmf, "User"),
  orderByFields: dmmfToOrderByFields(dmmf, "User"),
  paginationFields: dmmfToPaginationFields(dmmf, "User"),
  aggregateFields: dmmfToAggregateFields(dmmf, "User"),
};

export const ProPrismaAggregateFormDemo = () => {
  const [value, setValue] = useState(emptyAggregateFormValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma aggregate() Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build a <code>prisma.user.aggregate()</code> call.
      </p>
      <ProPrismaAggregateForm fields={fields} value={value} onChange={setValue} />
    </div>
  );
};
