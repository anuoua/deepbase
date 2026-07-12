import { useState } from "react";
import { ProPrismaCountForm } from "./ProPrismaCountForm";
import { emptyCountFormValue, type CountFormFieldConfig } from "./types";
import {
  dmmfToWhereFields,
  dmmfToOrderByFields,
  dmmfToPaginationFields,
  type DmmfDocument,
} from "../../inputs/ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const model = dmmf.datamodel.models.find((m) => m.name === "User")!;

const fields: CountFormFieldConfig = {
  whereFields: dmmfToWhereFields(dmmf, "User"),
  orderByFields: dmmfToOrderByFields(dmmf, "User"),
  paginationFields: dmmfToPaginationFields(dmmf, "User"),
  allFieldNames: model.fields
    .filter((f: { isReadOnly: boolean; kind: string }) => !f.isReadOnly && f.kind !== "object")
    .map((f: { name: string }) => f.name),
};

export const ProPrismaCountFormDemo = () => {
  const [value, setValue] = useState(emptyCountFormValue());

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma count() Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build a <code>prisma.user.count()</code> call.
      </p>
      <ProPrismaCountForm fields={fields} value={value} onChange={setValue} />
    </div>
  );
};
