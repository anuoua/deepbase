import { useCallback, useSyncExternalStore } from "react";
import type { OpencodeStore } from "./store";
import type { Bubble, ClientSnapshot } from "./types";

const EMPTY_MESSAGES: readonly Bubble[] = Object.freeze([]);

export function useOpencode<T>(
  store: OpencodeStore,
  selector: (s: ClientSnapshot) => T,
): T {
  const subscribe = useCallback(
    (listener: () => void) => store.subscribe(listener),
    [store],
  );
  const getSnapshot = useCallback(
    () => selector(store.getSnapshot()),
    [store, selector],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const selectors = {
  sessionID: (s: ClientSnapshot) => s.sessionID,
  sessions: (s: ClientSnapshot) => s.sessions,
  messages: (s: ClientSnapshot) => s.messages,
  childSessions: (s: ClientSnapshot) => s.childSessions,
  childMessages: (sessionID: string) => (s: ClientSnapshot) =>
    s.childMessages.get(sessionID) ?? EMPTY_MESSAGES,
  isChildLoading: (sessionID: string) => (s: ClientSnapshot) =>
    s.childLoading.has(sessionID),
  requesting: (s: ClientSnapshot) => s.requesting,
  streamPhase: (s: ClientSnapshot) => s.streamPhase,
  revert: (s: ClientSnapshot) => s.revert,
  providers: (s: ClientSnapshot) => s.providers,
  providersLoading: (s: ClientSnapshot) => s.providersLoading,
  error: (s: ClientSnapshot) => s.error,
} as const;
