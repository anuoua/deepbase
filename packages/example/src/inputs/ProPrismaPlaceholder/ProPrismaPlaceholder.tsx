import { Button, Tooltip } from "antd";

interface ProPrismaPlaceholderProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function ProPrismaPlaceholder({ enabled, onChange }: ProPrismaPlaceholderProps) {
  return (
    <Tooltip title={enabled ? "Placeholder — value filled at runtime" : "Literal value"}>
      <Button
        size="small"
        type={enabled ? "primary" : "text"}
        onClick={() => onChange(!enabled)}
        style={{ border: enabled ? undefined : "none", fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}
      >
        P
      </Button>
    </Tooltip>
  );
}
