import { useState } from "react";
import { ProPrismaUpdateData } from "./ProPrismaUpdateData";
import { toPrismaUpdateData } from "./types";
import { dmmfToCreateFields, type DmmfDocument } from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userUpdateFields = dmmfToCreateFields(dmmf, "User");

export const ProPrismaUpdateDataDemo = () => {
  const [data, setData] = useState<Record<string, unknown>>({
    name: null,
    role: null,
    posts: { mode: "connect", ids: [] as number[] },
  });

  console.log(
    "Prisma update data:",
    JSON.stringify(toPrismaUpdateData(data, userUpdateFields), null, 2),
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Update Data Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build Prisma <code>update</code> data. All fields are opt-in via
        checkbox. Relations support <code>create</code>, <code>connect</code>,{" "}
        <code>disconnect</code>, <code>delete</code>, and <code>update</code>.
      </p>
      <ProPrismaUpdateData
        fields={userUpdateFields}
        value={data}
        onChange={setData}
      />
    </div>
  );
};