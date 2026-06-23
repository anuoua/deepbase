import type { Bubble } from "../../../lib/opencode-store";
import { UserBubble } from "./UserBubble";
import { AssistantBubble } from "./AssistantBubble";

export function MessageItem({
  bubble,
  onRevert,
  onSubtaskClick,
}: {
  bubble: Bubble;
  onRevert?: (messageID: string) => void;
  onSubtaskClick?: (sessionID: string) => void;
}) {
  if (bubble.kind === "user") {
    return <UserBubble item={bubble} {...(onRevert ? { onRevert } : {})} />;
  }
  return (
    <AssistantBubble
      item={bubble}
      {...(onSubtaskClick ? { onSubtaskClick } : {})}
    />
  );
}
