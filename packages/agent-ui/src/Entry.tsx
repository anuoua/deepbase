import { App as AntdApp, ConfigProvider, theme } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
import { App } from "./App";

const getContainer = () => document.body;

export const Entry = () => {
  return (
    <StyleProvider layer>
      <ConfigProvider
        theme={{ algorithm: theme.defaultAlgorithm }}
        getPopupContainer={getContainer}
      >
        <AntdApp message={{ getContainer }} notification={{ getContainer }}>
          <App />
        </AntdApp>
      </ConfigProvider>
    </StyleProvider>
  );
};
