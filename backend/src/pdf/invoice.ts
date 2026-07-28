import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

interface InvoiceOrganization {
  name?: string;
  address?: string;
  email?: string;
  logoUrl?: string;
}

interface InvoiceCustomer {
  name?: string;
  email?: string;
  address?: string;
}

interface InvoiceData {
  id: string;
  invoiceNo: string;
  amount: number;
  subTotal: number;
  taxTotal: number;
  discountTotal: number;
  status: string;
  issuedAt: string;
  dueAt: string;
  paidAt?: string | null;
  notes?: string;
  terms?: string;
  organization?: InvoiceOrganization;
  customerName?: string;
  customerEmail?: string;
  customer?: InvoiceCustomer;
  items?: InvoiceItem[];
  paymentUrl?: string;
}

const MARGIN = 50;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FONT_REGULAR = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';
const FONT_SERIF_BOLD = 'Times-Bold';

function drawHeader(doc: PDFKit.PDFDocument, invoice: InvoiceData): void {
  doc.font(FONT_SERIF_BOLD, 36)
    .fillColor('#111827')
    .text('INVOICE', MARGIN, MARGIN, { continued: false });

  doc.font(FONT_REGULAR, 12)
    .fillColor('#6B7280')
    .text(invoice.invoiceNo, MARGIN, MARGIN + 42);

  const orgName = invoice.organization?.name || 'DirectFN';
  const orgAddress = invoice.organization?.address || '';
  const orgEmail = invoice.organization?.email || '';

  doc.font(FONT_BOLD, 14).fillColor('#111827');
  const orgNameWidth = doc.widthOfString(orgName);
  doc.text(orgName, PAGE_WIDTH - MARGIN - orgNameWidth, MARGIN);

  doc.font(FONT_REGULAR, 10).fillColor('#6B7280');
  const addrLines = [orgAddress, orgEmail].filter(Boolean);
  const addrX = PAGE_WIDTH - MARGIN;
  let addrY = MARGIN + 18;
  for (const line of addrLines) {
    const lineWidth = doc.widthOfString(line);
    doc.text(line, addrX - lineWidth, addrY);
    addrY += 14;
  }
}

function drawDivider(doc: PDFKit.PDFDocument, y: number): number {
  doc.strokeColor('#D1D5DB')
    .lineWidth(1)
    .moveTo(MARGIN, y)
    .lineTo(PAGE_WIDTH - MARGIN, y)
    .stroke();
  return y + 1;
}

function drawBilledTo(doc: PDFKit.PDFDocument, invoice: InvoiceData, startY: number): number {
  let y = startY;

  doc.font(FONT_REGULAR, 8)
    .fillColor('#9CA3AF')
    .text('BILLED TO', MARGIN, y);

  y += 16;
  const customerName = invoice.customer?.name || invoice.customerName || 'N/A';
  doc.font(FONT_BOLD, 14)
    .fillColor('#111827')
    .text(customerName, MARGIN, y);

  y += 18;
  const customerEmail = invoice.customer?.email || invoice.customerEmail || '';
  if (customerEmail) {
    doc.font(FONT_REGULAR, 10)
      .fillColor('#4B5563')
      .text(customerEmail, MARGIN, y);
    y += 14;
  }

  const customerAddr = invoice.customer?.address || '';
  if (customerAddr) {
    doc.font(FONT_REGULAR, 10)
      .fillColor('#4B5563')
      .text(customerAddr, MARGIN, y);
    y += 14;
  }

  const rightColX = PAGE_WIDTH - MARGIN - 180;
  const colWidth = 90;

  doc.font(FONT_REGULAR, 8)
    .fillColor('#9CA3AF')
    .text('ISSUE DATE', rightColX, startY);
  doc.font(FONT_REGULAR, 11)
    .fillColor('#111827')
    .text(invoice.issuedAt, rightColX, startY + 16);

  doc.font(FONT_REGULAR, 8)
    .fillColor('#9CA3AF')
    .text('DUE DATE', rightColX + colWidth, startY);
  doc.font(FONT_REGULAR, 11)
    .fillColor('#111827')
    .text(invoice.dueAt, rightColX + colWidth, startY + 16);

  const statusY = startY + 34;
  const statusText = invoice.status.toUpperCase();
  const statusBadgePadding = 8;
  doc.font(FONT_BOLD, 10);
  const statusWidth = doc.widthOfString(statusText) + statusBadgePadding * 2;
  const statusHeight = 22;
  const statusX = rightColX + colWidth + 90 - statusWidth;

  doc.roundedRect(statusX, statusY - 4, statusWidth, statusHeight, 11)
    .fillColor('#1F2937')
    .fill();

  doc.fillColor('#FFFFFF')
    .text(statusText, statusX + statusBadgePadding, statusY + 2);

  return Math.max(y, statusY + statusHeight + 10);
}

