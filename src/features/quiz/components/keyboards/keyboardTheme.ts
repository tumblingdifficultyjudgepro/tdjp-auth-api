export const KB = {

  SCALE: 1,

  BASE: {
    KEY_HEIGHT: 40,
    KEY_FONT: 17,
    GAP: 6,
    ROW_GAP: 6,
    PADDING_H: 8,
    PADDING_X: 6,
    BORDER_RADIUS: 10,
    WIDE_HEIGHT: 40,
  },
};

// עוזר קטן לסקיילינג
export const k = (v: number) => Math.round(v * KB.SCALE);