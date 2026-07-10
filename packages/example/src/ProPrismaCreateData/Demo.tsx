import { useState } from "react";
import { ProPrismaCreateData } from "./ProPrismaCreateData";
import {
  toPrismaCreateData,
  hasChildren,
  type CreateFieldConfig,
} from "./types";
import {
  dmmfToCreateFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userCreateFields = dmmfToCreateFields(dmmf, "User");

export const ProPrismaCreateDataDemo = () => {
  const [data, setData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const field of userCreateFields) {
      if (field.isRequired !== false && !hasChildren(field)) {
        initial[field.name] = null;
      }
    }
    return initial;
  });

  console.log(
    "Prisma create data:",
    JSON.stringify(toPrismaCreateData(data, userCreateFields), null, 2),
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Create Data Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Build Prisma <code>create</code> data. Required fields are shown by
        default; optional fields have a toggle. Relations support nested create.
      </p>
      <ProPrismaCreateData
        fields={userCreateFields}
        value={data}
        onChange={setData}
      />
    </div>
  );
};