import { useCallback, useState } from "react";
import type { SessionManager } from "../../../lib/opencode-store";

export function useSessionManagerHook(manager: SessionManager) {
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const create = useCallback(async () => {
    return manager.create({ title: "新对话" });
  }, [manager]);

  const remove = useCallback(
    async (sessionID: string) => {
      await manager.delete(sessionID);
    },
    [manager],
  );

  const switchTo = useCallback(
    (sessionID: string) => {
      void manager.setActive(sessionID);
    },
    [manager],
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
    await manager.rename(renameTarget, renameValue.trim());
    setRenameTarget(null);
    setRenameValue("");
  }, [renameTarget, renameValue, manager]);

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
