import { HistoryOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Dropdown, Flex, Input, Menu, Typography } from "antd";
import { useCallback, useMemo, useEffect, useRef, useState } from "react";
import type { Session } from "@opencode-ai/sdk";
import {
  OpencodeStore,
  selectors,
  useOpencode,
  type Bubble,
} from "../../lib/opencode-store";
import { useProviders } from "./hooks/useProviders";
import { UserBubble } from "./components/UserBubble";
import { AssistantBubble } from "./components/AssistantBubble";
import { ChildSessionEntry } from "./components/ChildSessionEntry";
import { PromptSuggestions } from "./components/PromptSuggestions";
import { ConfigModal } from "./components/ConfigModal";
import { RenameModal } from "./components/RenameModal";

const store = OpencodeStore.create();

interface ChatItem {
  key: string;
  time: number;
  type: "message" | "child_session";
  bubble?: Bubble;
  childSession?: Session;
}

export const AgentChat = () => {
  const [inputValue, setInputValue] = useState("");
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useOpencode(store, selectors.messages);
  const requesting = useOpencode(store, selectors.requesting);
  const sessionID = useOpencode(store, selectors.sessionID);
  const sessions = useOpencode(store, selectors.sessions);
  const childSessions = useOpencode(store, selectors.childSessions);
  const revert = useOpencode(store, selectors.revert);
  const error = useOpencode(store, selectors.error);

  useEffect(() => {
    void store.refreshSessions();
  }, []);

  useEffect(() => {
    if (sessions.length > 0 && !sessionID) {
      const first = sessions[0];
      if (first) void store.switchTo(first.id);
    }
  }, [sessions, sessionID]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleRevert = useCallback(async (messageID: string) => {
    const text = await store.revertTo(messageID);
    if (text) setInputValue(text);
  }, []);

  const submit = useCallback(
    (text: string) => {
      if (requesting || !sessionID) return;
      void store.send(text);
    },
    [requesting, sessionID],
  );

  const handleSubmit = useCallback(
    (val: string) => {
      submit(val);
      setInputValue("");
    },
    [submit],
  );

  const handlePromptClick = useCallback(
    (label: string) => submit(label),
    [submit],
  );

  const handleNewConversation = useCallback(async () => {
    const id = await store.createSession({ title: "新对话", switch: true });
    if (id) setInputValue("");
  }, []);

  const handleDeleteConversation = useCallback(async (key: string) => {
    await store.deleteSession(key);
  }, []);

  const handleRenameConversation = useCallback(
    (key: string) => {
      const conv = sessions.find((s) => s.id === key);
      setRenameTarget(key);
      setRenameValue(conv?.title ?? key.slice(0, 8));
    },
    [sessions],
  );

  const handleRenameConfirm = useCallback(async () => {
    if (!renameTarget || !renameValue.trim()) return;
    await store.renameSession(renameTarget, renameValue.trim());
    setRenameTarget(null);
    setRenameValue("");
  }, [renameTarget, renameValue]);

  const convMenuItems = sessions.map((conv) => ({
    key: conv.id,
    label: (
      <Dropdown
        menu={{
          items: [
            {
              key: "rename",
              label: "重命名",
              onClick: () => handleRenameConversation(conv.id),
            },
            {
              key: "delete",
              label: "删除对话",
              danger: true,
              onClick: () => handleDeleteConversation(conv.id),
            },
          ],
        }}
        trigger={["contextMenu"]}
      >
        <span>{conv.title}</span>
      </Dropdown>
    ),
  }));

  const chatItems = useMemo<ChatItem[]>(() => {
    const items: ChatItem[] = messages.map((b) => ({
      key: b.id,
      time: b.time,
      type: "message" as const,
      bubble: b,
    }));
    for (const s of childSessions) {
      items.push({
        key: s.id,
        time: s.time.created,
        type: "child_session" as const,
        childSession: s,
      });
    }
    items.sort((a, b) => a.time - b.time);
    return items;
  }, [messages, childSessions]);

  const {
    providers,
    loading: configLoading,
    open: configOpen,
    load: handleConfigOpen,
    close: handleConfigClose,
  } = useProviders(store);

  return (
    <Flex style={{ height: "100vh" }}>
      <Flex
        vertical
        style={{
          width: 240,
          borderInlineEnd: "1px solid #f0f0f0",
          flexShrink: 0,
          overflow: "auto",
        }}
      >
        <Button
          styles={{ root: { flexShrink: 0 } }}
          type="dashed"
          style={{ margin: 8 }}
          onClick={handleNewConversation}
        >
          新对话
        </Button>
        <Menu
          style={{ border: "none" }}
          selectedKeys={sessionID ? [sessionID] : []}
          onSelect={({ key }) => void store.switchTo(key)}
          items={convMenuItems}
        />
      </Flex>
      <Flex vertical flex={1} style={{ overflow: "hidden" }}>
        {messages.length === 0 ? (
          <PromptSuggestions onPick={handlePromptClick} />
        ) : (
          <div
            ref={scrollRef}
            style={{ flex: 1, overflow: "auto", padding: 16 }}
          >
            {chatItems.map((item) =>
              item.type === "child_session" ? (
                <ChildSessionEntry
                  key={item.key}
                  store={store}
                  session={item.childSession!}
                />
              ) : item.bubble!.kind === "user" ? (
                <UserBubble
                  key={item.key}
                  item={item.bubble!}
                  onRevert={handleRevert}
                />
              ) : (
                <AssistantBubble key={item.key} item={item.bubble!} />
              ),
            )}
          </div>
        )}
        <Flex
          vertical
          style={{
            padding: 8,
            borderTop: "1px solid #f0f0f0",
            background: "#fff",
          }}
        >
          {revert.canRestore ? (
            <Flex justify="center" style={{ padding: "4px 0" }}>
              <Button
                size="small"
                type="link"
                icon={<HistoryOutlined />}
                onClick={() => void store.clearRevert()}
              >
                撤销回退（恢复 {revert.hiddenCount} 条消息）
              </Button>
            </Flex>
          ) : null}
          {error ? (
            <Typography.Text type="danger" style={{ padding: "4px 8px" }}>
              {error.message}
            </Typography.Text>
          ) : null}
          <Input.TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入你的问题..."
            disabled={requesting}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                const val = inputValue.trim();
                if (val) handleSubmit(val);
              }
            }}
            autoSize={{ minRows: 2, maxRows: 6 }}
          />
          <Flex justify="space-between" align="center" style={{ marginTop: 8 }}>
            <Flex gap={8}>
              <Button size="small" onClick={handleConfigOpen}>
                配置
              </Button>
            </Flex>
            {requesting ? (
              <Button size="small" danger onClick={() => void store.abort()}>
                取消
              </Button>
            ) : (
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                onClick={() => {
                  const val = inputValue.trim();
                  if (val) handleSubmit(val);
                }}
              >
                发送
              </Button>
            )}
          </Flex>
        </Flex>
        <ConfigModal
          open={configOpen}
          loading={configLoading}
          providers={providers}
          onClose={handleConfigClose}
        />
        <RenameModal
          open={renameTarget !== null}
          value={renameValue}
          onChange={setRenameValue}
          onClose={() => {
            setRenameTarget(null);
            setRenameValue("");
          }}
          onConfirm={handleRenameConfirm}
        />
      </Flex>
    </Flex>
  );
};
