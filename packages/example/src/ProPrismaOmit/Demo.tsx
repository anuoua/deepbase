import { useState } from "react";
import { ProPrismaOmit } from "./ProPrismaOmit";
import { toPrismaOmit, type OmitValue } from "./types";
import { dmmfToOmitFields, type DmmfDocument } from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userOmitFields = dmmfToOmitFields(dmmf, "User");

export const ProPrismaOmitDemo = () => {
  const [omit, setOmit] = useState<OmitValue>({ password: true });

  console.log(
    "Prisma omit:",
    JSON.stringify(toPrismaOmit(omit), null, 2),
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Omit Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Select fields to exclude from query results via <code>omit</code>.
        Mutually exclusive with <code>select</code>.
      </p>
      <ProPrismaOmit
        fields={userOmitFields}
        value={omit}
        onChange={setOmit}
      />
    </div>
  );
};
