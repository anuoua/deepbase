import { useEffect, type RefObject } from "react";

export function useAutoScroll<T>(
  ref: RefObject<HTMLElement | null>,
  deps: readonly T[],
): void {
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, deps);
}
