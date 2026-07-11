import { useState } from "react";
import { ProPrismaWhereUnique } from "./ProPrismaWhereUnique";
import {
  toPrismaWhereUnique,
  type WhereUniqueValue,
} from "./types";
import {
  dmmfToUniqueFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userUniqueFields = dmmfToUniqueFields(dmmf, "User");

export const ProPrismaWhereUniqueDemo = () => {
  const [whereUnique, setWhereUnique] = useState<WhereUniqueValue>({
    field: "id",
    value: 1,
  });

  console.log(
    "Prisma whereUnique:",
    JSON.stringify(toPrismaWhereUnique(whereUnique, userUniqueFields), null, 2),
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Where Unique Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build a unique identifier for <code>findUnique</code>,{" "}
        <code>update</code>, <code>delete</code>, and <code>upsert</code>{" "}
        (selects from <code>@id</code> and <code>@unique</code> fields)
      </p>
      <ProPrismaWhereUnique
        fields={userUniqueFields}
        value={whereUnique}
        onChange={setWhereUnique}
      />
    </div>
  );
};
