export const PAGE_W = 2480;
export const PAGE_H = 3508;
export const TABLE_SCALE = 1;
export const TABLE_WIDTH_SCALE = 1.45;

export type TariffLang = 'he' | 'en';

export const TITLE_X_OFFSET = {
  he: { p1: -0, p2: -0 },
  en: { p1: 350, p2: 350 },
};

export const NAME_X_OFFSET = {
  he: 500,
  en: -500,
};

const BASE_TITLE_SHIFT = -180;

const S = 5;
const MARGIN = 24 * S;
const FS_HDR = 11 * S;
const FS_BODY = 11 * S;
const ROW_H = 30 * S;
const NUM_ROWS = 8;

const COLORS = {
  black: '#000',
  headerBg: '#e5e7eb',
  page: '#fff',
  text: '#111827',
};

const FONT_STACK_HE = `Roboto, "Noto Sans Hebrew", "Noto Sans", Arial, sans-serif`;
const FONT_STACK_EN = `Roboto, Arial, "Noto Sans", sans-serif`;

const COLS_EN = { NUM: 6.5, SKILL: 18.5, DIFF: 13.0, BONUS: 10.0, NOTES: 52.0 };
const COLS_HE = { NOTES: 52.0, BONUS: 10.0, DIFF: 13.0, ELEM: 18.5, NUM: 6.5 };

export const SPACING = {
  titleToRow1: 40,
  row1ToRow2: 30,
  row2ToPass1Title: 20 * S,
  pass1TitleToTable: 80,
  pass1TableToTotal: 10,
  pass1TotalToPass2Title: 40 * S,
  pass2TitleToTable: 80,
  pass2TableToTotal: 10,
};

export const NOTES_WIDTH_PX: { he: number | null; en: number | null } = {
  he: null,
  en: null,
};

NOTES_WIDTH_PX.he = 900;
NOTES_WIDTH_PX.en = 900;

export const ROW_PAD_EXTRA = 20;

function getPixelColumns(
  isHE: boolean,
  innerW: number
): {
  widthsPx: { NUM: number; ELEM: number; DIFF: number; BONUS: number; NOTES: number };
  sumPx: number;
  order: string[];
} {
  const base = isHE
    ? { NUM: 6.5, ELEM: 18.5, DIFF: 13.0, BONUS: 10.0, NOTES: 52.0 }
    : { NUM: 6.5, SKILL: 18.5, DIFF: 13.0, BONUS: 10.0, NOTES: 52.0 };

  const pctToPx = (pct: number) => Math.max(0, Math.round((pct / 100) * innerW));

  const elemPct = ((base as any).ELEM ?? (base as any).SKILL) ?? 0;

  const widthsPxBase = {
    NUM: pctToPx(base.NUM),
    ELEM: pctToPx(elemPct),
    DIFF: pctToPx(base.DIFF),
    BONUS: pctToPx(base.BONUS),
    NOTES: 0,
  };

  const notesPx = isHE ? NOTES_WIDTH_PX.he : NOTES_WIDTH_PX.en;
  widthsPxBase.NOTES = Math.max(0, Math.round(notesPx ?? 0));

  const scale = TABLE_WIDTH_SCALE;

  const widthsPx = {
    NUM: Math.round(widthsPxBase.NUM * scale),
    ELEM: Math.round(widthsPxBase.ELEM * scale),
    DIFF: Math.round(widthsPxBase.DIFF * scale),
    BONUS: Math.round(widthsPxBase.BONUS * scale),
    NOTES: Math.round(widthsPxBase.NOTES * scale),
  };

  const sumPx = widthsPx.NUM + widthsPx.ELEM + widthsPx.DIFF + widthsPx.BONUS + widthsPx.NOTES;

  const order = isHE
    ? ['NUM', 'ELEM', 'DIFF', 'BONUS', 'NOTES']
    : ['NUM', 'SKILL', 'DIFF', 'BONUS', 'NOTES'];

  return { widthsPx, sumPx, order };
}

