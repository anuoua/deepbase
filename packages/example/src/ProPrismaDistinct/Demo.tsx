import { useState } from "react";
import { ProPrismaDistinct } from "./ProPrismaDistinct";
import { toPrismaDistinct, type DistinctValue } from "./types";
import { dmmfToDistinctFields, type DmmfDocument } from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userDistinctFields = dmmfToDistinctFields(dmmf, "User");

export const ProPrismaDistinctDemo = () => {
  const [distinct, setDistinct] = useState<DistinctValue>(["role"]);

  console.log(
    "Prisma distinct:",
    JSON.stringify(toPrismaDistinct(distinct), null, 2),
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Distinct Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Select fields for the <code>distinct</code> option. Returns an array of
        field names to deduplicate query results by.
      </p>
      <ProPrismaDistinct
        fields={userDistinctFields}
        value={distinct}
        onChange={setDistinct}
      />
    </div>
  );
};
