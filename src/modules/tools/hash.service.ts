import { Injectable } from '@nestjs/common';
import { createHash, createHmac } from 'node:crypto';
import {
  CreateHashDto,
  HASH_ALGORITHMS,
  HashAlgorithm,
  HashEncoding,
} from './dto/hash.dto';

export interface HashResult {
  input: {
    length: number;
    encoding: HashEncoding;
    hmac: boolean;
  };
  digests: Partial<Record<HashAlgorithm, string>>;
}

@Injectable()
export class HashService {
  /**
   * Calcula el hash (o HMAC, si viene `hmacKey`) de un texto con los
   * algoritmos pedidos. Sin `algorithms`, calcula los cuatro soportados.
   */
  generate(dto: CreateHashDto): HashResult {
    const algorithms = dto.algorithms?.length
      ? dto.algorithms
      : HASH_ALGORITHMS;
    const encoding = dto.encoding ?? 'hex';
    const isHmac = Boolean(dto.hmacKey);

    const digests: Partial<Record<HashAlgorithm, string>> = {};
    for (const algorithm of algorithms) {
      digests[algorithm] = isHmac
        ? createHmac(algorithm, dto.hmacKey as string)
            .update(dto.text, 'utf8')
            .digest(encoding)
        : createHash(algorithm).update(dto.text, 'utf8').digest(encoding);
    }

    return {
      input: {
        length: dto.text.length,
        encoding,
        hmac: isHmac,
      },
      digests,
    };
  }
}
