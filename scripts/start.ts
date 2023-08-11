/**
 * 启动所选应用
 */

import { resolve } from 'node:path';
import { execa } from 'execa';
import { select, Separator } from '@inquirer/prompts';

import { pkgNames, pkgDir, isFile } from '../build-utils';

const filters = [];

for (const pkgName of pkgNames) {
  const indexPath = resolve(pkgDir, pkgName, 'index.html');
  if (await isFile(indexPath)) {
    filters.push(pkgName);
  }
}

if (filters.length === 0) {
  console.warn('未找到任何 web 应用');
  process.exit(1);
}

const selected = await select({
  message: '请选择需要启动的应用',
  choices: [new Separator(), ...filters.map((name) => ({ name, value: name }))],
});

await execa('vite', ['-c', resolve(pkgDir, selected, 'vite.config.ts')], { stdio: 'inherit' });
