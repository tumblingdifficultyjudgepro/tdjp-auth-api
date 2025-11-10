import React, { useEffect, useRef, useState } from 'react';
import { Text, TextProps, NativeSyntheticEvent, TextLayoutEventData } from 'react-native';

type Props = TextProps & {
  text: string;
  maxLines?: number;
  lineHeightRatio?: number;
  fontSize: number;
};

export default function WordWrapNoBreak({
  text,
  maxLines = 3,
  lineHeightRatio = 1.15,
  fontSize,
  style,
  ...rest
}: Props) {
  const [display, setDisplay] = useState(text);
  const attemptsRef = useRef(0);
  const MAX_ATTEMPTS = 8;

  useEffect(() => {
    setDisplay(text);
    attemptsRef.current = 0;
  }, [text, maxLines, lineHeightRatio, fontSize]);

  const onTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (attemptsRef.current >= MAX_ATTEMPTS) return;

    const lines = e.nativeEvent.lines ?? [];
    if (lines.length === 0) return;

    for (let i = 0; i < lines.length - 1; i++) {
      const a = lines[i]?.text ?? '';
      const b = lines[i + 1]?.text ?? '';
      const last = a.trimEnd().slice(-1);
      const first = b.trimStart().slice(0, 1);

      const breaksInMiddle = last && first && !/\s/.test(last) && !/\s/.test(first);
      if (breaksInMiddle) {
        const charsUpToLine = lines
          .slice(0, i + 1)
          .map(l => l.text.length)
          .reduce((s, n) => s + n, 0);

        let idx = Math.min(charsUpToLine, display.length - 1);
        while (idx > 0 && display[idx] !== ' ') idx--;

        if (idx > 0 && display[idx] === ' ') {
          const next = display.slice(0, idx) + '\n' + display.slice(idx + 1);
          attemptsRef.current += 1;
          setDisplay(next);
        }
        return;
      }
    }
  };

  const lineHeight = Math.round(fontSize * lineHeightRatio);
  const maxH = lineHeight * maxLines;

  return (
    <Text
      {...rest}
      numberOfLines={maxLines}
      onTextLayout={onTextLayout}
      allowFontScaling={false}
      style={[
        { fontSize: fontSize, lineHeight, maxHeight: maxH },
        style as any,
      ]}
    >
      {display}
    </Text>
  );
}
