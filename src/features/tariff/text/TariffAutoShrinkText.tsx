import React, { useEffect, useRef, useState } from 'react';
import { Text, TextProps, NativeSyntheticEvent, TextLayoutEventData } from 'react-native';

type Props = TextProps & {
  text: string;
  maxFont: number;
  minFont?: number;
  maxLines?: number;
  lineHeightRatio?: number;
  maxWidth?: number;
  horizontalPadding?: number;
};

export default function AutoShrinkTextTariff({
  text,
  maxFont,
  minFont = 10,
  maxLines = 3,
  lineHeightRatio = 1.1,
  maxWidth,
  horizontalPadding = 0,
  style,
  ...rest
}: Props) {
  const [font, setFont] = useState(maxFont);
  const lowRef = useRef(minFont);
  const highRef = useRef(maxFont);
  const doneRef = useRef(false);
  const safetyRef = useRef(0);

  useEffect(() => {
    lowRef.current = minFont;
    highRef.current = maxFont;
    doneRef.current = false;
    safetyRef.current = 0;
    setFont(maxFont);
  }, [text, maxFont, minFont, maxLines, lineHeightRatio, maxWidth]);

  const onTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (doneRef.current) return;

    if (safetyRef.current++ > 40) {
      doneRef.current = true;
      setFont(lowRef.current);
      return;
    }

    const lines = e.nativeEvent.lines ?? [];
    const fitsLines = lines.length <= (maxLines ?? 1);

    let wordSplit = false;
    for (let i = 0; i < lines.length - 1; i++) {
      const a = lines[i]?.text ?? '';
      const b = lines[i + 1]?.text ?? '';
      const last = a.trimEnd().slice(-1);
      const first = b.trimStart().slice(0, 1);
      if (last && first && !/\s/.test(last) && !/\s/.test(first)) {
        wordSplit = true;
        break;
      }
    }

    const fits = fitsLines && !wordSplit;

    if (!fits) {
      highRef.current = Math.max(lowRef.current, Math.min(highRef.current, font - 1));
    } else {
      lowRef.current = Math.min(highRef.current, Math.max(lowRef.current, font));
    }

    if (highRef.current - lowRef.current <= 1) {
      doneRef.current = true;
      setFont(lowRef.current);
      return;
    }

    const next = Math.floor((lowRef.current + highRef.current + 1) / 2);
    if (next !== font) setFont(next);
    else {
      doneRef.current = true;
    }
  };

  const line = Math.round(font * lineHeightRatio);
  const maxH = line * (maxLines ?? 1);

  return (
    <Text
      {...rest}
      allowFontScaling={false}
      numberOfLines={maxLines}
      onTextLayout={onTextLayout}
      style={[{ fontSize: font, lineHeight: line, maxHeight: maxH }, style as any]}
    >
      {text}
    </Text>
  );
}
