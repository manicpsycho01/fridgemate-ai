import { Text as RNText, type TextProps } from "react-native";
import { colors, typo, type TypoVariant } from "../../theme/tokens";

const TONES = {
  primary: colors.ink,
  secondary: colors.ink2,
  tertiary: colors.ink3,
  herb: colors.herb,
  tomato: colors.tomatoInk,
  danger: colors.pastInk,
  onDark: colors.onDark,
} as const;

export type TextTone = keyof typeof TONES;

type Props = TextProps & {
  variant?: TypoVariant;
  tone?: TextTone;
  center?: boolean;
  /** Tabular figures for counts and quantities. */
  numeric?: boolean;
};

/** Typed text with the Fresh Market scale. Dynamic Type stays on, capped so layouts hold. */
export function Text({ variant = "body", tone = "primary", center, numeric, style, maxFontSizeMultiplier = 1.6, ...rest }: Props) {
  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[typo[variant], { color: TONES[tone] }, center && { textAlign: "center" }, numeric && { fontVariant: ["tabular-nums"] }, style]}
    />
  );
}
