import ReactMarkdown from "react-markdown";
import { Avatar, Card, Collapse, Spin, Typography } from "antd";
import { CodeBlock } from "../../../components/CodeBlock";
import { ToolCalls } from "./ToolCalls";
import type { AssistantBubble as AssistantBubbleData } from "../../../lib/opencode-store";

export function AssistantBubble({ item }: { item: AssistantBubbleData }) {
  const streamActive = item.status === "streaming" || item.status === "pending";

  return (
    <div style={{ marginBottom: 16 }}>
      {item.thinking ? (
        <Collapse
          size="small"
          defaultActiveKey={["think"]}
          items={[
            {
              key: "think",
              label: (
                <span>
                  思考过程
                  {streamActive && item.phase === "thinking" ? (
                    <Spin size="small" style={{ marginLeft: 8 }} />
                  ) : null}
                </span>
              ),
              children: (
                <Typography.Paragraph
                  style={{ margin: 0, whiteSpace: "pre-wrap" }}
                  type="secondary"
                >
                  {item.thinking}
                </Typography.Paragraph>
              ),
            },
          ]}
        />
      ) : null}

      {item.toolCalls.length > 0 ? <ToolCalls toolCalls={item.toolCalls} /> : null}

      {item.text ? (
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
              opacity: item.status === "pending" ? 0.7 : 1,
            }}
            styles={{ body: { padding: "8px 12px" } }}
          >
            {streamActive && !item.text ? (
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
                  {item.text}
                </ReactMarkdown>
              </div>
            )}
          </Card>
        </div>
      ) : item.status === "pending" ? (
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
