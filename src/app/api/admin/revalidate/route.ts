import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_PATHS_PER_REQUEST = 10;

function getSecret() {
  return process.env.ADMIN_REVALIDATE_SECRET || process.env.REVALIDATE_SECRET || '';
}

function normalizePath(value: unknown) {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed.includes('://') || trimmed.includes('..')) return null;

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const withoutQuery = withLeadingSlash.split('?')[0].split('#')[0];

  if (withoutQuery === '/') return '/';

  const clean = withoutQuery.replace(/\/+/g, '/').replace(/\/$/, '');
  const allowed =
    /^\/san-pham\/[^/]+$/.test(clean) ||
    /^\/tin-tuc\/[^/]+$/.test(clean) ||
    /^\/[a-z0-9-]+$/.test(clean);

  return allowed ? `${clean}/` : null;
}

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function POST(request: NextRequest) {
  const configuredSecret = getSecret();
  if (!configuredSecret) {
    return json(500, { ok: false, error: 'missing_revalidate_secret' });
  }

  let body: { secret?: string; path?: unknown; paths?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const requestSecret = request.headers.get('x-revalidate-secret') || body.secret || '';
  if (requestSecret !== configuredSecret) {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  const rawPaths = Array.isArray(body.paths) ? body.paths : [body.path];
  const paths = Array.from(
    new Set(rawPaths.map(normalizePath).filter((item): item is string => Boolean(item)))
  ).slice(0, MAX_PATHS_PER_REQUEST);

  if (paths.length === 0) {
    return json(400, { ok: false, error: 'no_valid_paths' });
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return json(200, {
    ok: true,
    revalidated: paths,
    timestamp: new Date().toISOString(),
  });
}
