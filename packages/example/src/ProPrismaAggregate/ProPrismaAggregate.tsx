import { Checkbox } from "antd";
import { useCallback, useMemo } from "react";
import {
  toPrismaAggregate,
  type AggregateFieldConfig,
  type AggregateOp,
  type AggregateValue,
} from "./types";

export const ALL_OPS: AggregateOp[] = ["_sum", "_avg", "_min", "_max", "_count"];

export function isOpAllowed(
  op: AggregateOp,
  type: AggregateFieldConfig["type"],
): boolean {
  switch (op) {
    case "_sum":
    case "_avg":
      return type === "number";
    case "_min":
    case "_max":
      return type === "number" || type === "date" || type === "string";
    case "_count":
      return true;
  }
}

interface ProPrismaAggregateProps {
  fields: AggregateFieldConfig[];
  value: AggregateValue;
  onChange: (value: AggregateValue) => void;
}

export function ProPrismaAggregate({
  fields,
  value,
  onChange,
}: ProPrismaAggregateProps) {
  const result = useMemo(
    () => toPrismaAggregate(value, fields),
    [value, fields],
  );

  const handleOpChange = useCallback(
    (fieldName: string, op: AggregateOp, checked: boolean) => {
      const currentOps = value[fieldName] ?? [];
      const newOps = checked
        ? [...currentOps, op]
        : currentOps.filter((o) => o !== op);
      const newValue: AggregateValue = { ...value };
      if (newOps.length > 0) {
        newValue[fieldName] = newOps;
      } else {
        delete newValue[fieldName];
      }
      onChange(newValue);
    },
    [value, onChange],
  );

  return (
    <div>
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
          {fields.map((field) => {
            const selectedOps = value[field.name] ?? [];
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
          Prisma Aggregate Output:
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
