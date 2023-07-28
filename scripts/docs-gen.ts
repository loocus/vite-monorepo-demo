import { execa } from 'execa';
import { exists } from 'fs-extra';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pkgNames, pkgDir, runParallel } from '../build-utils';
import { cpus } from 'os';

const task = [];

for (const pkgName of pkgNames) {
  const apiConfigFilePath = resolve(pkgDir, pkgName, `${pkgName}.api.json`);
  if ((await exists(apiConfigFilePath)) && (await stat(apiConfigFilePath)).isFile()) {
    task.push(() => {
      return execa('api-documenter', [
        'markdown',
        '--input-folder',
        resolve(pkgDir, pkgName),
        '--output-folder',
        resolve(pkgDir, pkgName, 'docs'),
      ]);
    });
  }
}

await runParallel(task, cpus().length);
