import React, { createContext, forwardRef, useContext } from 'react';
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';

type FontVariant = 'body' | 'display';
type TypographyTextProps = TextProps & { variant?: FontVariant };

const FontsReadyContext = createContext(false);

export function TypographyProvider({ children, ready }: { children: React.ReactNode; ready: boolean }) {
  return <FontsReadyContext.Provider value={ready}>{children}</FontsReadyContext.Provider>;
}

export function useTypographyReady() {
  return useContext(FontsReadyContext);
}

function getWeight(style: TextStyle | undefined) {
  const weight = style?.fontWeight;
  if (weight === 'bold') return 700;
  if (weight === 'normal' || weight == null) return 400;
  return Number(weight) || 400;
}

function fontFor(weight: number, variant: FontVariant) {
  if (variant === 'display') {
    if (weight >= 900) return 'Nunito_900Black';
    if (weight >= 800) return 'Nunito_800ExtraBold';
    return 'Nunito_700Bold';
  }

  if (weight >= 700) return 'Inter_700Bold';
  if (weight >= 600) return 'Inter_600SemiBold';
  if (weight >= 500) return 'Inter_500Medium';
  return 'Inter_400Regular';
}

function resolveStyle(style: TypographyTextProps['style'], ready: boolean, variant: FontVariant) {
  if (!ready) return style;

  const flattened = StyleSheet.flatten(style) ?? {};
  const { fontWeight, fontFamily, ...visualStyle } = flattened;
  const selectedFamily = fontFamily ?? fontFor(getWeight({ ...flattened, fontWeight }), variant);
  return [{ ...visualStyle, fontFamily: selectedFamily }];
}

export const Text = forwardRef<React.ElementRef<typeof NativeText>, TypographyTextProps>(function AppText(
  { style, variant, ...props },
  ref,
) {
  const ready = useTypographyReady();
  const flattened = StyleSheet.flatten(style) ?? {};
  const selectedVariant = variant ?? (getWeight(flattened) >= 800 ? 'display' : 'body');
  return <NativeText {...props} ref={ref} style={resolveStyle(style, ready, selectedVariant)} />;
});

type TypographyTextInputProps = TextInputProps & { variant?: never };

export const TextInput = forwardRef<React.ElementRef<typeof NativeTextInput>, TypographyTextInputProps>(function AppTextInput(
  { style, ...props },
  ref,
) {
  const ready = useTypographyReady();
  return <NativeTextInput {...props} ref={ref} style={resolveStyle(style, ready, 'body')} />;
});
