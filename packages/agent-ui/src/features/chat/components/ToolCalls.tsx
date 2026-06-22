import { Collapse, Steps } from "antd";
import { useState, useMemo } from "react";
import type { ToolPart } from "../../../api/types/index";

export function ToolCalls({ toolCalls }: { toolCalls: ToolPart[] }) {
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  const stepsItems = useMemo(
    () =>
      toolCalls.map((tc, i) => {
        const state = tc.state;
        const inputStr =
          "input" in state ? JSON.stringify(state.input, null, 2) : "";
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

  return (
    <div style={{ marginTop: 8 }}>
      <Collapse
        size="small"
        activeKey={activeKeys}
        onChange={(keys) => setActiveKeys(keys as string[])}
        items={[
          {
            key: "tool-calls",
            label: `工具调用 (${toolCalls.length})`,
            extra: stepsItems.every((s) => s.status === "finish")
              ? "✅ 完成"
              : stepsItems.some((s) => s.status === "error")
                ? "❌ 失败"
                : "⏳ 进行中",
            children: (
              <div>
                <Steps
                  orientation="vertical"
                  size="small"
                  current={toolCalls.length}
                  items={stepsItems}
                />
                {toolCalls.map((tc, i) => {
                  const state = tc.state;
                  const resultStr =
                    state.status === "completed"
                      ? (state.result ?? "")
                      : state.status === "error"
                        ? (state.error ?? "")
                        : "";
                  if (!resultStr) return null;
                  return (
                    <pre
                      key={i}
                      style={{
                        margin: "4px 0 0 0",
                        whiteSpace: "pre-wrap",
                        maxHeight: 300,
                        overflow: "auto",
                        background: "#f6f8fa",
                        padding: 8,
                        borderRadius: 4,
                      }}
                    >
                      {resultStr}
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
