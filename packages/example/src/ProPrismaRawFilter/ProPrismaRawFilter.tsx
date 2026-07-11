import { Input } from "antd";

const { TextArea } = Input;

interface ProPrismaRawFilterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ProPrismaRawFilter({ label, value, onChange }: ProPrismaRawFilterProps) {
  return (
    <div>
      <div style={{ marginBottom: 4, fontWeight: 500, fontSize: 13, color: "#333" }}>{label}</div>
      <TextArea
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter JSON for ${label.toLowerCase()}...`}
        style={{ fontFamily: "monospace", fontSize: 13 }}
      />
    </div>
  );
}
