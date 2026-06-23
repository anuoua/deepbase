import { Flex, Spin } from "antd";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "../../lib/opencode-store";
import {
  SessionManager,
  useManager,
  useSession,
  managerSelectors,
  sessionSelectors,
} from "../../lib/opencode-store";
import { useSessionManagerHook } from "./hooks/useSessionManager";
import { ChatSidebar } from "./components/ChatSidebar";
import { MessageList } from "./components/MessageList";
import { MessageInput } from "./components/MessageInput";
import { PromptSuggestions } from "./components/PromptSuggestions";
import { ConfigModal } from "./components/ConfigModal";
import { RenameModal } from "./components/RenameModal";
import { SubagentModal } from "./components/SubagentModal";

const manager = SessionManager.create();

export const AgentChat = () => {
  const [configOpen, setConfigOpen] = useState(false);
  const [subagentSession, setSubagentSession] = useState<{
    id: string;
    title?: string;
  } | null>(null);

  const sessions = useManager(manager, managerSelectors.sessions);
  const activeID = useManager(manager, managerSelectors.activeID);

  const actions = useSessionManagerHook(manager);

  useEffect(() => {
    void manager.refresh();
  }, []);

  useEffect(() => {
    if (sessions.length > 0 && !activeID) {
      const first = sessions[0];
      if (first) void manager.setActive(first.id);
    }
  }, [sessions, activeID]);

  const session = manager.getActive();

  const handleSubtaskClick = useCallback(
    (childID: string) => {
      if (!session) return;
      const child = session
        .getSnapshot()
        .childSessions.find((s) => s.id === childID);
      setSubagentSession(
        child ? { id: childID, title: child.title } : { id: childID },
      );
    },
    [session],
  );

  return (
    <Flex style={{ height: "100vh" }}>
      <ChatSidebar manager={manager} actions={actions} />
      <Flex vertical flex={1} style={{ overflow: "hidden" }}>
        {session ? (
          <ChatPanel
            key={session.id}
            session={session}
            onConfigOpen={() => {
              void manager.loadProviders();
              setConfigOpen(true);
            }}
            onSubtaskClick={handleSubtaskClick}
            renameProps={{
              open: actions.renameTarget !== null,
              value: actions.renameValue,
              onChange: actions.setRenameValue,
              onClose: actions.cancelRename,
              onConfirm: actions.confirmRename,
            }}
          />
        ) : (
          <Flex flex={1} align="center" justify="center">
            <Spin />
          </Flex>
        )}
        <ConfigModal
          manager={manager}
          open={configOpen}
          onClose={() => setConfigOpen(false)}
        />
        {subagentSession ? (
          <SubagentModal
            manager={manager}
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

function ChatPanel({
  session,
  onConfigOpen,
  onSubtaskClick,
  renameProps,
}: {
  session: Session;
  onConfigOpen: () => void;
  onSubtaskClick: (childSessionID: string) => void;
  renameProps: {
    open: boolean;
    value: string;
    onChange: (v: string) => void;
    onClose: () => void;
    onConfirm: () => void;
  };
}) {
  const messages = useSession(session, sessionSelectors.messages);
  const loading = useSession(session, sessionSelectors.loading);

  const handleRevert = useCallback(
    async (messageID: string) => {
      return session.revertTo(messageID);
    },
    [session],
  );

  if (loading && messages.length === 0) {
    return <Flex flex={1} align="center" justify="center"><Spin /></Flex>;
  }

  if (messages.length === 0) {
    return (
      <>
        <PromptSuggestions onPick={(label) => void session.send(label)} />
        <RenameModal {...renameProps} />
      </>
    );
  }

  return (
    <>
      <MessageList
        messages={messages}
        onRevert={handleRevert}
        onSubtaskClick={onSubtaskClick}
      />
      <MessageInput session={session} onConfigOpen={onConfigOpen} />
      <RenameModal {...renameProps} />
    </>
  );
}
