import { Radio } from "antd";
import { useMemo } from "react";
import { ProPrismaWhereUnique } from "../../inputs/ProPrismaWhereUnique/ProPrismaWhereUnique";
import { ProPrismaUpdateData } from "../../inputs/ProPrismaUpdateData/ProPrismaUpdateData";
import { ProPrismaSelect } from "../../inputs/ProPrismaSelect/ProPrismaSelect";
import { ProPrismaInclude } from "../../inputs/ProPrismaInclude/ProPrismaInclude";
import { ProPrismaOmit } from "../../inputs/ProPrismaOmit/ProPrismaOmit";
import {
  toPrismaMutationForm,
  type MutationFormFieldConfig,
  type MutationFormValue,
  type MutationMethod,
  type QueryShape,
  emptyMutationFormValue,
} from "./types";

interface ProPrismaMutationFormProps {
  fields: MutationFormFieldConfig;
  value: MutationFormValue;
  onChange: (value: MutationFormValue) => void;
}

export function ProPrismaMutationForm({ fields, value, onChange }: ProPrismaMutationFormProps) {
  const result = useMemo(() => toPrismaMutationForm(value, fields), [value, fields]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Radio.Group
          value={value.method}
          onChange={(e) => onChange(emptyMutationFormValue(e.target.value as MutationMethod))}
        >
          <Radio.Button value="update">update</Radio.Button>
          <Radio.Button value="delete">delete</Radio.Button>
        </Radio.Group>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>where (unique)</h4>
        <ProPrismaWhereUnique
          fields={fields.uniqueFields}
          value={value.whereUnique}
          onChange={(whereUnique) => onChange({ ...value, whereUnique })}
        />
      </div>

      {value.method === "update" && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>data</h4>
          <ProPrismaUpdateData
            fields={fields.dataFields}
            value={value.data}
            onChange={(data) => onChange({ ...value, data })}
          />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>Query Shape</h4>
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
        <ProPrismaSelect
          fields={fields.selectFields}
          value={value.select}
          onChange={(select) => onChange({ ...value, select })}
        />
      )}
      {value.queryShape === "include" && (
        <ProPrismaInclude
          fields={fields.includeFields}
          value={value.include}
          onChange={(include) => onChange({ ...value, include })}
        />
      )}
      {value.queryShape === "omit" && (
        <ProPrismaOmit
          fields={fields.omitFields}
          value={value.omit}
          onChange={(omit) => onChange({ ...value, omit })}
        />
      )}

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>
          prisma.user.{value.method}() Output:
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
