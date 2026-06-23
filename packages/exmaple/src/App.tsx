import React from "react";
import { LayoutOutlined, TableOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Breadcrumb, Button, Layout, Menu } from "antd";
import { SearchTable } from "./pages/SearchTable";
import { GridEditor } from "./pages/GridEditor";
import { useState } from "react";

const { Content } = Layout;

const items1: MenuProps["items"] = ["1", "2", "3"].map((key) => ({
  key,
  label: `nav ${key}`,
}));

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>("3");

  const pageMap: Record<string, React.ReactNode> = {
    "1": <div style={{ padding: 24 }}>Dashboard</div>,
    "2": <SearchTable />,
    "3": (
      <GridEditor>
        <div
          style={{
            gridArea: "header",
          }}
        >
          header
        </div>
        <div
          style={{
            gridArea: "sidebar",
          }}
        >
          <Menu
            items={[
              {
                label: "abc",
                key: "abc",
              },
              {
                label: "ccc",
                key: "ccc",
              },
            ]}
          ></Menu>
        </div>
      </GridEditor>
    ),
  };

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
          defaultSelectedKeys={["3"]}
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
          defaultSelectedKeys={["3"]}
          defaultOpenKeys={["sub2"]}
          style={{ height: "100%", borderRight: "none" }}
          items={[
            {
              key: "sub1",
              icon: React.createElement(TableOutlined),
              label: "数据表格",
              children: [
                { key: "1", label: "Dashboard" },
                { key: "2", label: "SearchTable" },
              ],
            },
            {
              key: "sub2",
              icon: React.createElement(LayoutOutlined),
              label: "布局工具",
              children: [{ key: "3", label: "Grid编辑器" }],
            },
          ]}
          onClick={({ key }) => setCurrentPage(key)}
        />
      </div>

      <div
        style={{
          gridArea: "main",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        <Content
          style={{
            padding: "0 24px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 0",
            }}
          >
            <Breadcrumb
              items={[
                { title: "Home" },
                {
                  title:
                    currentPage === "3"
                      ? "Grid编辑器"
                      : currentPage === "2"
                        ? "SearchTable"
                        : "Dashboard",
                },
              ]}
            />
          </div>
          <div style={{ flex: 1, overflow: "auto" }}>
            {pageMap[currentPage] || <SearchTable />}
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
