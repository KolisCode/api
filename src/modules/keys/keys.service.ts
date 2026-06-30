import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateApiKey } from '../../common/auth/api-key.util';
import { CreateKeyDto } from './dto/create-key.dto';

@Injectable()
export class KeysService {
  constructor(private readonly prisma: PrismaService) {}

  /** Crea una API key de plan FREE y devuelve la clave completa UNA sola vez. */
  async create(dto: CreateKeyDto) {
    const generated = generateApiKey('live');

    const key = await this.prisma.apiKey.create({
      data: {
        name: dto.name,
        prefix: generated.prefix,
        hash: generated.hash,
      },
      select: { id: true, name: true, prefix: true, plan: true, createdAt: true },
    });

    return {
      ...key,
      key: generated.full,
      warning:
        'Guarda esta clave ahora: por seguridad no se volverá a mostrar.',
    };
  }

  /** Devuelve los metadatos de una key por su id (sin secreto). */
  async findById(id: string) {
    const key = await this.prisma.apiKey.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        prefix: true,
        plan: true,
        createdAt: true,
        lastUsedAt: true,
        _count: { select: { links: true } },
      },
    });

    if (!key) {
      throw new NotFoundException('API key no encontrada.');
    }

    const { _count, ...rest } = key;
    return { ...rest, linkCount: _count.links };
  }
}