function drawTable(doc: PDFKit.PDFDocument, items: InvoiceItem[], startY: number): number {
  const cols = [
    { key: 'description', label: 'Description', x: MARGIN, width: 200, align: 'left' as const },
    { key: 'quantity', label: 'Qty', x: MARGIN + 200, width: 60, align: 'right' as const },
    { key: 'unitPrice', label: 'Price', x: MARGIN + 260, width: 80, align: 'right' as const },
    { key: 'taxRate', label: 'Tax', x: MARGIN + 340, width: 60, align: 'right' as const },
    { key: 'total', label: 'Total', x: MARGIN + 400, width: PAGE_WIDTH - MARGIN - 400 - 50, align: 'right' as const },
  ];

  let y = startY;
  const rowHeight = 24;

  drawDivider(doc, y);
  y += 8;

  doc.font(FONT_BOLD, 10).fillColor('#111827');
  for (const col of cols) {
    doc.text(col.label, col.x, y, { width: col.width, align: col.align });
  }

  y += rowHeight;
  drawDivider(doc, y);
  y += 6;

  doc.font(FONT_REGULAR, 10).fillColor('#4B5563');
  for (const item of items) {
    const values: Record<string, string> = {
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: `$${item.unitPrice.toFixed(2)}`,
      taxRate: `${item.taxRate}%`,
      total: `$${item.total.toFixed(2)}`,
    };

    for (const col of cols) {
      doc.text(values[col.key] || '', col.x, y, { width: col.width, align: col.align });
    }

    y += rowHeight;

    if (items.indexOf(item) < items.length - 1) {
      doc.strokeColor('#E5E7EB')
        .lineWidth(0.5)
        .moveTo(MARGIN, y - 6)
        .lineTo(PAGE_WIDTH - MARGIN, y - 6)
        .stroke();
    }
  }

  drawDivider(doc, y + 4);
  return y + 10;
}

function drawTotals(doc: PDFKit.PDFDocument, invoice: InvoiceData, startY: number): number {
  let y = startY;
  const x = PAGE_WIDTH - MARGIN - 200;
  const labelWidth = 100;
  const valueWidth = 100;

  const lines: { label: string; value: string; bold?: boolean; borderTop?: boolean }[] = [
    { label: 'Subtotal', value: `$${(invoice.subTotal || invoice.amount).toFixed(2)}` },
    { label: 'Tax', value: `$${(invoice.taxTotal || 0).toFixed(2)}` },
  ];

  if (invoice.discountTotal > 0) {
    lines.push({ label: 'Discount', value: `-$${invoice.discountTotal.toFixed(2)}` });
  }

  lines.push({ label: 'Total Due', value: `$${invoice.amount.toFixed(2)}`, bold: true, borderTop: true });

  doc.font(FONT_REGULAR, 11);
  for (const line of lines) {
    if (line.borderTop) {
      doc.strokeColor('#111827')
        .lineWidth(2)
        .moveTo(x, y - 2)
        .lineTo(PAGE_WIDTH - MARGIN, y - 2)
        .stroke();
      y += 6;
    }

    const labelFont = line.bold ? FONT_BOLD : FONT_REGULAR;
    const valueFont = line.bold ? FONT_BOLD : FONT_REGULAR;
    const fontSize = line.bold ? 14 : 11;

    doc.font(labelFont, fontSize)
      .fillColor('#111827')
      .text(line.label, x, y, { width: labelWidth, align: 'left' });

    doc.font(valueFont, fontSize)
      .fillColor('#111827')
      .text(line.value, x + labelWidth, y, { width: valueWidth, align: 'right' });

    y += line.bold ? 24 : 18;
  }

  return y;
}

function drawQRCode(doc: PDFKit.PDFDocument, qrBuffer: Buffer, startY: number): void {
  const qrSize = 100;
  const qrX = MARGIN;
  const qrY = startY;

  doc.font(FONT_REGULAR, 8)
    .fillColor('#9CA3AF')
    .text('SCAN TO PAY', qrX, qrY);

  doc.image(qrBuffer, qrX, qrY + 12, { width: qrSize });
}

function drawNotes(doc: PDFKit.PDFDocument, invoice: InvoiceData, startY: number): number {
  let y = startY;

  if (invoice.notes) {
    doc.font(FONT_REGULAR, 8)
      .fillColor('#9CA3AF')
      .text('NOTES', MARGIN, y);
    y += 14;
    doc.font(FONT_REGULAR, 10)
      .fillColor('#4B5563')
      .text(invoice.notes, MARGIN, y, { width: CONTENT_WIDTH * 0.45 });
    y += 20;
  }

  if (invoice.terms) {
    doc.font(FONT_REGULAR, 8)
      .fillColor('#9CA3AF')
      .text('TERMS', MARGIN, y);
    y += 14;
    doc.font(FONT_REGULAR, 10)
      .fillColor('#4B5563')
      .text(invoice.terms, MARGIN, y, { width: CONTENT_WIDTH * 0.45 });
  }

  return y;
}

export async function generateInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
  const paymentUrl = invoice.paymentUrl || `https://finflow.app/pay/${invoice.id}`;
  let qrBuffer: Buffer | null = null;
  try {
    qrBuffer = await QRCode.toBuffer(paymentUrl, { width: 150 });
  } catch {
    // QR generation is non-critical
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      info: {
        Title: `Invoice ${invoice.invoiceNo}`,
        Author: 'FinFlow',
        Creator: 'FinFlow PDF Generator',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawHeader(doc, invoice);
    drawDivider(doc, MARGIN + 70);
    const afterBilledTo = drawBilledTo(doc, invoice, MARGIN + 85);

    const items = invoice.items && invoice.items.length > 0 ? invoice.items : [];
    const afterTable = drawTable(doc, items, afterBilledTo + 10);

    const afterTotals = drawTotals(doc, invoice, afterTable + 10);

    const afterNotes = drawNotes(doc, invoice, afterTotals + 10);

    if (qrBuffer) {
      if (afterNotes + 40 < PAGE_HEIGHT - MARGIN) {
        drawQRCode(doc, qrBuffer, afterNotes + 20);
      } else {
        doc.addPage();
        drawQRCode(doc, qrBuffer, MARGIN);
      }
    }

    doc.end();
  });
}