import { useRef } from "react";
import type { Bubble } from "../../../lib/opencode-store";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { MessageItem } from "./MessageItem";
import { useDesignTokens } from "../hooks/useDesignTokens";

export function MessageList({
  messages,
  readonly,
  onRevert,
  onSubtaskClick,
}: {
  messages: readonly Bubble[];
  readonly?: boolean;
  onRevert?: (messageID: string) => void;
  onSubtaskClick?: (sessionID: string) => void;
}) {
  const t = useDesignTokens();
  const scrollRef = useRef<HTMLDivElement>(null);

  useAutoScroll(scrollRef, [messages]);

  const effectiveRevert = readonly ? undefined : onRevert;
  const effectiveSubtask = readonly ? undefined : onSubtaskClick;

  if (messages.length === 0) return null;

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
