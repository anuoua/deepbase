import { useCallback, useSyncExternalStore } from "react";
import type { OpencodeStore } from "./store";
import type { ClientSnapshot } from "./types";

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
  requesting: (s: ClientSnapshot) => s.requesting,
  streamPhase: (s: ClientSnapshot) => s.streamPhase,
  revert: (s: ClientSnapshot) => s.revert,
  error: (s: ClientSnapshot) => s.error,
} as const;
