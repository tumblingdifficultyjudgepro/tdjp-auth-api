// src/features/calculator/components/FitOrWrapText.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  TextProps,
  LayoutChangeEvent,
  StyleSheet,
  NativeSyntheticEvent,
  TextLayoutEventData,
} from 'react-native';

type Props = TextProps & {
  text: string;
  fontSize: number;
  maxLines?: number;        // default 3
  lineHeightRatio?: number; // default 1.15
  maxWidth: number;         // available width in px
};

export default function FitOrWrapText({
  text,
  fontSize,
  maxLines = 3,
  lineHeightRatio = 1.15,
  maxWidth,
  style,
  ...rest
}: Props) {
  const [display, setDisplay] = useState(text);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const [wrapped, setWrapped] = useState(false);
  const triesRef = useRef(0);
  const MAX_TRIES = 12;

  useEffect(() => {
    setDisplay(text);
    setMeasuredWidth(null);
    setWrapped(false);
    triesRef.current = 0;
  }, [text, fontSize, maxLines, lineHeightRatio, maxWidth]);

  const onMeasureLayout = (e: LayoutChangeEvent) => {
    setMeasuredWidth(e.nativeEvent.layout.width);
  };

  const onTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (wrapped || triesRef.current >= MAX_TRIES) return;

    const lines = e.nativeEvent.lines ?? [];
    if (!lines.length) return;

    for (let i = 0; i < lines.length - 1; i++) {
      const prev = (lines[i]?.text ?? '').trimEnd();
      const next = (lines[i + 1]?.text ?? '').trimStart();

      const tail = (prev.match(/\S+$/)?.[0]) || '';
      const head = (next.match(/^\S+/)?.[0]) || '';

      if (tail && head && !/\s/.test(tail.slice(-1)) && !/\s/.test(head[0])) {
        const wholeWord = tail + head;

        const wordStart = display.indexOf(wholeWord);
        if (wordStart > 0) {
          const before = display.lastIndexOf(' ', wordStart - 1);
          if (before >= 0) {
            const nextText = display.slice(0, before) + '\n' + display.slice(before + 1);
            triesRef.current += 1;
            setDisplay(nextText);
            return;
          }
        }

        const headWithSpace = ' ' + head;
        const headPos = display.indexOf(headWithSpace);
        if (headPos > 0) {
          const nextText = display.slice(0, headPos) + '\n' + display.slice(headPos + 1);
          triesRef.current += 1;
          setDisplay(nextText);
          return;
        }
      }
    }

    setWrapped(true);
  };

  const lineHeight = Math.round(fontSize * lineHeightRatio);
  const maxH = lineHeight * maxLines;
  const fitsOneLine = measuredWidth != null && measuredWidth <= maxWidth + 0.5;

  return (
    <View style={{ maxWidth }}>
      <Text
        {...rest}
        numberOfLines={fitsOneLine ? 1 : maxLines}
        onTextLayout={!fitsOneLine ? onTextLayout : undefined}
        allowFontScaling={false}
        ellipsizeMode="clip"
        style={[{ fontSize, lineHeight, maxHeight: fitsOneLine ? lineHeight : maxH }, style as any]}
      >
        {display}
      </Text>

      {measuredWidth == null && (
        <Text
          numberOfLines={1}
          ellipsizeMode="clip"
          style={[styles.measure, { fontSize, lineHeight }]}
          onLayout={onMeasureLayout}
        >
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  measure: {
    position: 'absolute',
    opacity: 0,
    left: -10000,
    top: -10000,
  },
});
