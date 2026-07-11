import { Checkbox, Select } from "antd";
import { useCallback, useMemo } from "react";
import {
  ALL_OPS,
  isOpAllowed,
} from "../ProPrismaAggregate/ProPrismaAggregate";
import type { AggregateOp } from "../ProPrismaAggregate/types";
import { toPrismaAggregate } from "./types";
import type { GroupByFieldConfig, GroupByValue } from "./types";

interface ProPrismaGroupByProps {
  fields: GroupByFieldConfig;
  value: GroupByValue;
  onChange: (value: GroupByValue) => void;
}

export function ProPrismaGroupBy({
  fields,
  value,
  onChange,
}: ProPrismaGroupByProps) {
  const scalarOptions = useMemo(
    () =>
      fields.scalarFields.map((f) => ({ label: f.label, value: f.name })),
    [fields],
  );

  const result = useMemo(() => {
    const agg = toPrismaAggregate(value.aggregate, fields.aggregateFields);
    return { ...(value.by.length > 0 ? { by: value.by } : {}), ...agg };
  }, [value, fields]);

  const handleByChange = useCallback(
    (by: string[]) => {
      onChange({ ...value, by });
    },
    [value, onChange],
  );

  const handleOpChange = useCallback(
    (fieldName: string, op: AggregateOp, checked: boolean) => {
      const currentOps = value.aggregate[fieldName] ?? [];
      const newOps = checked
        ? [...currentOps, op]
        : currentOps.filter((o) => o !== op);
      const newAggregate = { ...value.aggregate };
      if (newOps.length > 0) {
        newAggregate[fieldName] = newOps;
      } else {
        delete newAggregate[fieldName];
      }
      onChange({ ...value, aggregate: newAggregate });
    },
    [value, onChange],
  );

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            color: "#666",
            marginBottom: 4,
          }}
        >
          Group by
        </label>
        <Select
          allowClear
          mode="multiple"
          options={scalarOptions}
          placeholder="Select grouping fields"
          showSearch
          style={{ minWidth: 300 }}
          value={value.by}
          onChange={handleByChange}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
          Aggregate
        </div>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: 8,
                  borderBottom: "1px solid #d9d9d9",
                }}
              >
                Field
              </th>
              {ALL_OPS.map((op) => (
                <th
                  key={op}
                  style={{
                    textAlign: "center",
                    padding: 8,
                    borderBottom: "1px solid #d9d9d9",
                  }}
                >
                  {op}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.aggregateFields.map((field) => {
              const selectedOps = value.aggregate[field.name] ?? [];
              return (
                <tr key={field.name}>
                  <td
                    style={{
                      padding: 8,
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    {field.label}
                    <span style={{ color: "#999", marginLeft: 4 }}>
                      ({field.type})
                    </span>
                  </td>
                  {ALL_OPS.map((op) => {
                    const allowed = isOpAllowed(op, field.type);
                    return (
                      <td
                        key={op}
                        style={{
                          textAlign: "center",
                          padding: 8,
                          borderBottom: "1px solid #f0f0f0",
                        }}
                      >
                        <Checkbox
                          checked={selectedOps.includes(op)}
                          disabled={!allowed}
                          onChange={(e) =>
                            handleOpChange(field.name, op, e.target.checked)
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
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
          Prisma GroupBy Output:
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
