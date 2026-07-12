import { Radio } from "antd";
import { useMemo } from "react";
import { ProPrismaCreateData } from "../../inputs/ProPrismaCreateData/ProPrismaCreateData";
import { ProPrismaSelect } from "../../inputs/ProPrismaSelect/ProPrismaSelect";
import { ProPrismaInclude } from "../../inputs/ProPrismaInclude/ProPrismaInclude";
import { ProPrismaOmit } from "../../inputs/ProPrismaOmit/ProPrismaOmit";
import { emptySelectValue } from "../../inputs/ProPrismaSelect/types";
import { toPrismaCreateMethod, type CreateMethodFieldConfig, type CreateMethodValue, type QueryShape } from "./types";

interface ProPrismaCreateProps {
  fields: CreateMethodFieldConfig;
  value: CreateMethodValue;
  onChange: (value: CreateMethodValue) => void;
}

export function ProPrismaCreate({ fields, value, onChange }: ProPrismaCreateProps) {
  const result = useMemo(
    () => toPrismaCreateMethod(value, fields),
    [value, fields],
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>data</h3>
        <ProPrismaCreateData
          fields={fields.dataFields}
          value={value.data}
          onChange={(data) => onChange({ ...value, data })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Query Shape</h3>
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
        <div style={{ marginBottom: 24 }}>
          <ProPrismaSelect
            fields={fields.selectFields}
            value={value.select}
            onChange={(select) => onChange({ ...value, select })}
          />
        </div>
      )}

      {value.queryShape === "include" && (
        <div style={{ marginBottom: 24 }}>
          <ProPrismaInclude
            fields={fields.includeFields}
            value={value.include}
            onChange={(include) => onChange({ ...value, include })}
          />
        </div>
      )}

      {value.queryShape === "omit" && (
        <div style={{ marginBottom: 24 }}>
          <ProPrismaOmit
            fields={fields.omitFields}
            value={value.omit}
            onChange={(omit) => onChange({ ...value, omit })}
          />
        </div>
      )}

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
          prisma.user.create() Output:
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
