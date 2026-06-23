import type { Provider } from "@opencode-ai/sdk";
import type { OpencodeStore } from "../../../lib/opencode-store";
import { useState, useCallback } from "react";

export function useProviders(store: OpencodeStore) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setOpen(true);
    setLoading(true);
    try {
      const r = await store.sdkClient.config.providers();
      if (r.error) throw r.error;
      setProviders(r.data?.providers ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [store]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  return { providers, loading, open, load, close };
}
