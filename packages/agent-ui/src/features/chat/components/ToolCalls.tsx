import { Collapse, Steps, Tag } from "antd";
import { useMemo, useState } from "react";
import type { ToolPart } from "@opencode-ai/sdk";
import { useDesignTokens } from "../hooks/useDesignTokens";

export function ToolCalls({ toolCalls }: { toolCalls: readonly ToolPart[] }) {
  const t = useDesignTokens();
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  const stepsItems = useMemo(
    () =>
      toolCalls.map((tc, i) => {
        const state = tc.state;
        const inputStr = JSON.stringify(state.input, null, 2);
        return {
          key: String(i),
          title: tc.tool,
          description: inputStr,
          status: (state.status === "completed"
            ? "finish"
            : state.status === "error"
              ? "error"
              : "process") as "finish" | "error" | "process",
        };
      }),
    [toolCalls],
  );

  const resultList = useMemo(
    () =>
      toolCalls.map((tc, i) => {
        const state = tc.state;
        const resultStr =
          state.status === "completed"
            ? (state.output ?? "")
            : state.status === "error"
              ? (state.error ?? "")
              : "";
        return { key: i, text: resultStr };
      }),
    [toolCalls],
  );

  const allDone = stepsItems.every((s) => s.status === "finish");
  const hasError = stepsItems.some((s) => s.status === "error");
  const statusTag = allDone ? (
    <Tag color="success">完成</Tag>
  ) : hasError ? (
    <Tag color="error">失败</Tag>
  ) : (
    <Tag color="processing">进行中</Tag>
  );

  return (
    <div style={{ marginTop: t.space.sm }}>
      <Collapse
        size="small"
        activeKey={activeKeys}
        onChange={(keys) => setActiveKeys(keys as string[])}
        items={[
          {
            key: "tool-calls",
            label: (
              <span>
                工具调用 ({toolCalls.length}) {statusTag}
              </span>
            ),
            children: (
              <div>
                <Steps
                  orientation="vertical"
                  size="small"
                  current={toolCalls.length}
                  items={stepsItems}
                />
                {resultList.map(({ key, text }) => {
                  if (!text) return null;
                  return (
                    <pre
                      key={key}
                      style={{
                        margin: `${t.space.xs}px 0 0 0`,
                        whiteSpace: "pre-wrap",
                        maxHeight: 300,
                        overflow: "auto",
                        background: t.color.bgSubtle,
                        padding: t.space.sm,
                        borderRadius: t.radius.sm,
                      }}
                    >
                      {text}
                    </pre>
                  );
                })}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
