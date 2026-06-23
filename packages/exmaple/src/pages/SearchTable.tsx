import { Flex, Splitter, Typography } from "antd";

export const Desc: React.FC<Readonly<{ text?: string | number }>> = (props) => (
  <Flex justify="center" align="center" style={{ height: "100%" }}>
    <Typography.Title
      type="secondary"
      level={5}
      style={{ whiteSpace: "nowrap" }}
    >
      {props.text}
    </Typography.Title>
  </Flex>
);

export const SearchTable = () => {
  return (
    <Splitter className="panel" style={{ height: 600 }}>
      <Splitter.Panel>
        <Desc text="First" />
      </Splitter.Panel>
      <Splitter.Panel>
        <Desc text="Second" />
      </Splitter.Panel>
      {/* third */}
      <Splitter.Panel>
        <Desc text="Third" />
      </Splitter.Panel>
      <Splitter.Panel>
        <Desc text="Fourth" />
      </Splitter.Panel>
    </Splitter>
  );
};
