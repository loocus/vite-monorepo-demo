/**
 * 快速生成一个 package 模板
 */

import { input, select, Separator } from '@inquirer/prompts';
import { mkdir, writeFile } from 'node:fs/promises';
import { exists } from 'fs-extra';
import { pkgNames, pkgDir, formatCode } from '../build-utils';
import { resolve } from 'node:path';
import packageJson from '../package.json';

const { name: pkgPrefix, dependencies } = packageJson;

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
  choices: [
    new Separator(),
    { name: 'web 应用', value: 'app' },
    { name: '库', value: 'lib' },
    { name: '组件库', value: 'component-lib' },
  ],
});
const isApp = pkgType === 'app';
const isLib = pkgType === 'lib';
const isComponentLib = pkgType === 'component-lib';
const pkgDirPath = resolve(pkgDir, pkgName);

await mkdir(pkgDirPath);

await Promise.all([genPackageJson(), genViteConfig(), genEntryFile()]);

async function genPackageJson() {
  // 创建 package.json 文件
  const pkgJson = {
    name: `@${pkgPrefix}/${pkgName}`,
    version: '0.0.0',
    description: '',
    type: 'module',
  };

  if (isApp) {
    Object.assign(pkgJson, {
      dependencies: {
        vue: dependencies.vue,
      },
    });
  } else if (isLib || isComponentLib) {
    Object.assign(pkgJson, {
      main: 'dist/index.cjs.js',
      module: 'dist/index.es.js',
      types: 'dist/index.d.ts',
      exports: {
        '.': {
          import: './dist/index.es.js',
          require: './dist/index.cjs.js',
        },
      },
      dependencies: isComponentLib
        ? {
            vue: dependencies.vue,
          }
        : {},
    });
  }

  const source = await formatCode(JSON.stringify(pkgJson), { parser: 'json-stringify' });

  await writeFile(resolve(pkgDirPath, 'package.json'), source, 'utf-8');
}

async function genViteConfig() {
  // 创建 vite.config.ts 文件
  const source = `
    import { defineConfig } from 'vite';
    ${isComponentLib || isLib ? `import { formatFileName } from '../../build-utils';` : ''}

    export default defineConfig(${
      isComponentLib || isLib
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

  if (isLib) {
    const source = `
      const hello = 'hello ${pkgName}';

      export {
        hello,
      };
    `;
    // 创建 index.ts 文件
    await writeFile(
      resolve(sourceDirPath, 'index.ts'),
      await formatCode(source, { parser: 'typescript' }),
      'utf-8'
    );
  } else if (isApp) {
    const mainSource = `
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
    const htmlSource = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
      </head>
      <body>
        <div id="app"></div>
      </body>
      </html>
    `;
    // 创建 index.html 文件
    await writeFile(
      resolve(pkgDirPath, 'index.html'),
      await formatCode(htmlSource, { parser: 'html' }),
      'utf-8'
    );
    // 创建 app.vue 文件
    await writeFile(
      resolve(sourceDirPath, 'app.vue'),
      await formatCode(appSource, { parser: 'vue' }),
      'utf-8'
    );
    // 创建 main.ts 文件
    await writeFile(
      resolve(sourceDirPath, 'main.ts'),
      await formatCode(mainSource, { parser: 'typescript' }),
      'utf-8'
    );
  } else if (isComponentLib) {
    const myComponentSource = `
      <script lang="ts">
        import { defineComponent } from 'vue';

        export default defineComponent({
          name: 'my-component',
        });
      </script>

      <template>
        <div>my-component</div>
      </template>

      <style scoped></style>
    `;
    const indexSource = `
      import MyComponent from './my-component.vue';

      export {
        MyComponent,
      };
    `;

    await writeFile(
      resolve(sourceDirPath, 'my-component.vue'),
      await formatCode(myComponentSource, { parser: 'vue' }),
      'utf-8'
    );

    await writeFile(
      resolve(sourceDirPath, 'index.ts'),
      await formatCode(indexSource, { parser: 'typescript' }),
      'utf-8'
    );
  }
}
