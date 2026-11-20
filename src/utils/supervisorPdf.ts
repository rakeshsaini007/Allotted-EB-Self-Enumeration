import { jsPDF } from 'jspdf';
import {
  SupervisorEnumeratorSummary,
  SupervisorRecord,
} from '../types/census';

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const SCALE = 2.5;
const MARGIN = 36;
const CONTENT_WIDTH = A4_WIDTH_PT - MARGIN * 2;

const COL_WIDTHS = [
  CONTENT_WIDTH * 0.27, // Name of Enumerator
  CONTENT_WIDTH * 0.22, // Enumerator SE ID
  CONTENT_WIDTH * 0.23, // Daily count
  CONTENT_WIDTH * 0.28, // Generated SE IDs
];

const HEADERS = [
  'पर्यवेक्षण क्षेत्र में शामिल प्रगणकों के नाम',
  'प्रगणक की SE ID No.',
  'प्रगणक द्वारा दैनिक रूप से कितने व्यक्तियों की SE IDs जैनरेट करायी गई',
  'जनरेट करायी गई SE IDs नम्बर',
];

function formatCurrentDate(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      if (ctx.measureText(word).width > maxWidth) {
        let chunk = '';
        for (const ch of word) {
          if (ctx.measureText(chunk + ch).width <= maxWidth) {
            chunk += ch;
          } else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function createPageCanvas(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(A4_WIDTH_PT * SCALE);
  canvas.height = Math.round(A4_HEIGHT_PT * SCALE);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to initialize canvas context for PDF export.');
  }
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, A4_WIDTH_PT, A4_HEIGHT_PT);
  ctx.textBaseline = 'top';
  return { canvas, ctx };
}

function drawTableHeader(
  ctx: CanvasRenderingContext2D,
  startY: number
): number {
  const fontFamily = '"Plus Jakarta Sans", "Noto Sans Devanagari", sans-serif';
  ctx.font = `600 9px ${fontFamily}`;

  const paddingX = 8;
  const paddingY = 8;
  const lineHeight = 13;

  const wrappedColumns = HEADERS.map((h, i) =>
    wrapText(ctx, h, COL_WIDTHS[i] - paddingX * 2)
  );
  const maxLines = Math.max(...wrappedColumns.map((l) => l.length));
  const headerHeight = Math.max(36, maxLines * lineHeight + paddingY * 2);

  // Background fill
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(MARGIN, startY, CONTENT_WIDTH, headerHeight);

  // Borders
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(MARGIN, startY, CONTENT_WIDTH, headerHeight);

  let x = MARGIN;
  for (let i = 0; i < COL_WIDTHS.length; i++) {
    if (i > 0) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + headerHeight);
      ctx.stroke();
    }

    ctx.fillStyle = '#0F172A';
    const lines = wrappedColumns[i];
    lines.forEach((line, lineIdx) => {
      ctx.fillText(line, x + paddingX, startY + paddingY + lineIdx * lineHeight);
    });

    x += COL_WIDTHS[i];
  }

  return startY + headerHeight;
}

function formatDisplayDate(isoOrRaw: string): string {
  if (!isoOrRaw) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoOrRaw.trim());
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return isoOrRaw.trim();
}

