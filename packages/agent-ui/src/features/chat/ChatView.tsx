import { Flex } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  OpencodeStore,
  useOpencode,
  selectors,
} from "../../lib/opencode-store";
import { useSessionManager } from "./hooks/useSessionManager";
import { ChatSidebar } from "./components/ChatSidebar";
import { MessageList } from "./components/MessageList";
import { MessageInput } from "./components/MessageInput";
import { PromptSuggestions } from "./components/PromptSuggestions";
import { ConfigModal } from "./components/ConfigModal";
import { RenameModal } from "./components/RenameModal";
import { SubagentModal } from "./components/SubagentModal";

const store = OpencodeStore.create();

export const AgentChat = () => {
  const [configOpen, setConfigOpen] = useState(false);
  const [subagentSession, setSubagentSession] = useState<{
    id: string;
    title?: string;
  } | null>(null);

  const messages = useOpencode(store, selectors.messages);
  const sessions = useOpencode(store, selectors.sessions);
  const sessionID = useOpencode(store, selectors.sessionID);
  const childSessions = useOpencode(store, selectors.childSessions);

  const sessionManager = useSessionManager(store);

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
    if (subagentSession) {
      store.ensureChildMessages(subagentSession.id);
    }
  }, [subagentSession]);

  const handleRevert = useCallback(async (messageID: string) => {
    const text = await store.revertTo(messageID);
    return text;
  }, []);

  const handleSubtaskClick = useCallback((childSessionID: string) => {
    const child = childSessions.find((s) => s.id === childSessionID);
    setSubagentSession(
      child
        ? { id: childSessionID, title: child.title }
        : { id: childSessionID },
    );
  }, [childSessions]);

  const handleConfigOpen = useCallback(() => {
    void store.loadProviders();
    setConfigOpen(true);
  }, []);

  return (
    <Flex style={{ height: "100vh" }}>
      <ChatSidebar store={store} sessionManager={sessionManager} />
      <Flex vertical flex={1} style={{ overflow: "hidden" }}>
        {messages.length === 0 && sessionID ? (
          <PromptSuggestions onPick={(label) => void store.send(label)} />
        ) : (
          <MessageList
            store={store}
            onRevert={handleRevert}
            onSubtaskClick={handleSubtaskClick}
          />
        )}
        <MessageInput store={store} onConfigOpen={handleConfigOpen} />
        <ConfigModal
          store={store}
          open={configOpen}
          onClose={() => setConfigOpen(false)}
        />
        <RenameModal
          open={sessionManager.renameTarget !== null}
          value={sessionManager.renameValue}
          onClose={sessionManager.cancelRename}
          onChange={sessionManager.setRenameValue}
          onConfirm={sessionManager.confirmRename}
        />
        {subagentSession ? (
          <SubagentModal
            store={store}
            sessionID={subagentSession.id}
            {...("title" in subagentSession && subagentSession.title
              ? { title: subagentSession.title }
              : {})}
            open={!!subagentSession}
            onClose={() => setSubagentSession(null)}
          />
        ) : null}
      </Flex>
    </Flex>
  );
};
