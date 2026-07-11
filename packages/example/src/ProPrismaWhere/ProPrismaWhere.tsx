import { Button, Checkbox, Input, InputNumber, Select, Space, Tag } from "antd";
import { useCallback, useMemo } from "react";
import {
  resolveChildren,
  hasChildren,
  type FieldConfig,
  type WhereCondition,
  type WhereGroup,
  type WhereNode,
  canBeMultipleValue,
  getDefaultOperator,
  getOperatorsByType,
  isRelationOperator,
  toPrismaWhere,
} from "./types";

interface ProPrismaWhereProps {
  fields: FieldConfig[];
  value?: WhereGroup;
  onChange?: (value: WhereGroup) => void;
  provider?: string;
}

function createEmptyCondition(fields: FieldConfig[]): WhereCondition {
  const firstField = fields[0];
  return {
    field: firstField?.name ?? "",
    operator: firstField ? getDefaultOperator(firstField) : "equals",
    value: null,
  };
}

function createEmptyGroup(type: WhereGroup["type"] = "AND"): WhereGroup {
  return { type, children: [createEmptyCondition([])] };
}

export function ProPrismaWhere({ fields, value, onChange, provider: rawProvider }: ProPrismaWhereProps) {
  const safeValue = value ?? createEmptyGroup();
  const provider = rawProvider ?? "";

  const handleChange = useCallback(
    (newValue: WhereGroup) => {
      onChange?.(newValue);
    },
    [onChange],
  );

  const result = useMemo(() => toPrismaWhere(safeValue, fields), [safeValue, fields]);

  return (
    <div style={{ fontFamily: "monospace" }}>
      <WhereGroupEditor depth={0} fields={fields} group={safeValue} onChange={handleChange} provider={provider} />
      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: "#f5f5f5",
          borderRadius: 6,
          border: "1px solid #d9d9d9",
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: 500, color: "#666" }}>Prisma Where Output:</div>
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

interface WhereGroupEditorProps {
  depth: number;
  fields: FieldConfig[];
  group: WhereGroup;
  onChange: (group: WhereGroup) => void;
  provider: string;
}

