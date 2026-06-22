import { HistoryOutlined, RollbackOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Dropdown, Flex, Input, Menu, Typography } from "antd";
import { useCallback, useMemo, useEffect, useRef, useState } from "react";
import type { OpenCodeSession } from "../../api/types/index";
import { OpencodeClient } from "../../lib/opencode-client";
import { useOpencodeClient } from "../../lib/opencode-client/useOpencodeClient";
import { useProviders } from "./hooks/useProviders";
import { UserBubble } from "./components/UserBubble";
import { AssistantBubble } from "./components/AssistantBubble";
import { ChildSessionEntry } from "./components/ChildSessionEntry";
import { PromptSuggestions } from "./components/PromptSuggestions";
import { ConfigModal } from "./components/ConfigModal";
import { RenameModal } from "./components/RenameModal";
import type { BubbleItem } from "../../lib/opencode-client/types";

const client = OpencodeClient.create();

export const AgentChat = () => {
  const [inputValue, setInputValue] = useState("");
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    requesting,
    hiddenCount,
    childSessions,
    sessions,
    sessionID,
    switchSession,
    sendMessage,
    revertMessage: clientRevert,
    unrevertMessages,
    abortSession,
    createSession,
    deleteSession,
    renameSession,
  } = useOpencodeClient(client);

  useEffect(() => {
    if (sessions.length > 0 && !sessionID) {
      const first = sessions[0];
      if (first) switchSession(first.key);
    }
  }, [sessions, sessionID, switchSession]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleRevert = useCallback(
    async (messageID: string) => {
      const text = await clientRevert(messageID);
      if (text) setInputValue(text);
    },
    [clientRevert],
  );

  const submit = useCallback(
    (text: string) => {
      if (requesting || !sessionID) return;
      sendMessage(text);
    },
    [requesting, sessionID, sendMessage],
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
    const id = await createSession("新对话");
    switchSession(id);
  }, [createSession, switchSession]);

  const handleDeleteConversation = useCallback(
    async (key: string) => {
      await deleteSession(key);
    },
    [deleteSession],
  );

  const handleRenameConversation = useCallback(
    (key: string) => {
      const conv = sessions.find((s) => s.key === key);
      setRenameTarget(key);
      setRenameValue(
        typeof conv?.label === "string" ? conv.label : key.slice(0, 8),
      );
    },
    [sessions],
  );

  const handleRenameConfirm = useCallback(async () => {
    if (!renameTarget || !renameValue.trim()) return;
    await renameSession(renameTarget, renameValue.trim());
    setRenameTarget(null);
    setRenameValue("");
  }, [renameTarget, renameValue, renameSession]);

  const convMenuItems = sessions.map((conv) => ({
    key: conv.key,
    label: (
      <Dropdown
        menu={{
          items: [
            {
              key: "rename",
              label: "重命名",
              onClick: () => handleRenameConversation(conv.key),
            },
            {
              key: "delete",
              label: "删除对话",
              danger: true,
              onClick: () => handleDeleteConversation(conv.key),
            },
          ],
        }}
        trigger={["contextMenu"]}
      >
        <span>{conv.label}</span>
      </Dropdown>
    ),
  }));

  const chatItems = useMemo(() => {
    interface ChatItem {
      key: string;
      time: number;
      type: "message" | "child_session";
      bubbleItem?: BubbleItem;
      childSession?: OpenCodeSession;
    }
    const items: ChatItem[] = messages.map((b) => ({
      key: String(b.key),
      time: b.time ?? 0,
      type: "message" as const,
      bubbleItem: b,
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
  } = useProviders();

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
          onSelect={({ key }) => switchSession(key)}
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
                <ChildSessionEntry key={item.key} session={item.childSession!} />
              ) : item.bubbleItem!.role === "user" ? (
                <UserBubble
                  key={item.key}
                  item={item.bubbleItem!}
                  onRevert={handleRevert}
                />
              ) : (
                <AssistantBubble key={item.key} item={item.bubbleItem!} />
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
          {hiddenCount > 0 ? (
            <Flex justify="center" style={{ padding: "4px 0" }}>
              <Button
                size="small"
                type="link"
                icon={<HistoryOutlined />}
                onClick={unrevertMessages}
              >
                撤销回退（恢复 {hiddenCount} 条消息）
              </Button>
            </Flex>
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
              <Button size="small" danger onClick={abortSession}>
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