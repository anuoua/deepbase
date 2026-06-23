import { Button, Dropdown, Flex, Menu } from "antd";
import {
  useManager,
  managerSelectors,
  type SessionManager,
} from "../../../lib/opencode-store";
import type { SessionManagerActions } from "../types";
import { useDesignTokens } from "../hooks/useDesignTokens";

const SIDEBAR_WIDTH = 240;

export function ChatSidebar({
  manager,
  actions,
}: {
  manager: SessionManager;
  actions: SessionManagerActions;
}) {
  const t = useDesignTokens();
  const activeID = useManager(manager, managerSelectors.activeID);
  const sessions = useManager(manager, managerSelectors.sessions);

  const { create, remove, switchTo, startRename } = actions;

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
        selectedKeys={activeID ? [activeID] : []}
        onSelect={({ key }) => switchTo(key)}
        items={menuItems}
      />
    </Flex>
  );
}
