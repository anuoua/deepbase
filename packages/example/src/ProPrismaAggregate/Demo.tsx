import { useState } from "react";
import { ProPrismaAggregate } from "./ProPrismaAggregate";
import { toPrismaAggregate, type AggregateValue } from "./types";
import { dmmfToAggregateFields, type DmmfDocument } from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const postAggregateFields = dmmfToAggregateFields(dmmf, "Post");

export const ProPrismaAggregateDemo = () => {
  const [aggregate, setAggregate] = useState<AggregateValue>({
    likes: ["_sum", "_avg"],
  });

  console.log(
    "Prisma aggregate:",
    JSON.stringify(toPrismaAggregate(aggregate, postAggregateFields), null, 2),
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Aggregate Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Select aggregation operations (<code>_sum</code>, <code>_avg</code>,{" "}
        <code>_min</code>, <code>_max</code>, <code>_count</code>) for each
        field. <code>_sum</code>/<code>_avg</code> apply to numbers,{" "}
        <code>_min</code>/<code>_max</code> to numbers/dates/strings,{" "}
        <code>_count</code> to all.
      </p>
      <ProPrismaAggregate
        fields={postAggregateFields}
        value={aggregate}
        onChange={setAggregate}
      />
    </div>
  );
};
