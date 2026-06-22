import type { ProviderConfig } from "../../../api/types/index";
import { useState, useCallback } from "react";
import { opencode } from "../../../api/client";

export function useProviders() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setOpen(true);
    setLoading(true);
    try {
      const res = await opencode.getProviders();
      setProviders(res.providers);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  return { providers, loading, open, load, close };
}
