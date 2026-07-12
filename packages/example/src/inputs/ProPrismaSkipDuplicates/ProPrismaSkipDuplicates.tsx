import { Switch } from "antd";

interface ProPrismaSkipDuplicatesProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function ProPrismaSkipDuplicates({ value, onChange }: ProPrismaSkipDuplicatesProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span>skipDuplicates</span>
      <Switch checked={value} onChange={onChange} />
    </div>
  );
}
