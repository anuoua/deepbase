import { Button, Typography } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { useState } from "react";
import type { UserBubble as UserBubbleData } from "../../../lib/opencode-store";
import { useDesignTokens } from "../hooks/useDesignTokens";

export function UserBubble({
  item,
  onRevert,
}: {
  item: UserBubbleData;
  onRevert?: (messageID: string) => void;
}) {
  const t = useDesignTokens();
  const [hovered, setHovered] = useState(false);
  const canRevert = !!(item.messageID && onRevert);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: t.space.lg,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ maxWidth: "70%" }}>
        <div
          style={{
            background: t.color.userBubble,
            border: `1px solid ${t.color.userBubbleBorder}`,
            borderRadius: t.radius.lg,
            padding: `${t.space.sm}px ${t.space.md}px`,
          }}
        >
          <Typography.Text>{item.text}</Typography.Text>
        </div>
        {canRevert ? (
          <div style={{ height: 24, marginTop: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="text"
              size="small"
              shape="circle"
              icon={<RollbackOutlined />}
              title="回退到此"
              style={{
                fontSize: t.font.sm,
                opacity: hovered ? 1 : 0,
                pointerEvents: hovered ? "auto" : "none",
                transition: "opacity 0.15s",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onRevert!(item.messageID!);
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
