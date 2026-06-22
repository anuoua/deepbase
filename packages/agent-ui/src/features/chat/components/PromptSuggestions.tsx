import { Button, Flex, Typography } from "antd";

const promptItems = [
  { key: "1", label: "什么是闭包？" },
  { key: "2", label: "写一个 useState Hook" },
  { key: "3", label: "如何调试 bug？" },
  { key: "4", label: "系统架构设计原则" },
];

export function PromptSuggestions({ onPick }: { onPick: (label: string) => void }) {
  return (
    <Flex
      vertical
      flex={1}
      align="center"
      justify="center"
      gap={16}
      style={{ padding: "0 32px" }}
    >
      <Typography.Title level={3} style={{ margin: 0 }}>
        你好！我是 DeepBase AI
      </Typography.Title>
      <Typography.Text type="secondary">
        选择一个问题或输入你的问题
      </Typography.Text>
      <Flex wrap gap={8} justify="center">
        {promptItems.map((item) => (
          <Button
            key={item.key}
            onClick={() => onPick(item.label)}
          >
            {item.label}
          </Button>
        ))}
      </Flex>
    </Flex>
  );
}
