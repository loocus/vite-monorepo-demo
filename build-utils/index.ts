import { resolve } from 'node:path';
import { readdir, stat } from 'fs/promises';

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

/**
 * 是否是库模式，package.json 文件中有 exports 字段那么就视作为一个 lib
 * @param name
 * @returns
 */
export const isLibMode = (packageJson: Record<string, any>) => !!packageJson.exports;

/**
 * 是否是生产环境
 */
export const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * 是否是开发环境
 */
export const IS_DEV = !IS_PROD;

export const formatFileName = (format, entryName) => `${entryName}.${format}.js`;