export async function generateSupervisorPdf(params: {
  supervisor: SupervisorRecord;
  enumerators: SupervisorEnumeratorSummary[];
  seIdOfSupervisor?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<string> {
  const { supervisor, enumerators, seIdOfSupervisor, fromDate, toDate } =
    params;

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const currentDate = formatCurrentDate();
  const fontSans = '"Plus Jakarta Sans", "Noto Sans Devanagari", sans-serif';
  const fontMono = '"JetBrains Mono", monospace';

  const pages: Array<{
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
  }> = [];

  let currentPage = createPageCanvas();
  pages.push(currentPage);

  // Draw Document Header on Page 1
  const drawDocumentBanner = (ctx: CanvasRenderingContext2D): number => {
    let y = MARGIN;

    // Title: Name of Supervisor & Mobile Number of Supervisor
    ctx.fillStyle = '#0F172A';
    ctx.font = `700 14px ${fontSans}`;
    const titleText = `${supervisor.nameOfSupervisor || 'SUPERVISOR'}  |  Mobile: ${
      supervisor.mobileNumberOfSupervisor || '—'
    }`;
    const titleLines = wrapText(ctx, titleText, CONTENT_WIDTH - 130);
    titleLines.forEach((line, idx) => {
      ctx.fillText(line, MARGIN, y + idx * 18);
    });

    // Current Date on top right
    ctx.font = `600 10px ${fontSans}`;
    ctx.fillStyle = '#334155';
    const dateLabel = `Date: ${currentDate}`;
    const dateWidth = ctx.measureText(dateLabel).width;
    ctx.fillText(dateLabel, A4_WIDTH_PT - MARGIN - dateWidth, y + 2);

    y += titleLines.length * 18 + 4;

    // Subtitle: Enumerators Under Supervisory Circle {circleNo}
    ctx.fillStyle = '#0F766E';
    ctx.font = `600 11.5px ${fontSans}`;
    ctx.fillText(
      `Enumerators Under Supervisory Circle ${supervisor.supervisoryCircleNo || '—'}`,
      MARGIN,
      y
    );
    y += 17;

    // Secondary metadata line
    ctx.fillStyle = '#475569';
    ctx.font = `500 9px ${fontSans}`;
    const rangeLabel =
      fromDate && toDate
        ? `Period: ${formatDisplayDate(fromDate)} to ${formatDisplayDate(toDate)}`
        : fromDate
        ? `Period: From ${formatDisplayDate(fromDate)}`
        : toDate
        ? `Period: Up to ${formatDisplayDate(toDate)}`
        : 'Period: All Dates';

    const metaParts = [
      supervisor.supervisorDesignation
        ? `Designation: ${supervisor.supervisorDesignation}`
        : null,
      supervisor.officeName ? `Office: ${supervisor.officeName}` : null,
      seIdOfSupervisor ? `Supervisor SE ID: ${seIdOfSupervisor}` : null,
      rangeLabel,
    ].filter(Boolean);

    if (metaParts.length > 0) {
      const metaLines = wrapText(ctx, metaParts.join('  ·  '), CONTENT_WIDTH);
      metaLines.forEach((line, idx) => {
        ctx.fillText(line, MARGIN, y + idx * 13);
      });
      y += metaLines.length * 13 + 6;
    } else {
      y += 6;
    }

    // Divider line
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(MARGIN, y);
    ctx.lineTo(A4_WIDTH_PT - MARGIN, y);
    ctx.stroke();

    return y + 12;
  };

  let cursorY = drawDocumentBanner(currentPage.ctx);
  cursorY = drawTableHeader(currentPage.ctx, cursorY);

  const bottomLimit = A4_HEIGHT_PT - MARGIN - 24;
  const paddingX = 8;
  const paddingY = 8;
  const subRowHeight = 19;

  if (enumerators.length === 0) {
    const emptyHeight = 36;
    currentPage.ctx.strokeStyle = '#64748B';
    currentPage.ctx.lineWidth = 0.7;
    currentPage.ctx.strokeRect(MARGIN, cursorY, CONTENT_WIDTH, emptyHeight);
    currentPage.ctx.fillStyle = '#64748B';
    currentPage.ctx.font = `500 9.5px ${fontSans}`;
    currentPage.ctx.fillText(
      'No enumerators found for this Supervisory Circle.',
      MARGIN + paddingX,
      cursorY + 12
    );
  } else {
    for (const item of enumerators) {
      const ctx = currentPage.ctx;
      ctx.font = `600 9.5px ${fontSans}`;
      const nameLines = wrapText(
        ctx,
        item.nameOfEnumerator || '—',
        COL_WIDTHS[0] - paddingX * 2
      );
      const ebText = `EB NO: ${item.ebNo || '—'}`;
      const col1Height = nameLines.length * 13 + 14 + paddingY * 2;
      const seIdsCount = Math.max(1, item.generatedSeIds.length);
      const col4Height = seIdsCount * subRowHeight;
      const rowHeight = Math.max(38, col1Height, col4Height);

      if (cursorY + rowHeight > bottomLimit) {
        currentPage = createPageCanvas();
        pages.push(currentPage);
        cursorY = drawTableHeader(currentPage.ctx, MARGIN);
      }

      const activeCtx = currentPage.ctx;
      activeCtx.strokeStyle = '#475569';
      activeCtx.lineWidth = 0.7;
      activeCtx.strokeRect(MARGIN, cursorY, CONTENT_WIDTH, rowHeight);

      // Vertical cell dividers
      let x = MARGIN;
      for (let i = 0; i < COL_WIDTHS.length; i++) {
        if (i > 0) {
          activeCtx.beginPath();
          activeCtx.moveTo(x, cursorY);
          activeCtx.lineTo(x, cursorY + rowHeight);
          activeCtx.stroke();
        }
        x += COL_WIDTHS[i];
      }

      // Col 1: Enumerator Name + EB NO
      const c1X = MARGIN + paddingX;
      activeCtx.fillStyle = '#0F172A';
      activeCtx.font = `600 9.5px ${fontSans}`;
      nameLines.forEach((line, idx) => {
        activeCtx.fillText(line, c1X, cursorY + paddingY + idx * 13);
      });
      activeCtx.fillStyle = '#475569';
      activeCtx.font = `500 8px ${fontMono}`;
      activeCtx.fillText(
        ebText,
        c1X,
        cursorY + paddingY + nameLines.length * 13 + 2
      );

      // Col 2: Enumerator SE ID No.
      const c2X = MARGIN + COL_WIDTHS[0] + paddingX;
      activeCtx.fillStyle = '#0F172A';
      activeCtx.font = `500 9px ${fontMono}`;
      activeCtx.fillText(
        item.enumeratorSeId || '—',
        c2X,
        cursorY + paddingY + 1
      );

      // Col 3: Count
      const c3X = MARGIN + COL_WIDTHS[0] + COL_WIDTHS[1] + paddingX;
      activeCtx.fillStyle = '#0F172A';
      activeCtx.font = `700 10.5px ${fontMono}`;
      activeCtx.fillText(
        String(item.generatedCount),
        c3X,
        cursorY + paddingY + 1
      );

      // Col 4: Stacked SE IDs
      const c4StartX = MARGIN + COL_WIDTHS[0] + COL_WIDTHS[1] + COL_WIDTHS[2];
      const c4Width = COL_WIDTHS[3];
      const entries =
        item.generatedSeIdEntries && item.generatedSeIdEntries.length > 0
          ? item.generatedSeIdEntries
          : item.generatedSeIds.map((seId) => ({ seId, seDate: '' }));

      if (entries.length === 0) {
        activeCtx.fillStyle = '#94A3B8';
        activeCtx.font = `400 9px ${fontMono}`;
        activeCtx.fillText('—', c4StartX + paddingX, cursorY + paddingY + 1);
      } else {
        const eachHeight = rowHeight / entries.length;
        entries.forEach((entry, sIdx) => {
          const subY = cursorY + sIdx * eachHeight;
          if (sIdx > 0) {
            activeCtx.strokeStyle = '#CBD5E1';
            activeCtx.lineWidth = 0.6;
            activeCtx.beginPath();
            activeCtx.moveTo(c4StartX, subY);
            activeCtx.lineTo(c4StartX + c4Width, subY);
            activeCtx.stroke();
          }
          const textY = subY + Math.max(4, (eachHeight - 9) / 2);
          activeCtx.fillStyle = '#0F172A';
          activeCtx.font = `500 8.5px ${fontMono}`;
          activeCtx.fillText(entry.seId, c4StartX + paddingX, textY);

          if (entry.seDate) {
            const dStr = formatDisplayDate(entry.seDate);
            activeCtx.fillStyle = '#64748B';
            activeCtx.font = `400 7.5px ${fontMono}`;
            const dW = activeCtx.measureText(dStr).width;
            activeCtx.fillText(
              dStr,
              c4StartX + c4Width - paddingX - dW,
              textY + 0.5
            );
          }
        });
      }

      cursorY += rowHeight;
    }
  }

  // Draw page footers with current date and page numbers
  const totalPages = pages.length;
  pages.forEach((p, idx) => {
    const ctx = p.ctx;
    ctx.fillStyle = '#64748B';
    ctx.font = `400 8px ${fontSans}`;
    ctx.fillText(
      `Supervisory Circle ${supervisor.supervisoryCircleNo} · Generated on ${currentDate}`,
      MARGIN,
      A4_HEIGHT_PT - MARGIN + 6
    );
    const pageStr = `Page ${idx + 1} of ${totalPages}`;
    const pageStrW = ctx.measureText(pageStr).width;
    ctx.fillText(
      pageStr,
      A4_WIDTH_PT - MARGIN - pageStrW,
      A4_HEIGHT_PT - MARGIN + 6
    );
  });

  // Compile canvases into jsPDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  pages.forEach((p, idx) => {
    if (idx > 0) {
      doc.addPage('a4', 'portrait');
    }
    const imgData = p.canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 0, 0, A4_WIDTH_PT, A4_HEIGHT_PT);
  });

  const safeCircle = (supervisor.supervisoryCircleNo || 'REPORT').replace(
    /[^A-Z0-9_-]/gi,
    '_'
  );
  const filename = `Enumerators_Supervisory_Circle_${safeCircle}_${currentDate}.pdf`;
  doc.save(filename);
  return filename;
}
