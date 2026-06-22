import { useEffect, useState, useCallback } from "react";
import type { OpenCodeSession } from "../../api/types/index";
import type { OpencodeClient } from "./client";
import type { BubbleItem, SessionItem } from "./types";

export function useOpencodeClient(client: OpencodeClient) {
  const [messages, setMessages] = useState<BubbleItem[]>(client.messages);
  const [requesting, setRequesting] = useState(client.requesting);
  const [sessionID, setSessionID] = useState(client.sessionID);
  const [childSessions, setChildSessions] = useState<OpenCodeSession[]>(
    client.childSessions,
  );
  const [sessions, setSessions] = useState<SessionItem[]>(client.sessions);
  const [hiddenCount, setHiddenCount] = useState(client.hiddenCount);

  useEffect(() => {
    const sync = () => {
      setMessages(client.messages);
      setHiddenCount(client.hiddenCount);
    };
    const onRequesting = (r: boolean) => setRequesting(r);
    const onSession = (sid: string | undefined) => {
      setSessionID(sid);
      sync();
    };
    const onChildSessions = (ss: OpenCodeSession[]) => setChildSessions(ss);
    const onSessions = (ss: SessionItem[]) => setSessions(ss);

    client.on("messagesChanged", sync);
    client.on("requesting", onRequesting);
    client.on("sessionChanged", onSession);
    client.on("childSessionsChanged", onChildSessions);
    client.on("sessionsChanged", onSessions);

    client.refreshSessions();

    return () => {
      client.off("messagesChanged", sync);
      client.off("requesting", onRequesting);
      client.off("sessionChanged", onSession);
      client.off("childSessionsChanged", onChildSessions);
      client.off("sessionsChanged", onSessions);
    };
  }, [client]);

  const switchSession = useCallback(
    (sessionID: string) => client.switchSession(sessionID),
    [client],
  );

  const sendMessage = useCallback(
    (text: string) => client.sendMessage(text),
    [client],
  );

  const revertMessage = useCallback(
    async (messageID: string) => {
      const text = await client.revertMessage(messageID);
      setHiddenCount(client.hiddenCount);
      return text;
    },
    [client],
  );

  const unrevertMessages = useCallback(async () => {
    await client.unrevertMessages();
    setHiddenCount(client.hiddenCount);
  }, [client]);

  const abortSession = useCallback(
    () => client.abortSession(),
    [client],
  );

  const createSession = useCallback(
    (title: string) => client.createSession(title),
    [client],
  );

  const deleteSession = useCallback(
    (sessionID: string) => client.deleteSession(sessionID),
    [client],
  );

  const renameSession = useCallback(
    (sessionID: string, title: string) => client.renameSession(sessionID, title),
    [client],
  );

  return {
    messages,
    requesting,
    sessionID,
    hiddenCount,
    childSessions,
    sessions,
    switchSession,
    sendMessage,
    revertMessage,
    unrevertMessages,
    abortSession,
    createSession,
    deleteSession,
    renameSession,
  };
}