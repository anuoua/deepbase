import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";

export function CodeBlock(props: ComponentPropsWithoutRef<"pre">) {
  const children = props.children as ReactNode;
  const codeEl = extractCodeElement(children);
  const codeProps = (codeEl as any)?.props;
  const className = codeProps?.className as string | undefined;
  const match = /language-(\w+)/.exec(className || "");
  const codeString = extractText(codeProps?.children);

  if (match) {
    return (
      <SyntaxHighlighter
        style={oneLight}
        language={match[1]}
        customStyle={{ margin: "8px 0", borderRadius: 6 }}
      >
        {codeString}
      </SyntaxHighlighter>
    );
  }

  return <pre>{children}</pre>;
}

function extractCodeElement(node: ReactNode): ReactElement | undefined {
  if (!node || typeof node !== "object") return;
  const el = node as ReactElement;
  if (el.type === "code") return el;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = extractCodeElement(child);
      if (found) return found;
    }
  }
  return;
}

function extractText(node: unknown): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((n) => extractText(n)).join("");
  if (
    node &&
    typeof node === "object" &&
    "props" in (node as Record<string, unknown>)
  ) {
    return extractText((node as any).props?.children);
  }
  return "";
}
