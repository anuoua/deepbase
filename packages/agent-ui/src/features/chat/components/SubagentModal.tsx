import { Modal, Spin, Typography, Flex } from "antd";
import {
  useOpencode,
  selectors,
  type OpencodeStore,
} from "../../../lib/opencode-store";
import { MessageList } from "./MessageList";

export function SubagentModal({
  store,
  sessionID,
  title,
  open,
  onClose,
}: {
  store: OpencodeStore;
  sessionID: string;
  title?: string;
  open: boolean;
  onClose: () => void;
}) {
  const messages = useOpencode(store, selectors.childMessages(sessionID));
  const loading = useOpencode(store, selectors.isChildLoading(sessionID));

  return (
    <Modal
      title={
        <span>
          🤖 subagent
          {title ? (
            <Typography.Text
              type="secondary"
              style={{ marginLeft: 8, fontSize: 14 }}
            >
              {title}
            </Typography.Text>
          ) : null}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      styles={{
        body: {
          height: "60vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: 0,
        },
      }}
    >
      {loading && messages.length === 0 ? (
        <Flex flex={1} align="center" justify="center">
          <Spin />
        </Flex>
      ) : (
        <MessageList messages={messages} readonly />
      )}
    </Modal>
  );
}
