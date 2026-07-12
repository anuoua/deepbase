import { InputNumber, Select } from "antd";
import { useCallback, useMemo } from "react";
import {
  toPrismaPagination,
  type PaginationFieldConfig,
  type PaginationValue,
} from "./types";
import { isPlaceholderValue, markPlaceholder, toPlaceholderAwareValue } from "../ProPrismaPlaceholder/utils";
import { ProPrismaPlaceholder } from "../ProPrismaPlaceholder/ProPrismaPlaceholder";

interface ProPrismaPaginationProps {
  fields: PaginationFieldConfig[];
  value: PaginationValue;
  onChange: (value: PaginationValue) => void;
}

export function ProPrismaPagination({
  fields,
  value,
  onChange,
}: ProPrismaPaginationProps) {
  const result = useMemo(
    () => toPrismaPagination(value, fields),
    [value, fields],
  );

  const fieldOptions = useMemo(
    () => fields.map((f) => ({ label: f.label, value: f.name })),
    [fields],
  );

  const handleTakeChange = useCallback(
    (take: number | null) => {
      onChange({ ...value, ...(take === null ? {} : { take }) });
    },
    [value, onChange],
  );

  const handleSkipChange = useCallback(
    (skip: number | null) => {
      onChange({ ...value, ...(skip === null ? {} : { skip }) });
    },
    [value, onChange],
  );

  const handleCursorFieldChange = useCallback(
    (cursorField: string) => {
      onChange({ ...value, cursorField });
    },
    [value, onChange],
  );

  const handleCursorValueChange = useCallback(
    (cursorValue: number | null) => {
      onChange({ ...value, ...(cursorValue === null ? {} : { cursorValue }) });
    },
    [value, onChange],
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "#666" }}>take</label>
          <InputNumber
            min={1}
            placeholder="take"
            style={{ minWidth: 120 }}
            value={value.take ?? null}
            onChange={handleTakeChange}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "#666" }}>skip</label>
          <InputNumber
            min={0}
            placeholder="skip"
            style={{ minWidth: 120 }}
            value={value.skip ?? null}
            onChange={handleSkipChange}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "#666" }}>cursor field</label>
          <Select
            allowClear
            options={fieldOptions}
            placeholder="Field"
            showSearch
            style={{ minWidth: 150 }}
            value={value.cursorField || null}
            onChange={handleCursorFieldChange}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "#666" }}>cursor value</label>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <InputNumber
              placeholder="value"
              style={{ minWidth: 150 }}
              value={
                value.cursorValue !== undefined && value.cursorValue !== null && !isPlaceholderValue(value.cursorValue)
                  ? Number(value.cursorValue)
                  : null
              }
              onChange={handleCursorValueChange}
            />
            <ProPrismaPlaceholder
              enabled={isPlaceholderValue(value.cursorValue)}
              onChange={(p) =>
                onChange({ ...value, ...(p ? { cursorValue: markPlaceholder() } : {}) })
              }
            />
          </div>
        </div>
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
          Prisma Pagination Output:
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
