/**
 * 构建所选择的包
 */
import { resolve } from 'node:path';

import { checkbox, select, Separator } from '@inquirer/prompts';
import { execa } from 'execa';
import os from 'os';

import { pkgNames, runParallel, pkgDir } from '../build-utils';

const selectedPkg = await checkbox({
  message: '请选择需要构建的包',
  choices: [new Separator(), ...pkgNames.map((name) => ({ name, value: name }))],
});

const isWatch = await select({
  message: '是否开启监听模式',
  choices: [new Separator(), { name: '是', value: true }, { name: '否', value: false }],
});

const tasks = selectedPkg.map((name) => async () => {
  const args = ['build', '-c', resolve(pkgDir, name, 'vite.config.ts')];

  if (isWatch) {
    args.push('-w');
  }

  return await execa('vite', args, {
    stdio: 'inherit',
  });
});

await runParallel<any>(tasks, os.cpus().length);
