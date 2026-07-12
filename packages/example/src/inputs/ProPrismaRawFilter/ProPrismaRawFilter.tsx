import { Input } from "antd";
import { ProPrismaPlaceholder } from "../ProPrismaPlaceholder/ProPrismaPlaceholder";
import { isPlaceholderValue, markPlaceholder } from "../ProPrismaPlaceholder/utils";

const { TextArea } = Input;

interface ProPrismaRawFilterProps {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function ProPrismaRawFilter({ label, value, onChange }: ProPrismaRawFilterProps) {
  const isPlaceholder = isPlaceholderValue(value);

  return (
    <div>
      <div style={{ marginBottom: 4, fontWeight: 500, fontSize: 13, color: "#333", display: "flex", alignItems: "center", gap: 4 }}>
        {label}
        <ProPrismaPlaceholder
          enabled={isPlaceholder}
          onChange={(on) => onChange(on ? markPlaceholder() : "{}")}
        />
      </div>
      <TextArea
        rows={6}
        value={isPlaceholder ? "" : (value as string)}
        disabled={isPlaceholder}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isPlaceholder ? "Runtime value" : `Enter JSON for ${label.toLowerCase()}...`}
        style={{ fontFamily: "monospace", fontSize: 13 }}
      />
    </div>
  );
}
