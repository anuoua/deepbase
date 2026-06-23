import { useCallback, useEffect, useState } from "react";
import { Flex, Spin, Typography } from "antd";
import { RightOutlined, DownOutlined } from "@ant-design/icons";
import type { Session } from "@opencode-ai/sdk";
import type { OpencodeStore, Bubble } from "../../../lib/opencode-store";
import { UserBubble } from "./UserBubble";
import { AssistantBubble } from "./AssistantBubble";

export function ChildSessionEntry({
  store,
  session,
  defaultOpen,
}: {
  store: OpencodeStore;
  session: Session;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [items, setItems] = useState<Bubble[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || items.length > 0) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const msgs = await store.loadChildMessages(session.id);
        if (!cancelled) setItems(msgs);
      } catch (err) {
        console.error("Failed to load child session messages:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, session.id, items.length, store]);

  const renderBubble = useCallback((item: Bubble) => {
    if (item.kind === "user") return <UserBubble key={item.id} item={item} />;
    return <AssistantBubble key={item.id} item={item} />;
  }, []);

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
            🤖 subagent
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
            items.map(renderBubble)
          )}
        </div>
      )}
    </div>
  );
}
