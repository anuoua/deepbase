import { Alert, Button, Flex, Input } from "antd";
import { HistoryOutlined, SendOutlined } from "@ant-design/icons";
import { useCallback, useState } from "react";
import {
  useOpencode,
  selectors,
  type OpencodeStore,
} from "../../../lib/opencode-store";
import { useDesignTokens } from "../hooks/useDesignTokens";

export function MessageInput({
  store,
  onConfigOpen,
}: {
  store: OpencodeStore;
  onConfigOpen: () => void;
}) {
  const t = useDesignTokens();
  const [inputValue, setInputValue] = useState("");

  const requesting = useOpencode(store, selectors.requesting);
  const revert = useOpencode(store, selectors.revert);
  const error = useOpencode(store, selectors.error);
  const sessionID = useOpencode(store, selectors.sessionID);

  const submit = useCallback(
    (text: string) => {
      if (requesting || !sessionID) return;
      void store.send(text);
      setInputValue("");
    },
    [requesting, sessionID, store],
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
              onClick={() => void store.clearRevert()}
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
          closable={{ onClose: () => store.clearError() }}
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
          <Button size="small" danger onClick={() => void store.abort()}>
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