export function renderTariffBackground(
  lang: TariffLang = 'he',
  W: number = PAGE_W,
  H: number = PAGE_H
): string {
  const isHE = lang === 'he';
  const fontStack = isHE ? FONT_STACK_HE : FONT_STACK_EN;

  const title = isHE ? 'דף טריף - טאמבלינג' : 'Tariff Sheet - Tumbling';
  const routine1 = isHE ? 'פס 1' : 'Routine 1';
  const routine2 = isHE ? 'פס 2' : 'Routine 2';
  const totalLine = isHE
    ? 'סה"כ דרגת קושי + בונוסים:____________'
    : 'Total Difficulty + Bonuses:____________';

  const HEADS_EN = ['X', 'Skill (Symbol)', 'Difficulty', 'Bonus', 'Notes for the judge'];
  const HEADS_HE = ['X', 'אלמנט (סימבול)', 'דרגת קושי', 'בונוס', 'הערות לשופט'];

  return `
  <div class="bg" style="position:absolute; inset:0; z-index:0; pointer-events:none;">
    <style>
      .bg, .bg * { box-sizing: border-box; }
      .bg .page-pad {
        position:absolute; left:${MARGIN}px; right:${MARGIN}px; top:${MARGIN}px; bottom:${MARGIN}px;
        display:block;
        font-family:${fontStack};
        color:${COLORS.text};

        .fields .cell.name { position: relative; left: var(--name-x, 0px); }
        .fields .row .cell {
          position: relative;
          transform: translate(var(--dx, 0px), var(--dy, 0px));
        }
        .fields .row .cell.right { text-align: right; }
        .fields .row .cell.left  { text-align: left; }
      }

      .bg .title {
        font-weight:700; font-size:${FS_BODY * 1.45}px; line-height:1.2;
        text-align:center; margin:0 0 ${8 * S}px 0;
      }

      .bg .fields { display:flex; flex-direction:column; gap:${4 * S}px; }
      .bg .row { width:100%; display:grid; align-items:center; }
      .bg .row1 { grid-template-columns: 30% 18% 4% 18% 30%; }
      .bg .row2-en { grid-template-columns: 17% 1% 18% 1% 17% 1% 28% 1% 17%; }
      .bg .row2-he { grid-template-columns: 18% 1% 22% 1% 18% 1% 18% 1% 20%; }
      .bg .cell { font-size:${12 * S}px; line-height:1.2; margin:0; padding:0; white-space:nowrap; }
      .bg .cell.center { text-align:center; }
      .bg .cell.left   { text-align:left; }
      .bg .cell.right  { text-align:right; }

      .bg .rt-title.ltr { text-align:left;  font-weight:700; font-size:${12 * S}px; margin:${4 * S}px 0; }
      .bg .rt-title.rtl { text-align:right; font-weight:700; font-size:${12 * S}px; margin:${4 * S}px 0; }

      .bg .gap { width:100%; }

      .bg table.rt {
        border-collapse:collapse; width:100%; table-layout:fixed; margin:0;
      }
      .bg table.rt thead th {
        background:${COLORS.headerBg};
        border:${1 * S}px solid ${COLORS.black};
        min-height:${ROW_H}px; height:${ROW_H}px;
        font-size:${FS_HDR}px; line-height:1; font-weight:700;
        padding:${3 * S}px ${6 * S}px;
      }
      .bg table.rt tbody td {
        border:${1 * S}px solid ${COLORS.black};
        min-height:${ROW_H}px; height:${ROW_H}px;
        font-size:${FS_BODY}px; line-height:1;
        padding: calc(${3 * S}px + var(--row-pad-extra, 0px)) ${6 * S}px;
        overflow:hidden; text-overflow:ellipsis;
      }

      .bg table.rt.ltr tbody tr:last-child td:first-child {
        font-size: ${FS_BODY * 0.75}px;
        padding-left: ${2 * S}px;
        padding-right: ${2 * S}px;
        white-space: nowrap;
      }

      .bg .align-left   { text-align:left; }
      .bg .align-right  { text-align:right; }
      .bg .align-center { text-align:center; }

      .bg table.rt.ltr { direction:ltr; }
      .bg table.rt.rtl { direction:rtl; }

      .bg .rt-total.ltr { text-align:center; font-size:${12 * S}px; margin:${10 * S}px 0 0 0; }
      .bg .rt-total.rtl { text-align:center; font-size:${12 * S}px; margin:${10 * S}px 0 0 0; }

      .bg .rt-wrap { display:block; margin:0 auto; }

      .bg .rt-scale {
        transform: scale(var(--tbl-scale, 1));
        transform-origin: top center;
      }

      .bg .rt-title-shift {
        display: inline-block;
        transform: translateX(var(--title-shift-x, 0px));
      }
    </style>

    <div class="page-pad" dir="${isHE ? 'rtl' : 'ltr'}" style="--row-pad-extra:${ROW_PAD_EXTRA}px;">
      <div class="title">${escapeHtml(title)}</div>

      <div class="gap gap-title-to-row1" style="height:${SPACING.titleToRow1}px"></div>

      <div class="fields">
        <div class="row row1">
          <div class="cell"></div>
          <div class="cell name ${isHE ? 'right' : 'left'}"
               style="--name-x:${isHE ? NAME_X_OFFSET.he : NAME_X_OFFSET.en}px;">
            ${isHE ? 'שם המתעמל/ת:______________________' : 'Gymnast Name:______________________'}
          </div>
          <div class="cell"></div>
          <div class="cell ${isHE ? 'left' : 'right'}">
            ${isHE ? 'אגודה:_________________________' : 'Club:_________________________'}
          </div>
          <div class="cell"></div>
        </div>

        <div class="gap gap-row1-to-row2" style="height:${SPACING.row1ToRow2}px"></div>

        ${
          isHE
            ? `
        <div class="row row2-he">
          <div class="cell right" style="--dx:-50px; --dy:0px;">מגדר:_____</div><div></div>
          <div class="cell right" style="--dx:110px; --dy:0px;">מסלול:______________</div><div></div>
          <div class="cell right" style="--dx:140px; --dy:0px;">דרגה:________</div><div></div>
          <div class="cell right" style="--dx:220px; --dy:0px;">מספר המתעמל/ת:__________</div><div></div>
          <div class="cell right" style="--dx:8px; --dy:0px;">סבב:________</div>
        </div>
        `
            : `
        <div class="row row2-en">
          <div class="cell left"  style="--dx:0px;  --dy:0px;">Gender:______</div><div></div>
          <div class="cell left"  style="--dx:-12px; --dy:0px;">Track:_________________</div><div></div>
          <div class="cell left"  style="--dx:100px; --dy:0px;">Level:_________</div><div></div>
          <div class="cell left"  style="--dx:100px; --dy:0px;">Starting Number:______</div><div></div>
          <div class="cell left"  style="--dx:6px;  --dy:0px;">Rotation:_____</div>
        </div>
        `
        }
      </div>

      <div class="gap gap-row2-to-pass1-title" style="height:${SPACING.row2ToPass1Title}px"></div>

      ${
        (() => {
          const innerW = W - 2 * MARGIN;
          const notesPx = isHE ? NOTES_WIDTH_PX.he : NOTES_WIDTH_PX.en;
          if (Number.isFinite(notesPx)) {
            const { widthsPx, sumPx, order } = getPixelColumns(isHE, innerW);
            const dir = isHE ? 'rtl' : 'ltr';
            const tableClass = isHE ? 'rt rtl' : 'rt ltr';
            const heads = isHE ? HEADS_HE : HEADS_EN;

            let thead = '<tr>';
            order.forEach((key, idx) => {
              const label = heads[idx];
              const px = widthsPx[(key === 'SKILL' ? 'ELEM' : key) as keyof typeof widthsPx];
              thead += `<th style="width:${px}px">${escapeHtml(label)}</th>`;
            });
            thead += '</tr>';

            let tbody = '';
            for (let i = 1; i <= NUM_ROWS; i++) {
              tbody += '<tr>';
              tbody += `<td class="align-center">${i}</td>`;
              tbody += `<td class="align-center"></td>`;
              tbody += `<td class="align-center"></td>`;
              tbody += `<td class="align-center"></td>`;
              tbody += `<td class="align-center"></td>`;
              tbody += '</tr>';
            }
            tbody += '<tr>';
            if (isHE) {
              tbody += `<td class="align-center">סה"כ</td>`;
            } else {
              tbody += `<td class="align-center">Total</td>`;
            }
            tbody += `<td class="align-center"></td>`;
            tbody += `<td class="align-center"></td>`;
            tbody += `<td class="align-center"></td>`;
            tbody += `<td class="align-center"></td>`;
            tbody += '</tr>';

            const titleToTable = SPACING.pass1TitleToTable;
            const tableToTotal = SPACING.pass1TableToTotal;
            const offset = isHE ? TITLE_X_OFFSET.he.p1 : TITLE_X_OFFSET.en.p1;

            return `
            <div class="rt-scale" style="--tbl-scale:${TABLE_SCALE}">
              <div class="rt-block" dir="${dir}">
                <div class="rt-title-shift" style="--title-shift-x:${BASE_TITLE_SHIFT + offset}px">
                  <div class="rt-title ${isHE ? 'rtl' : 'ltr'}">${escapeHtml(routine1)}</div>
                </div>
                <div class="gap gap-title-to-table p1" style="height:${titleToTable}px"></div>

                <div class="rt-wrap" style="width:${sumPx}px;">
                  <table class="${tableClass}" role="presentation" style="width:${sumPx}px;">
                    <colgroup>
                      ${order
                        .map((key) => {
                          const px2 = widthsPx[(key === 'SKILL' ? 'ELEM' : key) as keyof typeof widthsPx];
                          return `<col style="width:${px2}px">`;
                        })
                        .join('')}
                    </colgroup>
                    <thead>${thead}</thead>
                    <tbody>${tbody}</tbody>
                  </table>
                </div>

                <div class="gap gap-table-to-total p1" style="height:${tableToTotal}px"></div>
                <div class="rt-total ${isHE ? 'rtl' : 'ltr'}">${escapeHtml(totalLine)}</div>
              </div>
            </div>
            `;
          } else {
            return (function buildRoutinePercent() {
              const heads = isHE ? HEADS_HE : HEADS_EN;
              const cols = isHE ? COLS_HE : COLS_EN;
              const dir = isHE ? 'rtl' : 'ltr';
              const tableClass = isHE ? 'rt rtl' : 'rt ltr';
              const order = isHE
                ? ['NUM', 'SKILL', 'DIFF', 'BONUS', 'NOTES']
                : ['NUM', 'SKILL', 'DIFF', 'BONUS', 'NOTES'];

              let thead = '<tr>';
              order.forEach((key) => {
                const colsAny = cols as any;
                thead += `<th style="width:${colsAny[key]}%">${escapeHtml(
                  heads[order.indexOf(key)]
                )}</th>`;
              });
              thead += '</tr>';

              let tbody = '';
              for (let i = 1; i <= NUM_ROWS; i++) {
                tbody += '<tr>';
                tbody += `<td class="align-center">${i}</td>`;
                tbody += `<td class="align-center"></td>`;
                tbody += `<td class="align-center"></td>`;
                tbody += `<td class="align-center"></td>`;
                tbody += `<td class="align-center"></td>`;
                tbody += '</tr>';
              }
              tbody += '<tr>';
              if (isHE) {
                tbody += `<td class="align-center">סה"כ</td>`;
              } else {
                tbody += `<td class="align-center">Total</td>`;
              }
              tbody += `<td class="align-center"></td>`;
              tbody += `<td class="align-center"></td>`;
              tbody += `<td class="align-center"></td>`;
              tbody += `<td class="align-center"></td>`;
              tbody += '</tr>';

              const titleToTable = SPACING.pass1TitleToTable;
              const tableToTotal = SPACING.pass1TableToTotal;
              const offset = isHE ? TITLE_X_OFFSET.he.p1 : TITLE_X_OFFSET.en.p1;

              return `
              <div class="rt-scale" style="--tbl-scale:${TABLE_SCALE}">
                <div class="rt-block" dir="${dir}">
                  <div class="rt-title-shift" style="--title-shift-x:${BASE_TITLE_SHIFT + offset}px">
                    <div class="rt-title ${isHE ? 'rtl' : 'ltr'}">${escapeHtml(routine1)}</div>
                  </div>
                  <div class="gap gap-title-to-table p1" style="height:${titleToTable}px"></div>

                  <div class="rt-wrap" style="width:fit-content;">
                    <table class="${tableClass}" role="presentation" style="width:auto;">
                      <colgroup>
                        ${order
                          .map((k) => `<col style="width:${(cols as any)[k]}%">`)
                          .join('')}
                      </colgroup>
                      <thead>${thead}</thead>
                      <tbody>${tbody}</tbody>
                    </table>
                  </div>

                  <div class="gap gap-table-to-total p1" style="height:${tableToTotal}px"></div>
                  <div class="rt-total ${isHE ? 'rtl' : 'ltr'}">${escapeHtml(totalLine)}</div>
                </div>
              </div>
            `;
            })();
          }
        })()
      }

      <div class="gap gap-pass1-total-to-pass2-title" style="height:${SPACING.pass1TotalToPass2Title}px"></div>

      ${
        (() => {
          const innerW = W - 2 * MARGIN;
          const notesPx = isHE ? NOTES_WIDTH_PX.he : NOTES_WIDTH_PX.en;
          if (Number.isFinite(notesPx)) {
            const { widthsPx, sumPx, order } = getPixelColumns(isHE, innerW);
            const dir = isHE ? 'rtl' : 'ltr';
            const tableClass = isHE ? 'rt rtl' : 'rt ltr';
            const heads = isHE ? HEADS_HE : HEADS_EN;

            let thead = '<tr>';
            order.forEach((key, idx) => {
              const label = heads[idx];
              const px = widthsPx[(key === 'SKILL' ? 'ELEM' : key) as keyof typeof widthsPx];
              thead += `<th style="width:${px}px">${escapeHtml(label)}</th>`;
            });
            thead += '</tr>';

            let tbody = '';
            for (let i = 1; i <= NUM_ROWS; i++) {
              tbody += '<tr>';
              tbody += `<td class="align-center">${i}</td>`;
              tbody += `<td class="align-center"></td>`;
              tbody += `<td class="align-center"></td>`;
              tbody += `<td class="align-center"></td>`;
              tbody += `<td class="align-center"></td>`;
              tbody += '</tr>';
            }
            tbody += '<tr>';
            if (isHE) {
              tbody += `<td class="align-center">סה"כ</td>`;
            } else {
              tbody += `<td class="align-center">Total</td>`;
            }
            tbody += `<td class="align-center"></td>`;
            tbody += `<td class="align-center"></td>`;
            tbody += `<td class="align-center"></td>`;
            tbody += `<td class="align-center"></td>`;
            tbody += '</tr>';

            const titleToTable = SPACING.pass2TitleToTable;
            const tableToTotal = SPACING.pass2TableToTotal;
            const offset = isHE ? TITLE_X_OFFSET.he.p2 : TITLE_X_OFFSET.en.p2;

            return `
            <div class="rt-scale" style="--tbl-scale:${TABLE_SCALE}">
              <div class="rt-block" dir="${dir}">
                <div class="rt-title-shift" style="--title-shift-x:${BASE_TITLE_SHIFT + offset}px">
                  <div class="rt-title ${isHE ? 'rtl' : 'ltr'}">${escapeHtml(routine2)}</div>
                </div>
                <div class="gap gap-title-to-table p2" style="height:${titleToTable}px"></div>

                <div class="rt-wrap" style="width:${sumPx}px;">
                  <table class="${tableClass}" role="presentation" style="width:${sumPx}px;">
                    <colgroup>
                      ${order
                        .map((key) => {
                          const px2 = widthsPx[(key === 'SKILL' ? 'ELEM' : key) as keyof typeof widthsPx];
                          return `<col style="width:${px2}px">`;
                        })
                        .join('')}
                    </colgroup>
                    <thead>${thead}</thead>
                    <tbody>${tbody}</tbody>
                  </table>
                </div>

                <div class="gap gap-table-to-total p2" style="height:${tableToTotal}px"></div>
                <div class="rt-total ${isHE ? 'rtl' : 'ltr'}">${escapeHtml(totalLine)}</div>
              </div>
            </div>
          `;
          } else {
            return (function buildRoutinePercent() {
              const heads = isHE ? HEADS_HE : HEADS_EN;
              const cols = isHE ? COLS_HE : COLS_EN;
              const dir = isHE ? 'rtl' : 'ltr';
              const tableClass = isHE ? 'rt rtl' : 'rt ltr';
              const order = isHE
                ? ['NUM', 'SKILL', 'DIFF', 'BONUS', 'NOTES']
                : ['NUM', 'SKILL', 'DIFF', 'BONUS', 'NOTES'];

              let thead = '<tr>';
              order.forEach((key) => {
                const colsAny = cols as any;
                thead += `<th style="width:${colsAny[key]}%">${escapeHtml(
                  heads[order.indexOf(key)]
                )}</th>`;
              });
              thead += '</tr>';

              let tbody = '';
              for (let i = 1; i <= NUM_ROWS; i++) {
                tbody += '<tr>';
                tbody += `<td class="align-center">${i}</td>`;
                tbody += `<td class="align-center"></td>`;
                tbody += `<td class="align-center"></td>`;
                tbody += `<td class="align-center"></td>`;
                tbody += `<td class="align-center"></td>`;
                tbody += '</tr>';
              }
              tbody += '<tr>';
              if (isHE) {
                tbody += `<td class="align-center">סה"כ</td>`;
              } else {
                tbody += `<td class="align-center">Total</td>`;
              }
              tbody += `<td class="align-center"></td>`;
              tbody += `<td class="align-center"></td>`;
              tbody += `<td class="align-center"></td>`;
              tbody += `<td class="align-center"></td>`;
              tbody += '</tr>';

              const titleToTable = SPACING.pass2TitleToTable;
              const tableToTotal = SPACING.pass2TableToTotal;
              const offset = isHE ? TITLE_X_OFFSET.he.p2 : TITLE_X_OFFSET.en.p2;

              return `
              <div class="rt-scale" style="--tbl-scale:${TABLE_SCALE}">
                <div class="rt-block" dir="${dir}">
                  <div class="rt-title-shift" style="--title-shift-x:${BASE_TITLE_SHIFT + offset}px">
                    <div class="rt-title ${isHE ? 'rtl' : 'ltr'}">${escapeHtml(routine2)}</div>
                  </div>
                  <div class="gap gap-title-to-table p2" style="height:${titleToTable}px"></div>

                  <div class="rt-wrap" style="width:fit-content;">
                    <table class="${tableClass}" role="presentation" style="width:auto;">
                      <colgroup>
                        ${order
                          .map((k) => `<col style="width:${(cols as any)[k]}%">`)
                          .join('')}
                      </colgroup>
                      <thead>${thead}</thead>
                      <tbody>${tbody}</tbody>
                    </table>
                  </div>

                  <div class="gap gap-table-to-total p2" style="height:${tableToTotal}px"></div>
                  <div class="rt-total ${isHE ? 'rtl' : 'ltr'}">${escapeHtml(totalLine)}</div>
                </div>
              </div>
            `;
            })();
          }
        })()
      }
    </div>
  </div>
  `;
}

function escapeHtml(str: string = ''): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
