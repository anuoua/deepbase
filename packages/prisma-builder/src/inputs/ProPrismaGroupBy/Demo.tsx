import { useState } from "react";
import { ProPrismaGroupBy } from "./ProPrismaGroupBy";
import { toPrismaAggregate, type GroupByValue } from "./types";
import {
  dmmfToAggregateFields,
  dmmfToDistinctFields,
  type DmmfDocument,
} from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userScalarFields = dmmfToDistinctFields(dmmf, "User");
const userAggregateFields = dmmfToAggregateFields(dmmf, "User");

export const ProPrismaGroupByDemo = () => {
  const [groupBy, setGroupBy] = useState<GroupByValue>({
    by: ["role"],
    aggregate: { age: ["_avg"] },
  });

  const result = {
    ...(groupBy.by.length > 0 ? { by: groupBy.by } : {}),
    ...toPrismaAggregate(groupBy.aggregate, userAggregateFields),
  };

  console.log("Prisma groupBy:", JSON.stringify(result, null, 2));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma GroupBy Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Choose grouping fields and aggregation operations for a{" "}
        <code>groupBy</code> query.
      </p>
      <ProPrismaGroupBy
        fields={{
          scalarFields: userScalarFields,
          aggregateFields: userAggregateFields,
        }}
        value={groupBy}
        onChange={setGroupBy}
      />
    </div>
  );
};
