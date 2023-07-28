/**
 * 构建所选择的包
 */

import { checkbox, select, Separator } from '@inquirer/prompts';
import { UserConfig, build, InlineConfig, mergeConfig } from 'vite';
import os from 'os';
import { pkgNames, loadPkgConfig, runParallel, isLibMode } from '../build-utils';

const pkgCaches = await loadPkgConfig();

const selectedPkg = await checkbox({
  message: '请选择需要构建的包',
  choices: [new Separator(), ...pkgNames.map((name) => ({ name, value: name }))],
});

const isWatch = await select({
  message: '是否开启监听模式',
  choices: [new Separator(), { name: '是', value: true }, { name: '否', value: false }],
});

const tasks = selectedPkg.map((name) => async () => {
  // 获取缓存中的配置
  let config = pkgCaches.get(name) as UserConfig;

  if (!isLibMode(config)) {
    config = mergeConfig(config, { define: { __BROWSER__: true } });
  }

  if (isWatch) {
    config = mergeConfig(config, { build: { watch: true } });
  }
  // 构建
  return build(config as InlineConfig);
});

await runParallel<any>(tasks, os.cpus().length);
