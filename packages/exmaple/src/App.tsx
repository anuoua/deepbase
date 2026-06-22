import React from "react";
import {
  ArrowLeftOutlined,
  LaptopOutlined,
  NotificationOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import { useApp } from "./hooks/useApp";

const { Header, Content, Footer, Sider } = Layout;

const items1: MenuProps["items"] = ["1", "2", "3"].map((key) => ({
  key,
  label: `nav ${key}`,
}));

const items2: MenuProps["items"] = [
  UserOutlined,
  LaptopOutlined,
  NotificationOutlined,
].map((icon, index) => {
  const key = String(index + 1);

  return {
    key: `sub${key}`,
    icon: React.createElement(icon),
    label: `subnav ${key}`,
    children: Array.from({ length: 4 }).map((_, j) => {
      const subKey = index * 4 + j + 1;
      return {
        key: subKey,
        label: `option${subKey}`,
      };
    }),
  };
});

export const App: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG, colorBorder },
  } = theme.useToken();

  const { message } = useApp();

  return (
    <div
      style={{
        height: "100%",
        display: "grid",
        gridTemplate: `
          "header header" auto
          "side main" 1fr
          "footer footer" auto / 200px 1fr
        `,
      }}
    >
      <div
        style={{
          gridArea: "header",
          padding: "4px 8px",
        }}
      >
        <div className="demo-logo" />
        <Menu
          theme="light"
          mode="horizontal"
          styles={{
            root: {},
          }}
          defaultSelectedKeys={["2"]}
          items={items1}
          style={{ flex: 1, minWidth: 0, margin: 0 }}
        />
      </div>

      <div
        style={{
          gridArea: "side",
          borderRight: "1px solid #eeeeee",
        }}
      >
        <Menu
          mode="inline"
          defaultSelectedKeys={["1"]}
          defaultOpenKeys={["sub1"]}
          style={{ height: "100%", borderRight: "none" }}
          items={items2}
        />
      </div>

      <div style={{ gridArea: "main" }}>
        <Content style={{ padding: "0 24px", minHeight: 280 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Breadcrumb
              items={[{ title: "Home" }, { title: "List" }, { title: "App" }]}
            />
          </div>
        </Content>
      </div>

      <div
        style={{
          gridArea: "footer",
          background: "#ccc",
          textAlign: "center",
        }}
      >
        Ant Design ©{new Date().getFullYear()} Created by Ant UED
      </div>
    </div>
  );
};
