import { useState } from "react";
import { ProPrismaUpsert } from "./ProPrismaUpsert";
import {
  toPrismaWhereUnique,
  toPrismaCreateData,
  toPrismaUpdateData,
  type UpsertValue,
} from "./types";
import {
  dmmfToUniqueFields,
  dmmfToCreateFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const uniqueFields = dmmfToUniqueFields(dmmf, "User");
const createFields = dmmfToCreateFields(dmmf, "User");
const updateFields = dmmfToCreateFields(dmmf, "User");

export const ProPrismaUpsertDemo = () => {
  const [upsert, setUpsert] = useState<UpsertValue>({
    where: { field: "id", value: 1 },
    create: { name: null, email: null },
    update: {},
  });

  console.log(
    "Prisma upsert:",
    JSON.stringify(
      {
        where: toPrismaWhereUnique(upsert.where, uniqueFields),
        create: toPrismaCreateData(upsert.create, createFields),
        update: toPrismaUpdateData(upsert.update, updateFields),
      },
      null,
      2,
    ),
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Upsert Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build a Prisma <code>upsert</code> operation combining a unique where
        clause, create data, and update data.
      </p>
      <ProPrismaUpsert
        fields={{ uniqueFields, createFields, updateFields }}
        value={upsert}
        onChange={setUpsert}
      />
    </div>
  );
};
