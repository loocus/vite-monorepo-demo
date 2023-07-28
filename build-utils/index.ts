import { resolve } from 'node:path';
import { readdir, stat } from 'fs/promises';
import { exists } from 'fs-extra';
import { mergeConfig } from 'vite';

import type { UserConfig } from 'vite';

export { runParallel } from './run-parallel';
export { formatCode } from './format-code';

/**
 * packages 目录
 */
export const pkgDir = resolve(process.cwd(), 'packages');

/**
 * 所有的 package 名称
 */
export const pkgNames = await readdir(pkgDir).then(async (fileList) => {
  const result = await Promise.all(
    fileList.map(async (file) => {
      return (await stat(resolve(pkgDir, file))).isDirectory() ? file : null;
    })
  );
  return result.filter((file) => file);
});

const pkgCaches = new Map<string, UserConfig | null>();

/**
 * 加载并返回 package 的配置缓存
 */
export const loadPkgConfig = async () => {
  if (pkgCaches.size === pkgNames.length) return pkgCaches;

  const viteConfig = (await import('../config/vite.config')).default;

  await Promise.all(
    pkgNames.map(async (pkgName) => {
      const configPath = resolve(pkgDir, pkgName, 'vite.config.ts');
      // 判断配置文件是否存在，是否是一个文件，如果存在则加载该模块
      if ((await exists(configPath)) && (await stat(configPath)).isFile()) {
        const config = mergeConfig(viteConfig as UserConfig, { root: resolve(pkgDir, pkgName) });
        pkgCaches.set(pkgName, mergeConfig(config, (await import(`file://${configPath}`)).default));
      } else {
        pkgCaches.set(pkgName, null);
      }
    })
  );
  return pkgCaches;
};

/**
 * 是否是库模式
 * @param userConfig
 * @returns
 */
export const isLibMode = (userConfig: UserConfig) => userConfig?.build?.lib;

/**
 * 是否是生产环境
 */
export const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * 是否是开发环境
 */
export const IS_DEV = !IS_PROD;

export const formatFileName = (format, entryName) => `${entryName}.${format}.js`;
