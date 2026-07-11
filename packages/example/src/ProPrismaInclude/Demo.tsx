import { useState } from "react";
import { ProPrismaInclude } from "./ProPrismaInclude";
import type { IncludeValue } from "./types";
import { dmmfToIncludeFields, type DmmfDocument } from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userIncludeFields = dmmfToIncludeFields(dmmf, "User");

export const ProPrismaIncludeDemo = () => {
  const [include, setInclude] = useState<IncludeValue>({});
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Include Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Include related records with optional filtering, sorting, and pagination.
      </p>
      <ProPrismaInclude
        fields={userIncludeFields}
        value={include}
        onChange={setInclude}
      />
    </div>
  );
};
