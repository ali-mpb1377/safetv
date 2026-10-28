import { Text, type TextProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Typography } from "@/constants/theme";
import {
  PERSIAN_BOLD,
  PERSIAN_FONT_AVAILABLE,
  PERSIAN_REGULAR,
  hasPersian,
} from "@/lib/persianFont";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "h1" | "h2" | "h3" | "h4" | "body" | "small" | "caption" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body",
  ...rest
}: ThemedTextProps) {
  const { theme, isDark } = useTheme();

  const getColor = () => {
    if (isDark && darkColor) {
      return darkColor;
    }

    if (!isDark && lightColor) {
      return lightColor;
    }

    if (type === "link") {
      return theme.link;
    }

    return theme.text;
  };

  const getTypeStyle = () => {
    switch (type) {
      case "h1":
        return Typography.h1;
      case "h2":
        return Typography.h2;
      case "h3":
        return Typography.h3;
      case "h4":
        return Typography.h4;
      case "body":
        return Typography.body;
      case "small":
        return Typography.small;
      case "caption":
        return Typography.caption;
      case "link":
        return Typography.link;
      default:
        return Typography.body;
    }
  };

  // Persian text uses the bundled Vazirmatn (when present) so it renders the
  // same on every device; everything else keeps Rubik.
  const persianStyle =
    PERSIAN_FONT_AVAILABLE && hasPersian(rest.children)
      ? {
          fontFamily:
            type === "h1" || type === "h2" || type === "h3" || type === "h4"
              ? PERSIAN_BOLD
              : PERSIAN_REGULAR,
          fontWeight: "normal" as const,
        }
      : null;

  return (
    <Text
      style={[
        { color: getColor(), fontFamily: "Rubik_400Regular" },
        getTypeStyle(),
        persianStyle,
        style,
      ]}
      {...rest}
    />
  );
}
