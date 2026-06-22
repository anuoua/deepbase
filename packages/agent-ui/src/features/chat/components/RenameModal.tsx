import { Input, Modal } from "antd";

export function RenameModal({
  open,
  value,
  onClose,
  onChange,
  onConfirm,
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onChange: (v: string) => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title="重命名对话"
      open={open}
      onCancel={onClose}
      onOk={onConfirm}
    >
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPressEnter={onConfirm}
        placeholder="输入新名称"
      />
    </Modal>
  );
}
