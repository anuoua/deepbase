import { Radio } from "antd";
import { useMemo } from "react";
import { ProPrismaWhereUnique } from "../ProPrismaWhereUnique/ProPrismaWhereUnique";
import { ProPrismaWhere } from "../ProPrismaWhere/ProPrismaWhere";
import { ProPrismaOrderBy } from "../ProPrismaOrderBy/ProPrismaOrderBy";
import { ProPrismaPagination } from "../ProPrismaPagination/ProPrismaPagination";
import { ProPrismaDistinct } from "../ProPrismaDistinct/ProPrismaDistinct";
import { ProPrismaSelect } from "../ProPrismaSelect/ProPrismaSelect";
import { ProPrismaInclude } from "../ProPrismaInclude/ProPrismaInclude";
import { ProPrismaOmit } from "../ProPrismaOmit/ProPrismaOmit";
import {
  toPrismaFindForm,
  type FindFormFieldConfig,
  type FindFormValue,
  type FindMethod,
  type QueryShape,
  emptyFindFormValue,
} from "./types";

interface ProPrismaFindFormProps {
  fields: FindFormFieldConfig;
  value: FindFormValue;
  onChange: (value: FindFormValue) => void;
}

export function ProPrismaFindForm({ fields, value, onChange }: ProPrismaFindFormProps) {
  const result = useMemo(() => toPrismaFindForm(value, fields), [value, fields]);

  const isFindUnique = value.method === "findUnique";
  const isFindMany = value.method === "findFirst" || value.method === "findMany";

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Radio.Group
          value={value.method}
          onChange={(e) => onChange(emptyFindFormValue(e.target.value as FindMethod))}
        >
          <Radio.Button value="findUnique">findUnique</Radio.Button>
          <Radio.Button value="findFirst">findFirst</Radio.Button>
          <Radio.Button value="findMany">findMany</Radio.Button>
        </Radio.Group>
      </div>

      {isFindUnique && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>where (unique)</h4>
          <ProPrismaWhereUnique
            fields={fields.whereUniqueFields}
            value={value.whereUnique}
            onChange={(whereUnique) => onChange({ ...value, whereUnique })}
          />
        </div>
      )}

      {isFindMany && (
        <>
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 8 }}>where</h4>
            <ProPrismaWhere
              fields={fields.whereFields}
              value={value.where}
              onChange={(where) => onChange({ ...value, where })}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 8 }}>orderBy</h4>
            <ProPrismaOrderBy
              fields={fields.orderByFields}
              value={value.orderBy}
              onChange={(orderBy) => onChange({ ...value, orderBy })}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 8 }}>pagination</h4>
            <ProPrismaPagination
              fields={fields.paginationFields}
              value={value.pagination}
              onChange={(pagination) => onChange({ ...value, pagination })}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 8 }}>distinct</h4>
            <ProPrismaDistinct
              fields={fields.distinctFields}
              value={value.distinct}
              onChange={(distinct) => onChange({ ...value, distinct })}
            />
          </div>
        </>
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
