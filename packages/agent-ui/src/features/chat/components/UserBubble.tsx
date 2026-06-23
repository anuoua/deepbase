import { Button } from "antd";
import { RollbackOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import { useState } from "react";
import type { UserBubble as UserBubbleData } from "../../../lib/opencode-store";

export function UserBubble({
  item,
  onRevert,
}: {
  item: UserBubbleData;
  onRevert?: (messageID: string) => void;
}) {
  const [showRevert, setShowRevert] = useState(false);
  return (
    <div
      style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}
      onMouseEnter={() => setShowRevert(true)}
      onMouseLeave={() => setShowRevert(false)}
    >
      <div style={{ maxWidth: "70%" }}>
        <div
          style={{
            background: "#e6f4ff",
            border: "1px solid #bae0ff",
            borderRadius: 8,
            padding: "8px 12px",
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
            style={{ marginTop: 2, fontSize: 12 }}
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
