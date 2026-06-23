import { theme } from "antd";

export function useDesignTokens() {
  const { token } = theme.useToken();
  return {
    color: {
      bg: token.colorBgContainer,
      bgSubtle: token.colorBgLayout,
      bgElevated: token.colorBgElevated,
      border: token.colorBorderSecondary,
      borderStrong: token.colorBorder,
      userBubble: token.colorPrimaryBg,
      userBubbleBorder: token.colorPrimaryBorder,
      error: token.colorError,
      errorBg: token.colorErrorBg,
      success: token.colorSuccess,
      warning: token.colorWarning,
      textSecondary: token.colorTextSecondary,
      textTertiary: token.colorTextTertiary,
    },
    space: {
      xs: token.marginXS,
      sm: token.marginSM,
      md: token.marginMD,
      lg: token.marginLG,
      xl: token.marginXL,
    },
    radius: {
      xs: token.borderRadiusXS,
      sm: token.borderRadiusSM,
      md: token.borderRadius,
      lg: token.borderRadiusLG,
    },
    font: {
      sm: token.fontSizeSM,
      base: token.fontSize,
      lg: token.fontSizeLG,
    },
    controlHeight: token.controlHeight,
    controlHeightSM: token.controlHeightSM,
  } as const;
}
