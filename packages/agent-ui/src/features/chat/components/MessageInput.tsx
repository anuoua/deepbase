import { Alert, Button, Flex, Input } from "antd";
import { HistoryOutlined, SendOutlined } from "@ant-design/icons";
import { useCallback, useState } from "react";
import {
  useSession,
  sessionSelectors,
  type Session,
} from "../../../lib/opencode-store";
import { useDesignTokens } from "../hooks/useDesignTokens";

export function MessageInput({
  session,
  onConfigOpen,
}: {
  session: Session;
  onConfigOpen: () => void;
}) {
  const t = useDesignTokens();
  const [inputValue, setInputValue] = useState("");

  const requesting = useSession(session, sessionSelectors.requesting);
  const revert = useSession(session, sessionSelectors.revert);
  const error = useSession(session, sessionSelectors.error);

  const submit = useCallback(
    (text: string) => {
      if (requesting) return;
      void session.send(text);
      setInputValue("");
    },
    [requesting, session],
  );

  return (
    <Flex
      vertical
      style={{
        padding: t.space.sm,
        borderTop: `1px solid ${t.color.border}`,
        background: t.color.bg,
      }}
    >
      {revert.canRestore ? (
        <Alert
          type="info"
          showIcon
          icon={<HistoryOutlined />}
          title={`已回退（隐藏 ${revert.hiddenCount} 条消息）`}
          action={
            <Button
              size="small"
              type="link"
              onClick={() => void session.clearRevert()}
            >
              撤销回退
            </Button>
          }
          style={{ marginBottom: t.space.sm }}
        />
      ) : null}

      {error ? (
        <Alert
          type="error"
          showIcon
          title={error.message}
          closable={{ onClose: () => session.clearError() }}
          style={{ marginBottom: t.space.sm }}
        />
      ) : null}

      <Input.TextArea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="输入你的问题..."
        disabled={requesting}
        onPressEnter={(e) => {
          if (!e.shiftKey) {
            e.preventDefault();
            const val = inputValue.trim();
            if (val) submit(val);
          }
        }}
        autoSize={{ minRows: 2, maxRows: 6 }}
      />

      <Flex
        justify="space-between"
        align="center"
        style={{ marginTop: t.space.sm }}
      >
        <Flex gap={t.space.sm}>
          <Button size="small" onClick={onConfigOpen}>
            配置
          </Button>
        </Flex>
        {requesting ? (
          <Button size="small" danger onClick={() => void session.abort()}>
            取消
          </Button>
        ) : (
          <Button
            type="primary"
            size="small"
            icon={<SendOutlined />}
            onClick={() => {
              const val = inputValue.trim();
              if (val) submit(val);
            }}
          >
            发送
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
