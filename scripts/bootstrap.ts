/**
 * 快速生成一个 package 模板
 */

import { input, select, Separator } from '@inquirer/prompts';
import { mkdir, writeFile } from 'node:fs/promises';
import { exists } from 'fs-extra';
import { pkgNames, pkgDir, formatCode } from '../build-utils';
import { resolve } from 'node:path';

const pkgName = await input({
  message: '请输入包名',
  validate: (input) => {
    if (!input || input === '') return '包名不能为空';

    if (pkgNames.includes(input)) return '包名已存在';

    if (!/^[@a-z]+(-[a-z0-9]+)*$/.test(input)) return '包名格式不正确';

    return true;
  },
});

const pkgType = await select({
  message: '请选择包类型',
  choices: [new Separator(), { name: 'web 应用', value: 'app' }, { name: '库', value: 'lib' }],
});
const pkgDirPath = resolve(pkgDir, pkgName);

await mkdir(pkgDirPath);

await Promise.all([genPackageJson(), genViteConfig(), genEntryFile()]);

async function genPackageJson() {
  // 创建 package.json 文件
  const pkgJson = {
    name: pkgName,
    version: '0.0.0',
    description: '',
    type: 'module',
  };

  if (pkgType === 'lib') {
    Object.assign(pkgJson, {
      main: 'dist/index.cjs.js',
      module: 'dist/index.es.js',
      types: 'dist/index.d.ts',
    });
  }

  const source = await formatCode(JSON.stringify(pkgJson), { parser: 'json' });

  await writeFile(resolve(pkgDirPath, 'package.json'), source, 'utf-8');
}

async function genViteConfig() {
  // 创建 vite.config.ts 文件
  const source = `
    import { defineConfig } from 'vite';
    import { formatFileName } from '../../build-utils';

    export default defineConfig(${
      pkgType === 'lib'
        ? `{
              build: {
                lib: {
                  entry: ['src/index.ts'],
                  fileName: formatFileName,
                },
                rollupOptions: {
                  external: ['vue'],
                  output: {
                    globals: {
                      vue: 'Vue',
                    },
                  },
                },
              },
            }`
        : '{}'
    });
  `;

  await writeFile(
    resolve(pkgDirPath, 'vite.config.ts'),
    await formatCode(source, { parser: 'typescript' }),
    'utf-8'
  );
}

async function genEntryFile() {
  const sourceDirPath = resolve(pkgDirPath, 'src');
  // 创建文件夹
  if (!(await exists(sourceDirPath))) {
    await mkdir(sourceDirPath);
  }

  if (pkgType === 'lib') {
    const source = `export {}`;
    // 创建 index.ts 文件
    await writeFile(
      resolve(sourceDirPath, 'indedx.ts'),
      await formatCode(source, { parser: 'typescript' }),
      'utf-8'
    );
  } else if (pkgType === 'app') {
    const source = `
      import { createApp } from 'vue';
      import App from './app.vue';

      createApp(App).mount('#app');
    `;
    const appSource = `
      <script setup lang="ts"></script>

      <template>
        <div>app</div>
      </template>
    `;
    // 创建 app.vue 文件
    await writeFile(
      resolve(sourceDirPath, 'app.vue'),
      await formatCode(appSource, { parser: 'vue' }),
      'utf-8'
    );
    // 创建 main.ts 文件
    await writeFile(
      resolve(sourceDirPath, 'main.ts'),
      await formatCode(source, { parser: 'typescript' }),
      'utf-8'
    );
  }
}
