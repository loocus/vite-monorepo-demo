/**
 * 启动所选应用
 */

import { select, Separator } from '@inquirer/prompts';
import { createServer, mergeConfig } from 'vite';

import { pkgNames, loadPkgConfig, isLibMode } from '../build-utils';

const pkgCaches = await loadPkgConfig();

const selected = await select({
  message: '请选择需要启动的应用',
  choices: [
    new Separator(),
    ...pkgNames
      .filter((pkgName) => {
        const cache = pkgCaches.get(pkgName);
        if (cache === null) return false;
        return !isLibMode(cache);
      })
      .map((name) => ({ name, value: name })),
  ],
});

let config = pkgCaches.get(selected);

if (!isLibMode(config)) {
  config = mergeConfig(config, { define: { __BROWSER__: `${true}` } });
}

const server = await createServer(config);
await server.listen();
server.printUrls();
