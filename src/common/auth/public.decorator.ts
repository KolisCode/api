import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca una ruta como pública: omite la exigencia de API key. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
