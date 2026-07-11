import { useState } from "react";
import { ProPrismaGroupByForm } from "./ProPrismaGroupByForm";
import { emptyGroupByFormValue, type GroupByFormFieldConfig } from "./types";
import {
  dmmfToWhereFields,
  dmmfToOrderByFields,
  dmmfToPaginationFields,
  dmmfToAggregateFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const model = dmmf.datamodel.models.find((m: { name: string }) => m.name === "User")!;

const fields: GroupByFormFieldConfig = {
  byFieldNames: model.fields
    .filter((f: { isReadOnly: boolean; kind: string }) => !f.isReadOnly && f.kind !== "object")
    .map((f: { name: string }) => f.name),
  whereFields: dmmfToWhereFields(dmmf, "User"),
  orderByFields: dmmfToOrderByFields(dmmf, "User"),
  paginationFields: dmmfToPaginationFields(dmmf, "User"),
  aggregateFields: dmmfToAggregateFields(dmmf, "User"),
};

export const ProPrismaGroupByFormDemo = () => {
  const [value, setValue] = useState(emptyGroupByFormValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma groupBy() Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build a <code>prisma.user.groupBy()</code> call.
      </p>
      <ProPrismaGroupByForm fields={fields} value={value} onChange={setValue} />
    </div>
  );
};
