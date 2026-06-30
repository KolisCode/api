import { createHmac } from 'node:crypto';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import { ClickContext } from './links.service';

/** Extrae datos de analytics (anonimizados) desde la request del redirect. */
export function buildClickContext(req: Request): ClickContext {
  const ua = UAParser(req.headers['user-agent'] ?? '');

  const deviceType = ua.device.type; // 'mobile' | 'tablet' | undefined
  const device = deviceType ?? 'desktop';

  // País: disponible si la API está detrás de Cloudflare u otro proxy geo.
  const country =
    (req.headers['cf-ipcountry'] as string | undefined) ??
    (req.headers['x-country'] as string | undefined);

  const referer = req.headers['referer'] ?? req.headers['referrer'];
  const referrer =
    typeof referer === 'string' ? hostnameOf(referer) : undefined;

  return {
    device,
    browser: ua.browser.name,
    os: ua.os.name,
    country: country || undefined,
    referrer,
    ipHash: hashIp(req.ip),
  };
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.slice(0, 100);
  }
}

function hashIp(ip?: string): string | undefined {
  if (!ip) return undefined;
  const secret = process.env.IP_HASH_SECRET ?? 'dev-secret';
  return createHmac('sha256', secret).update(ip).digest('hex').slice(0, 32);
}
