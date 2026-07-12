import { useState } from "react";
import { ProPrismaOrderBy } from "./ProPrismaOrderBy";
import {
  toPrismaOrderBy,
  type OrderByEntry,
  type OrderByValue,
} from "./types";
import {
  dmmfToOrderByFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userOrderByFields = dmmfToOrderByFields(dmmf, "User");

export const ProPrismaOrderByDemo = () => {
  const [orderBy, setOrderBy] = useState<OrderByValue>([
    { field: "email", direction: "asc" as const },
    {
      field: "posts",
      direction: "asc" as const,
      children: [{ field: "title", direction: "asc" as const }],
    },
  ]);

  console.log(
    "Prisma orderBy:",
    JSON.stringify(toPrismaOrderBy(orderBy, userOrderByFields), null, 2),
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma OrderBy Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Supports scalar field sorting and nested relation sorting (e.g.,{" "}
        <code>posts: &#123; title: "asc" &#125;</code>)
      </p>
      <ProPrismaOrderBy
        fields={userOrderByFields}
        value={orderBy}
        onChange={setOrderBy}
      />
    </div>
  );
};