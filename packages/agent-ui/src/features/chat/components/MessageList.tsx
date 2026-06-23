import { useRef } from "react";
import { Spin, Flex } from "antd";
import {
  useOpencode,
  selectors,
  type OpencodeStore,
  type Bubble,
} from "../../../lib/opencode-store";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { MessageItem } from "./MessageItem";
import { useDesignTokens } from "../hooks/useDesignTokens";

export function MessageList({
  store,
  readonly,
  onRevert,
  onSubtaskClick,
}: {
  store: OpencodeStore;
  readonly?: boolean;
  onRevert?: (messageID: string) => void;
  onSubtaskClick?: (sessionID: string) => void;
}) {
  const t = useDesignTokens();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = useOpencode(store, selectors.messages);

  useAutoScroll(scrollRef, [messages]);

  const effectiveRevert = readonly ? undefined : onRevert;
  const effectiveSubtask = readonly ? undefined : onSubtaskClick;

  if (messages.length === 0) {
    return (
      <Flex
        flex={1}
        align="center"
        justify="center"
        style={{ color: t.color.textTertiary }}
      >
        <Spin />
      </Flex>
    );
  }

  return (
    <div
      ref={scrollRef}
      style={{ flex: 1, overflow: "auto", padding: t.space.lg }}
    >
      {messages.map((bubble: Bubble) => (
        <MessageItem
          key={bubble.id}
          bubble={bubble}
          {...(effectiveRevert ? { onRevert: effectiveRevert } : {})}
          {...(effectiveSubtask ? { onSubtaskClick: effectiveSubtask } : {})}
        />
      ))}
    </div>
  );
}
