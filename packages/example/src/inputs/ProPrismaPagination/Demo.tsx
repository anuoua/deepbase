import { useState } from "react";
import { ProPrismaPagination } from "./ProPrismaPagination";
import {
  toPrismaPagination,
  type PaginationValue,
} from "./types";
import {
  dmmfToUniqueFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userPaginationFields = dmmfToUniqueFields(dmmf, "User");

export const ProPrismaPaginationDemo = () => {
  const [pagination, setPagination] = useState<PaginationValue>({
    take: 10,
    skip: 0,
    cursorField: "id",
    cursorValue: 5,
  });

  console.log(
    "Prisma pagination:",
    JSON.stringify(toPrismaPagination(pagination, userPaginationFields), null, 2),
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Pagination Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Configure <code>take</code>, <code>skip</code>, and{" "}
        <code>cursor</code> for pagination (cursor fields use unique fields)
      </p>
      <ProPrismaPagination
        fields={userPaginationFields}
        value={pagination}
        onChange={setPagination}
      />
    </div>
  );
};
