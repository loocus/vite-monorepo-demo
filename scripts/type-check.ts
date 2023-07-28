/**
 * 未所选的包提供类型检查
 */

import { execa } from 'execa';
import { checkbox, Separator } from '@inquirer/prompts';
import { resolve } from 'path';
import { remove } from 'fs-extra';
import { format } from 'prettier';
import { pkgNames } from '../build-utils';
import { writeFile } from 'fs/promises';

const rootDir = process.cwd();
/**
 * 已选中的包名列表
 */
const checkedList = await checkbox({
  message: '请选择需要检查类型的包',
  choices: [new Separator(), ...pkgNames.map((name) => ({ name, value: name }))],
});

if (checkedList.length === 0) {
  process.exit(0);
}

/**
 * module 的 tsconfig.json 文件
 */
const moduleConfig = {
  extends: resolve(rootDir, 'tsconfig.json'),
  compilerOptions: {
    noEmit: true,
  },
  exclude: pkgNames
    .filter((pkgName) => !checkedList.includes(pkgName))
    .reduce((arr, name) => [...arr, `packages/${name}`], []),
};

const moduleConfigPath = resolve(rootDir, 'tsconfig.module.json');

// 写入临时 tsconfig.json 文件
await writeFile(moduleConfigPath, await format(JSON.stringify(moduleConfig), { parser: 'json' }));
// 生成 d.ts 文件
try {
  await execa('vue-tsc', ['--project', 'tsconfig.module.json']);
} catch (e) {
  console.error(e.message);
}

await remove(moduleConfigPath);
