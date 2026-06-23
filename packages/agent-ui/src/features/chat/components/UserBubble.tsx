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
  const [showRevert, setShowRevert] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: t.space.lg,
      }}
      onMouseEnter={() => setShowRevert(true)}
      onMouseLeave={() => setShowRevert(false)}
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
        {item.messageID && onRevert && showRevert ? (
          <Button
            type="text"
            size="small"
            icon={<RollbackOutlined />}
            title="回退到此"
            style={{ marginTop: 2, fontSize: t.font.sm }}
            onClick={(e) => {
              e.stopPropagation();
              onRevert(item.messageID!);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
