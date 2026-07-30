import puppeteer, { Browser, PDFOptions } from 'puppeteer';
import fs from 'fs';

let browserInstance: Browser | null = null;
let browserUseCount = 0;
const MAX_USES_PER_BROWSER = 50;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserUseCount < MAX_USES_PER_BROWSER) {
    try {
      await browserInstance.version();
      return browserInstance;
    } catch {
      browserInstance = null;
    }
  }

  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }

  let executablePath = process.env.CHROME_BIN;
  if (!executablePath && fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
    executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else if (!executablePath && fs.existsSync('/usr/bin/google-chrome')) {
    executablePath = '/usr/bin/google-chrome';
  }

  browserInstance = await puppeteer.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  browserUseCount = 0;
  return browserInstance;
}

function getBaseUrl(): string {
  return process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:3000';
}

function getAuthToken(): string | undefined {
  return process.env.PDF_AUTH_TOKEN;
}

const REPORT_TYPES = [
  'profit-loss',
  'sales',
  'expenses',
  'balance-sheet',
  'cash-flow',
  'income',
  'purchases',
  'customer-statement',
  'supplier-statement',
  'inventory',
  'tax',
] as const;

export type ReportType = typeof REPORT_TYPES[number];

export interface ReportParams {
  startDate?: string;
  endDate?: string;
  token?: string;
}

export async function generateReportPDF(
  reportType: ReportType,
  params: ReportParams = {}
): Promise<Buffer> {
  if (!REPORT_TYPES.includes(reportType)) {
    throw new Error(`Unknown report type: ${reportType}. Valid types: ${REPORT_TYPES.join(', ')}`);
  }

  const baseUrl = getBaseUrl();
  const queryParams = new URLSearchParams();

  if (params.startDate) queryParams.set('startDate', params.startDate);
  if (params.endDate) queryParams.set('endDate', params.endDate);

  const token = params.token || getAuthToken();
  if (token) queryParams.set('token', token);

  const queryString = queryParams.toString();
  const url = `${baseUrl}/print/reports/${reportType}${queryString ? `?${queryString}` : ''}`;

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1200, height: 900 });

    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await page.waitForSelector('[data-report-loaded="true"]', {
      timeout: 15000,
    });

    await page.waitForFunction(() => {
      const charts = document.querySelectorAll('.recharts-surface');
      if (charts.length === 0) return true;
      return Array.from(charts).every((c) => {
        const paths = c.querySelectorAll('path');
        return paths.length > 0;
      });
    }, { timeout: 10000 });

    await new Promise((r) => setTimeout(r, 500));

    const pdfOptions: PDFOptions = {
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `
        <div style="width:100%;font-size:9px;color:#6B7280;text-align:center;padding:5px 15mm;">
          <span>${reportType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} — FinFlow</span>
          <span style="float:right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
    };

    const pdfBuffer = await page.pdf(pdfOptions);

    browserUseCount++;
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close().catch(() => {});
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
    browserUseCount = 0;
  }
}