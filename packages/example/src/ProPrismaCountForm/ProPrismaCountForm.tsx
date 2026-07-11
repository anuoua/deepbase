import { Checkbox, Radio } from "antd";
import { useMemo } from "react";
import { ProPrismaWhere } from "../ProPrismaWhere/ProPrismaWhere";
import { ProPrismaOrderBy } from "../ProPrismaOrderBy/ProPrismaOrderBy";
import { ProPrismaPagination } from "../ProPrismaPagination/ProPrismaPagination";
import {
  toPrismaCountForm,
  type CountFormFieldConfig,
  type CountFormValue,
} from "./types";

interface ProPrismaCountFormProps {
  fields: CountFormFieldConfig;
  value: CountFormValue;
  onChange: (value: CountFormValue) => void;
}

export function ProPrismaCountForm({ fields, value, onChange }: ProPrismaCountFormProps) {
  const result = useMemo(() => toPrismaCountForm(value, fields), [value, fields]);

  return (
    <div>
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
        <h4 style={{ marginBottom: 8 }}>select</h4>
        <div style={{ marginBottom: 8 }}>
          <Radio.Group
            value={value.selectAll ? "all" : "fields"}
            onChange={(e) => {
              if (e.target.value === "all") {
                onChange({ ...value, selectAll: true, selectFields: [] });
              } else {
                onChange({ ...value, selectAll: false });
              }
            }}
          >
            <Radio value="all">_all (count all records)</Radio>
            <Radio value="fields">Specific fields</Radio>
          </Radio.Group>
        </div>
        {!value.selectAll && (
          <Checkbox.Group
            options={fields.allFieldNames.map((f) => ({ label: f, value: f }))}
            value={value.selectFields}
            onChange={(vals) => onChange({ ...value, selectFields: vals as string[] })}
          />
        )}
      </div>

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>
          prisma.user.count() Output:
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
