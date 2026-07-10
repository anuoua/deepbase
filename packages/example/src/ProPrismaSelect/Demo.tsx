import { useState } from "react";
import { ProPrismaSelect } from "./ProPrismaSelect";
import {
  emptySelectValue,
  toPrismaSelect,
  type SelectValue,
} from "./types";
import { dmmfToSelectFields, type DmmfDocument } from "./fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userSelectFields = dmmfToSelectFields(dmmf, "User");

export const ProPrismaSelectDemo = () => {
  const [select, setSelect] = useState<SelectValue>(() =>
    emptySelectValue(userSelectFields),
  );

  console.log(
    "Prisma select:",
    JSON.stringify(toPrismaSelect(select, userSelectFields), null, 2),
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Select Builder</h1>
      <ProPrismaSelect
        fields={userSelectFields}
        value={select}
        onChange={setSelect}
      />
    </div>
  );
};