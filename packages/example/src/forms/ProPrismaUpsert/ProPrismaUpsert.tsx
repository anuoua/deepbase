import { Radio } from "antd";
import { useMemo } from "react";
import { ProPrismaWhereUnique } from "../../inputs/ProPrismaWhereUnique/ProPrismaWhereUnique";
import { ProPrismaCreateData } from "../../inputs/ProPrismaCreateData/ProPrismaCreateData";
import { ProPrismaUpdateData } from "../../inputs/ProPrismaUpdateData/ProPrismaUpdateData";
import { ProPrismaSelect } from "../../inputs/ProPrismaSelect/ProPrismaSelect";
import { ProPrismaInclude } from "../../inputs/ProPrismaInclude/ProPrismaInclude";
import { ProPrismaOmit } from "../../inputs/ProPrismaOmit/ProPrismaOmit";
import { toPrismaUpsert, type UpsertValue, type UpsertFieldConfig, type QueryShape } from "./types";

interface ProPrismaUpsertProps {
  fields: UpsertFieldConfig;
  value: UpsertValue;
  onChange: (value: UpsertValue) => void;
}

export function ProPrismaUpsert({ fields, value, onChange }: ProPrismaUpsertProps) {
  const result = useMemo(() => toPrismaUpsert(value, fields), [value, fields]);

  return (
    <div>
      <div style={{ border: "1px solid #d9d9d9", borderRadius: 6, padding: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 14, color: "#333" }}>where (unique)</div>
        <ProPrismaWhereUnique
          fields={fields.uniqueFields}
          value={value.where}
          onChange={(where) => onChange({ ...value, where })}
        />
      </div>

      <div style={{ border: "1px solid #d9d9d9", borderRadius: 6, padding: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 14, color: "#333" }}>create data</div>
        <ProPrismaCreateData
          fields={fields.createFields}
          value={value.create}
          onChange={(create) => onChange({ ...value, create })}
        />
      </div>

      <div style={{ border: "1px solid #d9d9d9", borderRadius: 6, padding: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 14, color: "#333" }}>update data</div>
        <ProPrismaUpdateData
          fields={fields.updateFields}
          value={value.update}
          onChange={(update) => onChange({ ...value, update })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 14, color: "#333" }}>Query Shape</div>
        <Radio.Group
          value={value.queryShape}
          onChange={(e) => onChange({ ...value, queryShape: e.target.value as QueryShape })}
        >
          <Radio.Button value="none">None</Radio.Button>
          <Radio.Button value="select">Select</Radio.Button>
          <Radio.Button value="include">Include</Radio.Button>
          <Radio.Button value="omit">Omit</Radio.Button>
        </Radio.Group>
      </div>

      {value.queryShape === "select" && (
        <div style={{ marginBottom: 16 }}>
          <ProPrismaSelect
            fields={fields.selectFields}
            value={value.select}
            onChange={(select) => onChange({ ...value, select })}
          />
        </div>
      )}
      {value.queryShape === "include" && (
        <div style={{ marginBottom: 16 }}>
          <ProPrismaInclude
            fields={fields.includeFields}
            value={value.include}
            onChange={(include) => onChange({ ...value, include })}
          />
        </div>
      )}
      {value.queryShape === "omit" && (
        <div style={{ marginBottom: 16 }}>
          <ProPrismaOmit
            fields={fields.omitFields}
            value={value.omit}
            onChange={(omit) => onChange({ ...value, omit })}
          />
        </div>
      )}

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>Prisma Upsert Output:</div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
