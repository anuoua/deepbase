import { useMemo } from "react";
import { ProPrismaWhereUnique } from "../ProPrismaWhereUnique/ProPrismaWhereUnique";
import { ProPrismaCreateData } from "../ProPrismaCreateData/ProPrismaCreateData";
import { ProPrismaUpdateData } from "../ProPrismaUpdateData/ProPrismaUpdateData";
import { toPrismaWhereUnique } from "../ProPrismaWhereUnique/types";
import { toPrismaCreateData } from "../ProPrismaCreateData/types";
import { toPrismaUpdateData } from "../ProPrismaUpdateData/types";
import type { UpsertValue, UpsertFieldConfig } from "./types";

interface ProPrismaUpsertProps {
  fields: UpsertFieldConfig;
  value: UpsertValue;
  onChange: (value: UpsertValue) => void;
}

export function ProPrismaUpsert({
  fields,
  value,
  onChange,
}: ProPrismaUpsertProps) {
  const result = useMemo(() => {
    const where = toPrismaWhereUnique(value.where, fields.uniqueFields);
    const create = toPrismaCreateData(value.create, fields.createFields);
    const update = toPrismaUpdateData(value.update, fields.updateFields);
    return { where, create, update };
  }, [value, fields]);

  return (
    <div>
      <div
        style={{
          border: "1px solid #d9d9d9",
          borderRadius: 6,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            marginBottom: 8,
            fontWeight: 500,
            fontSize: 14,
            color: "#333",
          }}
        >
          where (unique)
        </div>
        <ProPrismaWhereUnique
          fields={fields.uniqueFields}
          value={value.where}
          onChange={(where) => onChange({ ...value, where })}
        />
      </div>

      <div
        style={{
          border: "1px solid #d9d9d9",
          borderRadius: 6,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            marginBottom: 8,
            fontWeight: 500,
            fontSize: 14,
            color: "#333",
          }}
        >
          create data
        </div>
        <ProPrismaCreateData
          fields={fields.createFields}
          value={value.create}
          onChange={(create) => onChange({ ...value, create })}
        />
      </div>

      <div
        style={{
          border: "1px solid #d9d9d9",
          borderRadius: 6,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            marginBottom: 8,
            fontWeight: 500,
            fontSize: 14,
            color: "#333",
          }}
        >
          update data
        </div>
        <ProPrismaUpdateData
          fields={fields.updateFields}
          value={value.update}
          onChange={(update) => onChange({ ...value, update })}
        />
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: "#f5f5f5",
          borderRadius: 6,
          border: "1px solid #d9d9d9",
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>
          Prisma Upsert Output:
        </div>
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 13,
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
