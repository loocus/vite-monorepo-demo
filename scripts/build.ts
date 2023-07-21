import { checkbox, Separator } from '@inquirer/prompts';
import { mergeConfig, UserConfig, build, InlineConfig } from 'vite';
import { resolve } from 'path';
import { stat } from 'fs/promises';
import os from 'os';

import { pkgNames, pkgDir, runParallel } from '../build-utils';
import viteConfig from '../config/vite.config';

const checkedList = await checkbox({
  message: '请选择需要构建的包',
  choices: [new Separator(), ...pkgNames.map((name) => ({ name, value: name }))],
});

const tasks = checkedList.map((name) => async () => {
  // 配置文件路径
  const configPath = resolve(pkgDir, name, 'vite.config.ts');
  // 设置当前包的默认 root
  let config = mergeConfig(viteConfig as UserConfig, { root: resolve(pkgDir, name) });
  try {
    // 判断文件是否存在
    const res = await stat(configPath);
    // 判断是否是一个文件
    if (!res.isFile()) throw new Error('vite.config.ts is not a file');
    // 如果文件存在则合并配置
    config = mergeConfig(config, (await import(`file://${configPath}`)).default);
  } catch (e) {
    /* empty */
  }
  // 构建
  return build(config as InlineConfig);
});

console.log(await runParallel<any>(tasks, os.cpus().length));
