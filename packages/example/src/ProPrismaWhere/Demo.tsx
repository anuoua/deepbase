import { useState } from "react";
import { Tag } from "antd";
import { ProPrismaWhere } from "./ProPrismaWhere";
import { toPrismaWhere, type WhereGroup } from "./types";
import { dmmfToWhereFields, type DmmfDocument } from "../ProPrismaSelect/fromDmmf";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userFields = dmmfToWhereFields(dmmf, "User");

export const ProPrismaWhereDemo = () => {
  const [where, setWhere] = useState<WhereGroup>({
    type: "AND",
    children: [
      { field: "email", operator: "contains", value: "" },
      {
        field: "tags",
        operator: "has",
        value: "typescript",
      },
      {
        field: "posts",
        operator: "some",
        value: {
          type: "AND",
          children: [
            { field: "title", operator: "contains", value: "" },
            { field: "likes", operator: "gt", value: 10 },
          ],
        },
      },
      {
        field: "profile",
        operator: "is",
        value: {
          type: "AND",
          children: [{ field: "bio", operator: "contains", value: "" }],
        },
      },
    ],
  });

  console.log("Prisma where:", JSON.stringify(toPrismaWhere(where, userFields), null, 2));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Where Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Supports scalar fields, scalar list filters (<Tag color="purple">has</Tag> /{" "}
        <Tag color="purple">hasEvery</Tag> / <Tag color="purple">isEmpty</Tag>), to-many relations (
        <Tag color="blue">some</Tag> / <Tag color="green">every</Tag> /{" "}
        <Tag color="orange">none</Tag>), and to-one relations (<Tag color="red">is</Tag> /{" "}
        <Tag color="red">isNot</Tag>)
      </p>
      <ProPrismaWhere
        fields={userFields}
        value={where}
        onChange={setWhere}
        provider={dmmf.provider!}
      />
    </div>
  );
};
