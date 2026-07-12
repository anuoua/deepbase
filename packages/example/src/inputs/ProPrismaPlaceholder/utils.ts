export const PLACEHOLDER_SENTINEL = "__USERINPUT__";

export function isPlaceholderValue(val: unknown): boolean {
  return (
    typeof val === "object" &&
    val !== null &&
    !Array.isArray(val) &&
    "__isPlaceholder__" in val
  );
}

export function markPlaceholder(): Record<string, true> {
  return { __isPlaceholder__: true };
}

export function mergePlaceholders<T extends Record<string, unknown>>(
  template: T,
  runtimeData: Record<string, unknown>,
): T {
  const result = { ...template } as Record<string, unknown>;

  for (const [key, value] of Object.entries(result)) {
    if (value === PLACEHOLDER_SENTINEL) {
      result[key] = runtimeData[key];
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = mergePlaceholders(
        value as Record<string, unknown>,
        (runtimeData[key] as Record<string, unknown>) ?? {},
      );
    }
  }

  return result as T;
}

export function toPlaceholderAwareValue(
  val: unknown,
): unknown {
  if (isPlaceholderValue(val)) {
    return PLACEHOLDER_SENTINEL;
  }
  return val;
}

export const ITERABLE_FLAG = "__iter__";
export const ITEM_KEY = "__item__";

export function isIterableCreateValue(
  val: unknown,
): val is { __iter__: true; __item__: Record<string, unknown> } {
  return typeof val === "object" && val !== null && !Array.isArray(val) && (val as Record<string, unknown>)[ITERABLE_FLAG] === true;
}

export function markIterable(
  item: Record<string, unknown> = {},
): { __iter__: true; __item__: Record<string, unknown> } {
  return { __iter__: true, __item__: item };
}
