import { Form, Modal, Select, Spin, Typography } from "antd";
import { useOpencode, selectors } from "../../../lib/opencode-store";
import type { OpencodeStore } from "../../../lib/opencode-store";

export function ConfigModal({
  store,
  open,
  onClose,
}: {
  store: OpencodeStore;
  open: boolean;
  onClose: () => void;
}) {
  const providers = useOpencode(store, selectors.providers);
  const loading = useOpencode(store, selectors.providersLoading);

  return (
    <Modal
      title="配置"
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      {loading ? (
        <Spin>
          <Typography.Text>加载中...</Typography.Text>
        </Spin>
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
