import ReactMarkdown from "react-markdown";
import { Avatar, Card, Collapse, Spin, Tag, Typography } from "antd";
import { CodeBlock } from "../../../components/CodeBlock";
import { ToolCalls } from "./ToolCalls";
import type { AssistantBubble as AssistantBubbleData } from "../../../lib/opencode-store";
import { useDesignTokens } from "../hooks/useDesignTokens";

export function AssistantBubble({
  item,
  onSubtaskClick,
}: {
  item: AssistantBubbleData;
  onSubtaskClick?: (sessionID: string) => void;
}) {
  const t = useDesignTokens();
  const streamActive = item.status === "streaming" || item.status === "pending";

  return (
    <div style={{ marginBottom: t.space.lg }}>
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
                    <Spin size="small" style={{ marginLeft: t.space.sm }} />
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

      {item.subtasks.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: t.space.xs,
            marginTop: t.space.sm,
          }}
        >
          {item.subtasks.map((st) =>
            st.childSessionID ? (
              <Tag
                key={st.id}
                color="processing"
                style={{ cursor: "pointer" }}
                onClick={() => onSubtaskClick?.(st.childSessionID!)}
              >
                🤖 {st.agent}: {st.description}
              </Tag>
            ) : (
              <Tag key={st.id} color="default">
                🤖 {st.agent}: {st.description}
              </Tag>
            ),
          )}
        </div>
      ) : null}

      {item.text ? (
        <div style={{ display: "flex", marginTop: t.space.lg }}>
          <Avatar
            style={{
              background: t.color.bgSubtle,
              marginRight: t.space.sm,
              flexShrink: 0,
            }}
          >
            🤖
          </Avatar>
          <Card
            size="small"
            style={{
              flex: 1,
              border: `1px solid ${t.color.border}`,
              opacity: item.status === "pending" ? 0.7 : 1,
            }}
            styles={{ body: { padding: `${t.space.sm}px ${t.space.md}px` } }}
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
                            background: t.color.bgSubtle,
                            padding: `2px ${t.space.xs}px`,
                            borderRadius: t.radius.xs,
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
        <div style={{ display: "flex", marginTop: t.space.lg }}>
          <Avatar
            style={{
              background: t.color.bgSubtle,
              marginRight: t.space.sm,
              flexShrink: 0,
            }}
          >
            🤖
          </Avatar>
          <Card
            size="small"
            style={{
              flex: 1,
              border: `1px solid ${t.color.border}`,
            }}
            styles={{ body: { padding: `${t.space.sm}px ${t.space.md}px` } }}
          >
            <Spin />
          </Card>
        </div>
      ) : null}
    </div>
  );
}
