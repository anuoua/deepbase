import { useMemo, useState } from "react";
import { Tag } from "antd";
import { ProPrismaWhere } from "./ProPrismaWhere";
import { toPrismaWhere, type WhereGroup } from "./types";
import { dmmfToWhereFields, type DmmfDocument } from "../ProPrismaSelect/fromDmmf";
import { mergePlaceholders } from "../ProPrismaPlaceholder/utils";
import dmmfRaw from "../../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userFields = dmmfToWhereFields(dmmf, "User");

const SAMPLE_EXTERNAL: Record<string, unknown> = {
  email: "alice@example.com",
  tags: "typescript",
};

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

  const rawOutput = useMemo(() => toPrismaWhere(where, userFields), [where, userFields]);
  const mergedOutput = useMemo(() => mergePlaceholders(rawOutput, SAMPLE_EXTERNAL), [rawOutput]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Where Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Supports scalar fields, scalar list filters (<Tag color="purple">has</Tag> /{" "}
        <Tag color="purple">hasEvery</Tag> / <Tag color="purple">isEmpty</Tag>), to-many relations (
        <Tag color="blue">some</Tag> / <Tag color="green">every</Tag> /{" "}
        <Tag color="orange">none</Tag>), and to-one relations (<Tag color="red">is</Tag> /{" "}
        <Tag color="red">isNot</Tag>). Use the <Tag>P</Tag> toggle next to a value
        input to mark it as a placeholder — it becomes <code>"__USERINPUT__"</code>{" "}
        and gets replaced via <code>mergePlaceholders</code>.
      </p>
      <ProPrismaWhere
        fields={userFields}
        value={where}
        onChange={setWhere}
        provider={dmmf.provider!}
      />

      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: "#fffbe6",
          borderRadius: 6,
          border: "1px solid #ffe58f",
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#ad8b00" }}>
          Merged Output (with external data)
        </div>
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 13,
          }}
        >
          {JSON.stringify(mergedOutput, null, 2)}
        </pre>
      </div>
    </div>
  );
};
