import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stat } from 'node:fs/promises';
import { exists } from 'fs-extra';

/**
 * 获取文件所在目录
 * @param fileURL
 * @returns
 */
export function getDirName(fileURL: string) {
  return dirname(resolve(fileURLToPath(fileURL)));
}

/**
 * 获取文件名称
 * @param fileURL
 * @returns
 */
export function getFileName(fileURL: string) {
  return fileURLToPath(fileURL).split('/').pop();
}

/**
 * 是否是一个文件
 * @param fileURL
 * @returns
 */
export async function isFile(fileURL: string) {
  return (await exists(fileURL)) && (await stat(fileURL)).isFile();
}

/**
 * 是否是一个文件夹
 * @param fileURL
 * @returns
 */
export async function isDir(fileURL: string) {
  return (await exists(fileURL)) && (await stat(fileURL)).isDirectory();
}
