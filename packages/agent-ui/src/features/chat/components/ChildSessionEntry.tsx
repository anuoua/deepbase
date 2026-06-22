import { useCallback, useEffect, useState } from "react";
import { Flex, Spin, Typography } from "antd";
import { RightOutlined, DownOutlined } from "@ant-design/icons";
import { opencode } from "../../../api/client";
import type { OpenCodeSession } from "../../../api/types/index";
import { nextId, type BubbleItem } from "../../../lib/opencode-client/types";
import { UserBubble } from "./UserBubble";
import { AssistantBubble } from "./AssistantBubble";

function toBubbleItems(
  msgs: import("../../../api/types/index").MessageWithParts[],
): BubbleItem[] {
  const items: BubbleItem[] = [];
  for (const msg of msgs) {
    if (msg.info.role === "user") {
      const textPart = msg.parts.find((p) => p.type === "text");
      items.push({
        key: nextId(),
        role: "user",
        content: (textPart as { text?: string } | undefined)?.text ?? "",
        loading: false,
        streaming: false,
        time: msg.info.time.created,
        messageID: msg.info.id,
      });
    } else if (msg.info.role === "assistant") {
      const textPart = msg.parts.find((p) => p.type === "text");
      const reasoningPart = msg.parts.find((p) => p.type === "reasoning");
      const toolParts = msg.parts.filter((p) => p.type === "tool");
      const hasContent = textPart || reasoningPart || toolParts.length > 0;
      if (!hasContent) continue;
      items.push({
        key: nextId(),
        role: "assistant",
        content: {
          role: "assistant",
          content: (textPart as { text?: string } | undefined)?.text ?? "",
          thinking: (reasoningPart as { text?: string } | undefined)?.text ?? "",
          toolCalls: toolParts,
          phase: "answering",
        },
        loading: false,
        streaming: false,
        time: msg.info.time.created,
        messageID: msg.info.id,
      });
    }
  }
  return items;
}

export function ChildSessionEntry({
  session,
  defaultOpen,
}: {
  session: OpenCodeSession;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [items, setItems] = useState<BubbleItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || items.length > 0) return;
    (async () => {
      setLoading(true);
      try {
        const msgs = await opencode.getMessages(session.id);
        setItems(toBubbleItems(msgs));
      } catch (err) {
        console.error("Failed to load child session messages:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, session.id]);

  const agentLabel = session.agent ?? "subagent";

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          border: "1px solid #e8e8e8",
          background: "#fafafa",
          cursor: "pointer",
          borderRadius: 8,
          padding: "8px 12px",
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <Flex align="center" gap={8}>
          {open ? <DownOutlined /> : <RightOutlined />}
          <Typography.Text strong style={{ fontSize: 13 }}>
            🤖 {agentLabel}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {session.title}
          </Typography.Text>
        </Flex>
      </div>
      {open && (
        <div style={{ paddingLeft: 24, marginTop: 8 }}>
          {loading ? (
            <Flex justify="center" style={{ padding: 16 }}>
              <Spin />
            </Flex>
          ) : (
            items.map((item) =>
              item.role === "user" ? (
                <UserBubble key={item.key} item={item} />
              ) : (
                <AssistantBubble key={item.key} item={item} />
              ),
            )
          )}
        </div>
      )}
    </div>
  );
}