function WhereGroupEditor({ depth, fields, group, onChange, provider }: WhereGroupEditorProps) {
  const toggleType = useCallback(() => {
    const next = group.type === "AND" ? "OR" : group.type === "OR" ? "NOT" : "AND";
    onChange({ ...group, type: next });
  }, [group, onChange]);

  const updateChild = useCallback(
    (index: number, child: WhereNode) => {
      const newChildren = [...group.children];
      newChildren[index] = child;
      onChange({ ...group, children: newChildren });
    },
    [group, onChange],
  );

  const removeChild = useCallback(
    (index: number) => {
      const newChildren = group.children.filter((_, i) => i !== index);
      onChange({
        ...group,
        children: newChildren.length > 0 ? newChildren : [createEmptyCondition([])],
      });
    },
    [group, onChange],
  );

  const addCondition = useCallback(() => {
    onChange({
      ...group,
      children: [...group.children, createEmptyCondition(fields)],
    });
  }, [group, fields, onChange]);

  const addGroup = useCallback(() => {
    onChange({
      ...group,
      children: [...group.children, createEmptyGroup()],
    });
  }, [group, onChange]);

  return (
    <div
      style={{
        border: "1px solid #d9d9d9",
        borderRadius: 6,
        padding: 12,
        marginBottom: 8,
        background: depth % 2 === 0 ? "#fff" : "#fafafa",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <Tag
          color={group.type === "AND" ? "blue" : group.type === "OR" ? "green" : "red"}
          style={{ cursor: "pointer", fontWeight: 600 }}
          onClick={toggleType}
        >
          {group.type}
        </Tag>
        <span style={{ fontSize: 12, color: "#999" }}>(click to toggle)</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {group.children.map((child, index) =>
          "children" in child ? (
            <div key={index} style={{ position: "relative" }}>
              <WhereGroupEditor
                depth={depth + 1}
                fields={fields}
                group={child as WhereGroup}
                onChange={(newChild) => updateChild(index, newChild)}
                provider={provider}
              />
              <Button
                size="small"
                danger
                type="text"
                style={{ position: "absolute", top: 4, right: 4 }}
                onClick={() => removeChild(index)}
              >
                ✕
              </Button>
            </div>
          ) : (
            <WhereConditionEditor
              key={index}
              fields={fields}
              condition={child as WhereCondition}
              onChange={(newChild) => updateChild(index, newChild)}
              onRemove={() => removeChild(index)}
              provider={provider}
            />
          ),
        )}
      </div>

      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <Button size="small" type="dashed" onClick={addCondition}>
          + Condition
        </Button>
        <Button size="small" type="dashed" onClick={addGroup}>
          + Sub-group
        </Button>
      </div>
    </div>
  );
}

interface WhereConditionEditorProps {
  fields: FieldConfig[];
  condition: WhereCondition;
  onChange: (condition: WhereCondition) => void;
  onRemove: () => void;
  provider: string;
}

function WhereConditionEditor({
  fields,
  condition,
  onChange,
  onRemove,
  provider,
}: WhereConditionEditorProps) {
  const fieldConfig = fields.find((f) => f.name === condition.field);
  const isRelationCond = !!fieldConfig && hasChildren(fieldConfig) && isRelationOperator(condition.operator);

  const fieldOptions = fields.map((f) => ({ label: f.label, value: f.name }));

  const operatorOptions = useMemo(
    () =>
      (fieldConfig ? getOperatorsByType(fieldConfig) : getOperatorsByType(fields[0]!)) as {
        label: string;
        value: string;
      }[],
    [fieldConfig],
  );

  const handleFieldChange = useCallback(
    (field: string) => {
      const config = fields.find((f) => f.name === field);
      onChange({
        field,
        operator: config ? getDefaultOperator(config) : "equals",
        value: config && hasChildren(config) ? { type: "AND" as const, children: [] } : null,
      });
    },
    [fields, onChange],
  );

  const handleOperatorChange = useCallback(
    (operator: string) => {
      const config = fields.find((f) => f.name === condition.field);
      onChange({
        ...condition,
        operator,
        value:
          config && hasChildren(config) && isRelationOperator(operator)
            ? { type: "AND" as const, children: [] }
            : null,
      });
    },
    [condition, fields, onChange],
  );

  const handleValueChange = useCallback(
    (value: unknown) => {
      onChange({ ...condition, value });
    },
    [condition, onChange],
  );

  const handleModeToggle = useCallback(
    (checked: boolean) => {
      if (checked) {
        onChange({ ...condition, mode: "insensitive" });
      } else {
        const { mode: _, ...rest } = condition;
        onChange(rest);
      }
    },
    [condition, onChange],
  );

  const canCaseInsensitive =
    (provider === "postgresql" || provider === "cockroachdb") &&
    fieldConfig?.type === "string" &&
    ["contains", "startsWith", "endsWith", "equals"].includes(condition.operator);

  return (
    <div>
      <Space.Compact block style={{ width: "100%", display: "flex", gap: 8, alignItems: "center" }}>
        <Select
          allowClear={false}
          options={fieldOptions}
          placeholder="Field"
          showSearch
          style={{ minWidth: 150 }}
          value={condition.field || null}
          onChange={handleFieldChange}
        />

        <Select
          allowClear={false}
          options={operatorOptions}
          placeholder="Operator"
          style={{ minWidth: 150 }}
          value={condition.operator || null}
          onChange={handleOperatorChange}
        />

        {fieldConfig && !isRelationCond && (
          <ValueInput
            fieldConfig={fieldConfig}
            operator={condition.operator}
            value={condition.value}
            onChange={handleValueChange}
          />
        )}

        {canCaseInsensitive && (
          <Checkbox
            checked={condition.mode === "insensitive"}
            onChange={(e) => handleModeToggle(e.target.checked)}
          >
            Case insensitive
          </Checkbox>
        )}

        <Button danger size="small" type="text" onClick={onRemove}>
          ✕
        </Button>
      </Space.Compact>

      {isRelationCond && fieldConfig && hasChildren(fieldConfig) && (
        <div style={{ marginTop: 8, marginLeft: 24 }}>
          <WhereGroupEditor
            depth={0}
            fields={resolveChildren(fieldConfig)}
            group={(condition.value as WhereGroup) ?? { type: "AND", children: [] }}
            onChange={handleValueChange}
            provider={provider}
          />
        </div>
      )}
    </div>
  );
}

interface ValueInputProps {
  fieldConfig: FieldConfig;
  operator: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

function ValueInput({ fieldConfig, operator, value, onChange }: ValueInputProps) {
  const multiple = canBeMultipleValue(operator);
  const isListEquals = fieldConfig.isList && operator === "equals";

  if (operator === "path_equals") {
    const v = (value as { path?: string[]; equals?: string }) ?? {};
    return (
      <Space direction="vertical" style={{ width: "100%", flex: 1 }}>
        <Input
          placeholder="JSON path (comma-separated, e.g. settings,theme)"
          style={{ minWidth: 200 }}
          value={v.path?.join(",") ?? ""}
          onChange={(e) =>
            onChange({
              path: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              equals: v.equals,
            })
          }
        />
        <Input
          placeholder="Equals value"
          style={{ minWidth: 200 }}
          value={(v.equals as string) ?? ""}
          onChange={(e) => onChange({ path: v.path, equals: e.target.value })}
        />
      </Space>
    );
  }

  if (operator === "string_contains") {
    const v = (value as { path?: string[]; string_contains?: string }) ?? {};
    return (
      <Space direction="vertical" style={{ width: "100%", flex: 1 }}>
        <Input
          placeholder="JSON path (comma-separated)"
          style={{ minWidth: 200 }}
          value={v.path?.join(",") ?? ""}
          onChange={(e) =>
            onChange({
              path: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              string_contains: v.string_contains,
            })
          }
        />
        <Input
          placeholder="Contains text"
          style={{ minWidth: 200 }}
          value={(v.string_contains as string) ?? ""}
          onChange={(e) => onChange({ path: v.path, string_contains: e.target.value })}
        />
      </Space>
    );
  }

  if (operator === "search") {
    return (
      <Input
        allowClear
        placeholder="Search query"
        style={{ minWidth: 200, flex: 1 }}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      />
    );
  }

  if (operator === "isEmpty" || operator === "isSet") {
    return (
      <Select
        allowClear
        options={[
          { label: "true", value: true },
          { label: "false", value: false },
        ]}
        placeholder="Select"
        style={{ minWidth: 120 }}
        value={value !== undefined ? (value as boolean) : undefined}
        onChange={onChange}
      />
    );
  }

  switch (fieldConfig.type) {
    case "string":
      if (multiple || isListEquals) {
        return (
          <Select
            allowClear
            mode="tags"
            placeholder="Enter values"
            style={{ minWidth: 200, flex: 1 }}
            value={Array.isArray(value) ? (value as (string | number)[]) : undefined}
            onChange={onChange}
          />
        );
      }
      return (
        <Input
          allowClear
          placeholder="Value"
          style={{ minWidth: 200, flex: 1 }}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "number":
      if (multiple || isListEquals) {
        return (
          <Select
            allowClear
            mode="tags"
            placeholder="Enter numbers"
            style={{ minWidth: 200, flex: 1 }}
            value={Array.isArray(value) ? (value as (string | number)[]) : undefined}
            onChange={(vals) => onChange(vals?.map((v: string | number) => Number(v)))}
          />
        );
      }
      return (
        <InputNumber
          placeholder="Value"
          style={{ minWidth: 200, flex: 1 }}
          value={(value as number) ?? null}
          onChange={onChange}
        />
      );

    case "boolean":
      return (
        <Select
          allowClear
          options={[
            { label: "true", value: true },
            { label: "false", value: false },
          ]}
          placeholder="Select boolean"
          style={{ minWidth: 120 }}
          value={value !== undefined ? (value as boolean) : undefined}
          onChange={onChange}
        />
      );

    case "date":
      if (multiple) {
        return (
          <Select
            allowClear
            mode="tags"
            placeholder="Enter ISO dates (e.g. 2024-01-01)"
            style={{ minWidth: 200, flex: 1 }}
            value={Array.isArray(value) ? (value as string[]) : undefined}
            onChange={onChange}
          />
        );
      }
      return (
        <Input
          allowClear
          placeholder="Date (e.g. 2024-01-01T00:00:00.000Z)"
          style={{ minWidth: 200, flex: 1 }}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "enum":
      if (!fieldConfig.enums) {
        return (
          <Input
            allowClear
            placeholder="Value"
            style={{ minWidth: 200, flex: 1 }}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      }
      if (multiple) {
        return (
          <Select
            allowClear
            mode="multiple"
            options={fieldConfig.enums}
            placeholder="Select values"
            style={{ minWidth: 200, flex: 1 }}
            value={Array.isArray(value) ? (value as (string | number)[]) : undefined}
            onChange={onChange}
          />
        );
      }
      return (
        <Select
          allowClear
          options={fieldConfig.enums}
          placeholder="Select value"
          style={{ minWidth: 200, flex: 1 }}
          value={(value as string | number) ?? undefined}
          onChange={onChange}
        />
      );

    default:
      return (
        <Input
          allowClear
          placeholder="Value"
          style={{ minWidth: 200, flex: 1 }}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
