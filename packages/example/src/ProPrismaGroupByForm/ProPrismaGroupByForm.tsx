import { Select, Input } from "antd";
import { useMemo } from "react";
import { ProPrismaWhere } from "../ProPrismaWhere/ProPrismaWhere";
import { ProPrismaOrderBy } from "../ProPrismaOrderBy/ProPrismaOrderBy";
import { ProPrismaPagination } from "../ProPrismaPagination/ProPrismaPagination";
import { ProPrismaAggregate as ProPrismaAggregateFields } from "../ProPrismaAggregate/ProPrismaAggregate";
import {
  toPrismaGroupByForm,
  type GroupByFormFieldConfig,
  type GroupByFormValue,
} from "./types";

interface ProPrismaGroupByFormProps {
  fields: GroupByFormFieldConfig;
  value: GroupByFormValue;
  onChange: (value: GroupByFormValue) => void;
}

export function ProPrismaGroupByForm({ fields, value, onChange }: ProPrismaGroupByFormProps) {
  const result = useMemo(() => toPrismaGroupByForm(value, fields), [value, fields]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>by</h4>
        <Select
          mode="multiple"
          style={{ width: "100%" }}
          placeholder="Select fields to group by"
          value={value.by}
          onChange={(by) => onChange({ ...value, by })}
          options={fields.byFieldNames.map((f) => ({ label: f, value: f }))}
        />
      </div>

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
        <h4 style={{ marginBottom: 8 }}>aggregation fields</h4>
        <ProPrismaAggregateFields
          fields={fields.aggregateFields}
          value={value.aggregate}
          onChange={(aggregate) => onChange({ ...value, aggregate })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>having (JSON)</h4>
        <Input.TextArea
          rows={4}
          value={value.having}
          onChange={(e) => onChange({ ...value, having: e.target.value })}
          placeholder='{"some_count": {"gte": 5}}'
          style={{ fontFamily: "monospace", fontSize: 13 }}
        />
      </div>

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>
          prisma.user.groupBy() Output:
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
