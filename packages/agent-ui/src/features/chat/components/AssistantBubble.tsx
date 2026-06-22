import ReactMarkdown from "react-markdown";
import { Avatar, Card, Collapse, Spin, Typography } from "antd";
import { CodeBlock } from "../../../components/CodeBlock";
import { ToolCalls } from "./ToolCalls";
import type { AgentUIMessage, BubbleItem } from "../../../lib/opencode-client/types";

export function AssistantBubble({ item }: { item: BubbleItem }) {
  const msg = item.content as AgentUIMessage;
  const streamActive = msg.phase === "thinking" || item.streaming;

  return (
    <div style={{ marginBottom: 16 }}>
      {msg.thinking ? (
        <Collapse
          size="small"
          defaultActiveKey={["think"]}
          items={[
            {
              key: "think",
              label: (
                <span>
                  思考过程
                  {streamActive ? (
                    <Spin size="small" style={{ marginLeft: 8 }} />
                  ) : null}
                </span>
              ),
              children: (
                <Typography.Paragraph
                  style={{ margin: 0, whiteSpace: "pre-wrap" }}
                  type="secondary"
                >
                  {msg.thinking}
                </Typography.Paragraph>
              ),
            },
          ]}
        />
      ) : null}

      {msg.toolCalls && msg.toolCalls.length > 0 ? (
        <ToolCalls toolCalls={msg.toolCalls} />
      ) : null}

      {msg.content ? (
        <div style={{ display: "flex", marginTop: 16 }}>
          <Avatar
            style={{ background: "#f0f0f0", marginRight: 8, flexShrink: 0 }}
          >
            🤖
          </Avatar>
          <Card
            size="small"
            style={{
              flex: 1,
              border: "1px solid #f0f0f0",
              opacity: item.loading ? 0.7 : 1,
            }}
            styles={{ body: { padding: "8px 12px" } }}
          >
            {(item.loading || item.streaming) && !msg.content ? (
              <Spin />
            ) : (
              <div className="markdown-body">
                <ReactMarkdown
                  components={{
                    pre: CodeBlock,
                    code(props) {
                      const { children, className, ...rest } = props;
                      return (
                        <code
                          {...rest}
                          className={className}
                          style={{
                            background: "#f0f0f0",
                            padding: "2px 4px",
                            borderRadius: 3,
                            fontSize: "0.9em",
                          }}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            )}
          </Card>
        </div>
      ) : item.loading ? (
        <div style={{ display: "flex", marginTop: 16 }}>
          <Avatar
            style={{ background: "#f0f0f0", marginRight: 8, flexShrink: 0 }}
          >
            🤖
          </Avatar>
          <Card
            size="small"
            style={{ flex: 1, border: "1px solid #f0f0f0" }}
            styles={{ body: { padding: "8px 12px" } }}
          >
            <Spin />
          </Card>
        </div>
      ) : null}
    </div>
  );
}
