import { useCallback, useSyncExternalStore } from "react";
import type { SessionManager } from "./session-manager";
import type { Session } from "./session";
import type { ManagerSnapshot, SessionSnapshot } from "./types";

export function useManager<T>(
  manager: SessionManager,
  selector: (s: ManagerSnapshot) => T,
): T {
  const subscribe = useCallback(
    (listener: () => void) => manager.subscribe(listener),
    [manager],
  );
  const getSnapshot = useCallback(
    () => selector(manager.getSnapshot()),
    [manager, selector],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useSession<T>(
  session: Session,
  selector: (s: SessionSnapshot) => T,
): T {
  const subscribe = useCallback(
    (listener: () => void) => session.subscribe(listener),
    [session],
  );
  const getSnapshot = useCallback(
    () => selector(session.getSnapshot()),
    [session, selector],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const managerSelectors = {
  sessions: (s: ManagerSnapshot) => s.sessions,
  activeID: (s: ManagerSnapshot) => s.activeID,
  providers: (s: ManagerSnapshot) => s.providers,
  providersLoading: (s: ManagerSnapshot) => s.providersLoading,
  error: (s: ManagerSnapshot) => s.error,
} as const;

export const sessionSelectors = {
  loading: (s: SessionSnapshot) => s.loading,
  messages: (s: SessionSnapshot) => s.messages,
  childSessions: (s: SessionSnapshot) => s.childSessions,
  requesting: (s: SessionSnapshot) => s.requesting,
  streamPhase: (s: SessionSnapshot) => s.streamPhase,
  revert: (s: SessionSnapshot) => s.revert,
  error: (s: SessionSnapshot) => s.error,
} as const;
