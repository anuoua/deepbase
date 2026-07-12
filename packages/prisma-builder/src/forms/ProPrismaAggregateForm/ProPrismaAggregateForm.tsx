import { useMemo } from "react";
import { ProPrismaWhere } from "../../inputs/ProPrismaWhere/ProPrismaWhere";
import { ProPrismaOrderBy } from "../../inputs/ProPrismaOrderBy/ProPrismaOrderBy";
import { ProPrismaPagination } from "../../inputs/ProPrismaPagination/ProPrismaPagination";
import { ProPrismaAggregate as ProPrismaAggregateFields } from "../../inputs/ProPrismaAggregate/ProPrismaAggregate";
import {
  toPrismaAggregateForm,
  type AggregateFormFieldConfig,
  type AggregateFormValue,
} from "./types";

interface ProPrismaAggregateFormProps {
  fields: AggregateFormFieldConfig;
  value: AggregateFormValue;
  onChange: (value: AggregateFormValue) => void;
}

export function ProPrismaAggregateForm({ fields, value, onChange }: ProPrismaAggregateFormProps) {
  const result = useMemo(() => toPrismaAggregateForm(value, fields), [value, fields]);

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
        <h4 style={{ marginBottom: 8 }}>aggregation fields</h4>
        <ProPrismaAggregateFields
          fields={fields.aggregateFields}
          value={value.aggregate}
          onChange={(aggregate) => onChange({ ...value, aggregate })}
        />
      </div>

      <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 6, border: "1px solid #d9d9d9" }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>
          prisma.user.aggregate() Output:
        </div>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
