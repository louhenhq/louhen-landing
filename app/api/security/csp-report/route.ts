import { NextResponse } from 'next/server';

type RawCspReport = {
  [key: string]: unknown;
  'csp-report'?: Record<string, unknown>;
};

type NormalizedCspReport = {
  documentUri?: string;
  violatedDirective?: string;
  effectiveDirective?: string;
  blockedUri?: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
  statusCode?: number;
  referrer?: string;
  userAgent?: string;
  reportedAt: string;
};

const REPORT_BUFFER: NormalizedCspReport[] = [];
const REPORT_BUFFER_LIMIT = 50;

function sanitizeUri(uri: unknown): string | undefined {
  if (typeof uri !== 'string' || !uri.trim()) {
    return undefined;
  }
  try {
    const parsed = new URL(uri);
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return uri.trim();
  }
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function normalizeReport(raw: unknown, userAgent: string | null): NormalizedCspReport | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const payload = (raw as RawCspReport)['csp-report'] ?? raw;
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const report = payload as Record<string, unknown>;
  return {
    documentUri: sanitizeUri(report['document-uri']),
    violatedDirective: typeof report['violated-directive'] === 'string' ? report['violated-directive'] : undefined,
    effectiveDirective: typeof report['effective-directive'] === 'string' ? report['effective-directive'] : undefined,
    blockedUri: sanitizeUri(report['blocked-uri']),
    sourceFile: sanitizeUri(report['source-file']),
    lineNumber: coerceNumber(report['line-number']),
    columnNumber: coerceNumber(report['column-number']),
    statusCode: coerceNumber(report['status-code']),
    referrer: sanitizeUri(report.referrer),
    userAgent: userAgent ?? undefined,
    reportedAt: new Date().toISOString(),
  };
}

export function getStoredCspReports(): readonly NormalizedCspReport[] {
  return REPORT_BUFFER;
}

export async function POST(request: Request) {
  let payload: unknown = null;

  const contentType = request.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json') || contentType.includes('application/csp-report');

  if (isJson) {
    try {
      payload = await request.json();
    } catch {
      payload = null;
    }
  } else {
    const text = await request.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }
  }

  const userAgent = request.headers.get('user-agent');
  const normalized = normalizeReport(payload, userAgent);

  if (normalized) {
    REPORT_BUFFER.unshift(normalized);
    if (REPORT_BUFFER.length > REPORT_BUFFER_LIMIT) {
      REPORT_BUFFER.length = REPORT_BUFFER_LIMIT;
    }
    console.info('[security:csp-report]', JSON.stringify(normalized));
  }

  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  if (process.env.NODE_ENV !== 'production' || process.env.TEST_MODE === '1') {
    return NextResponse.json({ reports: getStoredCspReports() }, { status: 200 });
  }
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
