import { resolve } from 'node:path';
import { readdir } from 'fs/promises';

export { runParallel } from './run-parallel';
export { formatCode } from './format-code';
import { isDir, isFile, getDirName, getFileName } from './fs-helper';

export { isDir, isFile, getDirName, getFileName };

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
      const pkgDirPath = resolve(pkgDir, file);
      // 当目标是一个文件夹并且包含 package.json 文件时，才视作一个包
      return (await isDir(pkgDirPath)) && (await isFile(resolve(pkgDirPath, 'package.json')))
        ? file
        : null;
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
