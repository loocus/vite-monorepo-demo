import { select, Separator } from '@inquirer/prompts';
import { mergeConfig, UserConfig, createServer } from 'vite';
import { resolve } from 'path';
import { stat } from 'fs/promises';

import { pkgNames, pkgDir } from '../build-utils';
import viteConfig from '../config/vite.config';

const stats = await Promise.all(
  pkgNames.map(async (pkgName) => {
    try {
      return await stat(resolve(pkgDir, pkgName, 'index.html'));
    } catch (e) {
      return null;
    }
  })
);

const selected = await select({
  message: '请选择需要启动的应用',
  choices: [
    new Separator(),
    ...pkgNames
      .filter((_, index) => stats[index] && stats[index].isFile())
      .map((name) => ({ name, value: name })),
  ],
});

// 配置文件路径
const configPath = resolve(pkgDir, selected, 'vite.config.ts');
// 设置当前包的默认 root
let config = mergeConfig(viteConfig as UserConfig, { root: resolve(pkgDir, selected) });

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

const server = await createServer(config);
await server.listen();
server.printUrls();
