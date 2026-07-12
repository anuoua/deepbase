import { Tag } from "antd";
import { useMemo, useState } from "react";
import { ProPrismaInclude } from "./ProPrismaInclude";
import { toPrismaInclude, type IncludeValue } from "./types";
import { dmmfToIncludeFields, type DmmfDocument } from "../ProPrismaSelect/fromDmmf";
import { mergePlaceholders } from "../ProPrismaPlaceholder/utils";
import dmmfRaw from "../../DMMF.json";

const dmmf = dmmfRaw as DmmfDocument;
const userIncludeFields = dmmfToIncludeFields(dmmf, "User");

const SAMPLE_EXTERNAL: Record<string, unknown> = {
  where: { published: true },
  orderBy: [{ createdAt: "desc" }],
  take: 10,
  skip: 0,
};

export const ProPrismaIncludeDemo = () => {
  const [include, setInclude] = useState<IncludeValue>({});

  const rawOutput = useMemo(() => toPrismaInclude(include, userIncludeFields), [include]);
  const mergedOutput = useMemo(() => mergePlaceholders(rawOutput, SAMPLE_EXTERNAL), [rawOutput]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Prisma Include Builder</h1>
      <p style={{ marginBottom: 16, color: "#666" }}>
        Include related records with optional filtering, sorting, and pagination.
        Use the <Tag>P</Tag> toggle next to where/orderBy/take/skip to mark
        values as placeholders.
      </p>
      <ProPrismaInclude
        fields={userIncludeFields}
        value={include}
        onChange={setInclude}
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
          style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}
        >
          {JSON.stringify(mergedOutput, null, 2)}
        </pre>
      </div>
    </div>
  );
};
