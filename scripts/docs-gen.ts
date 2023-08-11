import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';

import { checkbox, Separator } from '@inquirer/prompts';
import { execa } from 'execa';
import { exists } from 'fs-extra';
import { cpus } from 'os';

import { pkgNames, pkgDir, runParallel, isFile } from '../build-utils';

const filters = [];

for (const pkgName of pkgNames) {
  if (await isFile(resolve(pkgDir, pkgName, `${pkgName}.api.json`))) {
    filters.push(pkgName);
  }
}

const checked = await checkbox({
  message: '请选择需要生成文档的包',
  choices: [new Separator(), ...filters.map((name) => ({ name, value: name }))],
});

const task = [];

for (const pkgName of checked) {
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
