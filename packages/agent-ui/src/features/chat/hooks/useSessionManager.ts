import { useCallback, useState } from "react";
import type { OpencodeStore } from "../../../lib/opencode-store";

export function useSessionManager(store: OpencodeStore) {
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const create = useCallback(async () => {
    const id = await store.createSession({ title: "新对话", switch: true });
    return id;
  }, [store]);

  const remove = useCallback(
    async (sessionID: string) => {
      await store.deleteSession(sessionID);
    },
    [store],
  );

  const switchTo = useCallback(
    (sessionID: string) => {
      void store.switchTo(sessionID);
    },
    [store],
  );

  const startRename = useCallback(
    (sessionID: string, currentTitle: string) => {
      setRenameTarget(sessionID);
      setRenameValue(currentTitle);
    },
    [],
  );

  const cancelRename = useCallback(() => {
    setRenameTarget(null);
    setRenameValue("");
  }, []);

  const confirmRename = useCallback(async () => {
    if (!renameTarget || !renameValue.trim()) return;
    await store.renameSession(renameTarget, renameValue.trim());
    setRenameTarget(null);
    setRenameValue("");
  }, [renameTarget, renameValue, store]);

  return {
    create,
    remove,
    switchTo,
    renameTarget,
    renameValue,
    setRenameValue,
    startRename,
    cancelRename,
    confirmRename,
  } as const;
}
