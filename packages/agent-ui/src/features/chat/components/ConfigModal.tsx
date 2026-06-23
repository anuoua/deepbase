import { Form, Modal, Select, Typography } from "antd";
import type { Provider } from "@opencode-ai/sdk";

export function ConfigModal({
  open,
  loading,
  providers,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  providers: Provider[];
  onClose: () => void;
}) {
  return (
    <Modal
      title="配置"
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      {loading ? (
        <Typography.Text>加载中...</Typography.Text>
      ) : providers.length > 0 ? (
        <Form layout="vertical">
          <Form.Item label="可用 Provider">
            <Select
              style={{ width: "100%" }}
              placeholder="选择 Provider"
              options={providers.map((p) => ({
                label: p.name,
                value: p.id,
              }))}
            />
          </Form.Item>
        </Form>
      ) : (
        <Typography.Text type="secondary">暂无可用配置</Typography.Text>
      )}
    </Modal>
  );
}
