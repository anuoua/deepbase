import { Radio } from "antd";
import { useMemo } from "react";
import { ProPrismaBatchData } from "../../inputs/ProPrismaBatchData/ProPrismaBatchData";
import { ProPrismaSkipDuplicates } from "../../inputs/ProPrismaSkipDuplicates/ProPrismaSkipDuplicates";
import { ProPrismaWhere } from "../../inputs/ProPrismaWhere/ProPrismaWhere";
import { ProPrismaSelect } from "../../inputs/ProPrismaSelect/ProPrismaSelect";
import {
  toPrismaBatchForm,
  type BatchFormFieldConfig,
  type BatchFormValue,
  type BatchMethod,
  emptyBatchFormValue,
} from "./types";

interface ProPrismaBatchFormProps {
  fields: BatchFormFieldConfig;
  value: BatchFormValue;
  onChange: (value: BatchFormValue) => void;
}

export function ProPrismaBatchForm({ fields, value, onChange }: ProPrismaBatchFormProps) {
  const result = useMemo(() => toPrismaBatchForm(value, fields), [value, fields]);

  const isCreate = value.method === "createMany" || value.method === "createManyAndReturn";
  const isUpdateDelete = !isCreate;
  const hasReturn = value.method === "createManyAndReturn" || value.method === "updateManyAndReturn";
  const isDelete = value.method === "deleteMany";

  const batchDataFields = fields.createFields.map((f) => ({
    name: f.name,
    label: f.label,
    type: (f.type === "number" ? "number" : f.type === "boolean" ? "boolean" : f.type === "enum" ? "enum" : "string") as "string" | "number" | "boolean" | "enum",
    ...("enums" in f && f.enums ? { enums: f.enums as { label: string; value: string }[] } : {}),
  }));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Radio.Group
          value={value.method}
          onChange={(e) => onChange(emptyBatchFormValue(e.target.value as BatchMethod))}
        >
          <Radio.Button value="createMany">createMany</Radio.Button>
          <Radio.Button value="createManyAndReturn">createManyAndReturn</Radio.Button>
          <Radio.Button value="updateMany">updateMany</Radio.Button>
          <Radio.Button value="updateManyAndReturn">updateManyAndReturn</Radio.Button>
          <Radio.Button value="deleteMany">deleteMany</Radio.Button>
        </Radio.Group>
      </div>

      {isCreate && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>data</h4>
          <ProPrismaBatchData
            fields={{ fields: batchDataFields }}
            value={{ rows: value.rows }}
            onChange={(batchData) => onChange({ ...value, rows: batchData.rows })}
          />
        </div>
      )}

      {isCreate && (
        <div style={{ marginBottom: 16 }}>
          <ProPrismaSkipDuplicates
            value={value.skipDuplicates}
            onChange={(skipDuplicates) => onChange({ ...value, skipDuplicates })}
          />
        </div>
      )}

      {isUpdateDelete && !isDelete && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>data</h4>
          <ProPrismaBatchData
            fields={{ fields: batchDataFields }}
            value={{ rows: value.rows }}
            onChange={(batchData) => onChange({ ...value, rows: batchData.rows })}
          />
        </div>
      )}

      {isUpdateDelete && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>where</h4>
          <ProPrismaWhere
            fields={fields.whereFields}
            value={value.where}
            onChange={(where) => onChange({ ...value, where })}
          />
        </div>
      )}

      {hasReturn && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>select</h4>
          <ProPrismaSelect
            fields={fields.selectFields}
            value={value.select}
            onChange={(select) => onChange({ ...value, select })}
          />
        </div>
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
