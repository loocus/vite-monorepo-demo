import { resolve } from 'node:path';
import { readdir, stat } from 'fs/promises';

export { runParallel } from './run-parallel';

/**
 * 项目启动根目录
 */
export const rootDir = process.cwd();

/**
 * packages 目录
 */
export const pkgDir = resolve(rootDir, 'packages');

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

/**
 * 是否是开发环境
 */
export const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * 是否是生产环境
 */
export const IS_PROD = process.env.NODE_ENV === 'production';
