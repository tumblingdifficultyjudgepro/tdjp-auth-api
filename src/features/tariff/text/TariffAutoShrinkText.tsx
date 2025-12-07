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
<<<<<<< HEAD
  const [font, setFont] = useState(minFont > 0 ? minFont : 10);
=======
  const [font, setFont] = useState(maxFont);
  
>>>>>>> 778d6946b9e5d7a2d69bf58398a50d5de31618dd
  const lowRef = useRef(minFont);
  const highRef = useRef(maxFont);
  const doneRef = useRef(false);
  const safetyRef = useRef(0);

  useEffect(() => {
    lowRef.current = minFont;
    highRef.current = maxFont;
    doneRef.current = false;
    safetyRef.current = 0;
    // Start small to prevent explosive overflow on first render
    setFont(minFont > 0 ? minFont : 10);
  }, [text, maxFont, minFont, maxLines, lineHeightRatio, maxWidth]);

  const onTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (doneRef.current) return;

    // מנגנון בטיחות למניעת לולאות אינסופיות
    if (safetyRef.current++ > 50) {
      doneRef.current = true;
      setFont(lowRef.current);
      return;
    }

    const lines = e.nativeEvent.lines ?? [];
    
    // בדיקה 1: האם חרגנו מכמות השורות?
    const fitsLines = lines.length <= (maxLines ?? 1);

    // בדיקה 2: האם מילה נחתכה באמצע? (Word Split)
    // זה קורה כשהטקסט נדחס בכוח לרוחב הנתון
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

    // לוגיקת החיפוש הבינארי
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
<<<<<<< HEAD
    if (next !== font) {
      setFont(next);
    } else {
=======
    if (next !== font) setFont(next);
    else {
>>>>>>> 778d6946b9e5d7a2d69bf58398a50d5de31618dd
      doneRef.current = true;
    }
  };

  const line = Math.round(font * lineHeightRatio);
  const maxH = line * (maxLines ?? 1);

  // חישוב רוחב ל-Style:
  // אם קיבלנו maxWidth מבחוץ - נשתמש בו (פחות ריפוד).
  // אם לא - נשתמש ב-100% כדי למלא את ההורה.
  // זה התיקון הקריטי שימנע מהטקסט "לברוח" הצידה.
  const finalWidth = maxWidth ? maxWidth - (horizontalPadding * 2) : '100%';

  return (
    <Text
      {...rest}
      key={`ast_${text}_${maxWidth ?? 'u'}`}
      allowFontScaling={false}
      numberOfLines={maxLines}
      onTextLayout={onTextLayout}
      style={[
        { 
          fontSize: font, 
          lineHeight: line, 
          maxHeight: maxH,
          width: finalWidth, // הוספנו את זה חזרה! זה מכריח שבירת שורות.
        }, 
        style as any
      ]}
    >
      {text}
    </Text>
  );
}