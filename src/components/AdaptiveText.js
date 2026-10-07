import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * AdaptiveText Component (Section 17A: Automatic Font Resizing & Layout Alignment)
 * 
 * Automatically adapts typography and line height based on the active language.
 * Prevents vertical diacritic clipping (Kannada/Hindi matras) and prevents
 * horizontal text overflows by safely adjusting font size and line height.
 */
const AdaptiveText = ({
  children,
  style,
  compact = false,
  minSize,
  scaleDown = 1,
  allowWrap = true,
  numberOfLines,
  ...restProps
}) => {
  const { isIndic, getAdaptiveFontSize, getAdaptiveLineHeight } = useTheme();

  const flattenedStyle = StyleSheet.flatten(style) || {};
  const baseFontSize = flattenedStyle.fontSize || 14;

  const adaptedFontSize = isIndic
    ? getAdaptiveFontSize(baseFontSize, { compact, minSize, scaleDown })
    : baseFontSize;

  const adaptedLineHeight = isIndic
    ? getAdaptiveLineHeight(adaptedFontSize, flattenedStyle.lineHeight)
    : flattenedStyle.lineHeight;

  return (
    <Text
      {...restProps}
      numberOfLines={numberOfLines}
      allowFontScaling={true}
      style={[
        flattenedStyle,
        isIndic && {
          fontSize: adaptedFontSize,
          ...(adaptedLineHeight ? { lineHeight: adaptedLineHeight } : {}),
        },
      ]}
    >
      {children}
    </Text>
  );
};

export default AdaptiveText;
