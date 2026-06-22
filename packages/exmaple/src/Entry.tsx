import { App as AntdApp, ConfigProvider, theme } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
import { App } from "./App";

const getContainer = () => document.body;

export const Entry = () => {
  return (
    <StyleProvider layer>
      <ConfigProvider
        getPopupContainer={getContainer}
        getTargetContainer={getContainer}
      >
        <AntdApp
          style={{
            height: "100vh",
          }}
          message={{
            getContainer,
          }}
          notification={{
            getContainer,
          }}
        >
          <App />
        </AntdApp>
      </ConfigProvider>
    </StyleProvider>
  );
};
