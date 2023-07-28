import { format, resolveConfig } from 'prettier';
import { resolve } from 'node:path';

import type { Options } from 'prettier';

const prettierOptions = await resolveConfig(resolve(process.cwd(), '.prettierrc.yaml'));

/**
 * 根据本地 prettier 配置格式化代码
 * @param code
 * @param options
 */
export function formatCode(code: string, options: Options) {
  return format(code, { ...prettierOptions, ...options });
}
