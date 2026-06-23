import { Button, Dropdown, Flex, Menu } from "antd";
import { useOpencode, selectors, type OpencodeStore } from "../../../lib/opencode-store";
import type { SessionManager } from "../types";
import { useDesignTokens } from "../hooks/useDesignTokens";

const SIDEBAR_WIDTH = 240;

export function ChatSidebar({
  store,
  sessionManager,
}: {
  store: OpencodeStore;
  sessionManager: SessionManager;
}) {
  const t = useDesignTokens();
  const sessionID = useOpencode(store, selectors.sessionID);
  const sessions = useOpencode(store, selectors.sessions);

  const { create, remove, switchTo, startRename } = sessionManager;

  const menuItems = sessions.map((conv) => ({
    key: conv.id,
    label: (
      <Dropdown
        menu={{
          items: [
            {
              key: "rename",
              label: "重命名",
              onClick: () => startRename(conv.id, conv.title),
            },
            {
              key: "delete",
              label: "删除对话",
              danger: true,
              onClick: () => void remove(conv.id),
            },
          ],
        }}
        trigger={["contextMenu"]}
      >
        <span>{conv.title}</span>
      </Dropdown>
    ),
  }));

  return (
    <Flex
      vertical
      style={{
        width: SIDEBAR_WIDTH,
        borderInlineEnd: `1px solid ${t.color.border}`,
        flexShrink: 0,
        overflow: "auto",
      }}
    >
      <Button
        type="dashed"
        style={{ margin: t.space.sm }}
        onClick={() => void create()}
      >
        新对话
      </Button>
      <Menu
        style={{ border: "none" }}
        selectedKeys={sessionID ? [sessionID] : []}
        onSelect={({ key }) => switchTo(key)}
        items={menuItems}
      />
    </Flex>
  );
}
