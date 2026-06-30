import {
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { ListLinksQuery } from './dto/list-links.query';

const generateCode = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 7);

export interface ClickContext {
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  ipHash?: string;
}

@Injectable()
export class LinksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(apiKeyId: string, dto: CreateLinkDto) {
    const code = dto.code ?? (await this.uniqueCode());

    const existing = await this.prisma.link.findUnique({ where: { code } });
    if (existing) {
      throw new ConflictException(`El código "${code}" ya está en uso.`);
    }

    const link = await this.prisma.link.create({
      data: {
        code,
        targetUrl: dto.targetUrl,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        apiKeyId,
      },
      select: this.publicFields(),
    });

    return { ...link, shortUrl: this.shortUrl(link.code) };
  }

  private shortUrl(code: string): string {
    const base = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000';
    return `${base}/r/${code}`;
  }

  /** Devuelve el shortUrl de un enlace, validando que pertenezca a la key. */
  async shortUrlFor(apiKeyId: string, code: string): Promise<string> {
    const link = await this.prisma.link.findUnique({
      where: { code },
      select: { code: true, apiKeyId: true },
    });
    if (!link || link.apiKeyId !== apiKeyId) {
      throw new NotFoundException('Enlace no encontrado.');
    }
    return this.shortUrl(link.code);
  }

  async list(apiKeyId: string, query: ListLinksQuery) {
    const limit = query.limit ?? 20;
    const items = await this.prisma.link.findMany({
      where: { apiKeyId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // +1 para saber si hay página siguiente
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: this.publicFields(),
    });

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    return {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
    };
  }

  /** Resuelve el enlace para el redirect y registra el clic. Lanza si expiró. */
  async resolveAndTrack(code: string, click: ClickContext): Promise<string> {
    const link = await this.prisma.link.findUnique({ where: { code } });
    if (!link) {
      throw new NotFoundException('Enlace no encontrado.');
    }
    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
      throw new GoneException('Este enlace ha expirado.');
    }

    await this.prisma.$transaction([
      this.prisma.clickEvent.create({ data: { linkId: link.id, ...click } }),
      this.prisma.link.update({
        where: { id: link.id },
        data: { clickCount: { increment: 1 } },
      }),
    ]);

    return link.targetUrl;
  }

  /** Analytics agregadas de un enlace, validando que pertenezca a la key. */
  async stats(apiKeyId: string, code: string) {
    const link = await this.prisma.link.findUnique({
      where: { code },
      select: {
        id: true,
        apiKeyId: true,
        code: true,
        targetUrl: true,
        clickCount: true,
        createdAt: true,
      },
    });
    if (!link || link.apiKeyId !== apiKeyId) {
      throw new NotFoundException('Enlace no encontrado.');
    }

    const [byDevice, byBrowser, byCountry, topReferrers, timeline] =
      await Promise.all([
        this.groupCount(link.id, 'device'),
        this.groupCount(link.id, 'browser'),
        this.groupCount(link.id, 'country'),
        this.topReferrers(link.id),
        this.timeline(link.id),
      ]);

    return {
      code: link.code,
      targetUrl: link.targetUrl,
      createdAt: link.createdAt,
      totalClicks: link.clickCount,
      byDevice,
      byBrowser,
      byCountry,
      topReferrers,
      timeline,
    };
  }

  // ---- helpers -----------------------------------------------------------

  private publicFields() {
    return {
      id: true,
      code: true,
      targetUrl: true,
      clickCount: true,
      createdAt: true,
      expiresAt: true,
    } as const;
  }

  private async uniqueCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const code = generateCode();
      const exists = await this.prisma.link.findUnique({ where: { code } });
      if (!exists) return code;
    }
    throw new ConflictException(
      'No se pudo generar un código único, reintenta.',
    );
  }

  private async groupCount(
    linkId: string,
    field: 'device' | 'browser' | 'country',
  ) {
    const rows = await this.prisma.clickEvent.groupBy({
      by: [field],
      where: { linkId },
      _count: { _all: true },
      orderBy: { _count: { [field]: 'desc' } },
    });
    return rows.map((r) => ({
      value: r[field] ?? 'desconocido',
      count: r._count._all,
    }));
  }

  private async topReferrers(linkId: string) {
    const rows = await this.prisma.clickEvent.groupBy({
      by: ['referrer'],
      where: { linkId, referrer: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { referrer: 'desc' } },
      take: 5,
    });
    return rows.map((r) => ({ referrer: r.referrer, count: r._count._all }));
  }

  private async timeline(linkId: string) {
    return this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
      FROM "click_events"
      WHERE "linkId" = ${linkId}
      GROUP BY day
      ORDER BY day ASC
    `.then((rows) =>
      rows.map((r) => ({
        day: r.day.toISOString().slice(0, 10),
        count: Number(r.count),
      })),
    );
  }
}
