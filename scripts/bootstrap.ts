/**
 * 快速生成一个 package 模板
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { input, select, Separator } from '@inquirer/prompts';

import { pkgNames, pkgDir, formatCode } from '../build-utils';
import packageJson from '../package.json';

const { name: pkgPrefix, dependencies } = packageJson;

const pkgType = await select({
  message: '请选择包类型',
  choices: [
    new Separator(),
    { name: 'web 应用', value: 'app' },
    { name: '库', value: 'lib' },
    { name: '组件库', value: 'component-lib' },
  ],
});

const pkgName = await input({
  message: '请输入包名',
  validate: (input) => {
    if (!input || input === '') return '包名不能为空';

    if (pkgNames.includes(input)) return '包名已存在';

    if (!/^[a-z]+(-[a-z0-9]+)*$/.test(input)) return '包名格式不正确';

    return true;
  },
});

const isApp = pkgType === 'app';
const isLib = pkgType === 'lib';
const isComponentLib = pkgType === 'component-lib';
const pkgDirPath = resolve(pkgDir, pkgName);
const sourceDirPath = resolve(pkgDirPath, 'src');
const encode = 'utf-8';

await mkdir(pkgDirPath);
await mkdir(sourceDirPath);

if (isApp) {
  createAppTemplate();
} else if (isLib) {
  createLibTemplate();
} else if (isComponentLib) {
  createComponentLibTemplate();
}

/**
 * 创建 app 模板
 */
async function createAppTemplate() {
  const packageJson = await formatCode(
    `
      {
        "name": "@${pkgPrefix}/${pkgName}",
        "version": "0.0.0",
        "description": "",
        "type": "module",
        "dependencies": {
          "vue": "^3.3.4"
        },
      }
    `,
    { parser: 'json-stringify' }
  );

  const viteConfig = await formatCode(
    `
      import { defineConfig, mergeConfig } from 'vite';

      import { getDirName } from '../../build-utils';
      import baseConfig from '../../config/vite.config';

      const __dirname = getDirName(import.meta.url);

      export default mergeConfig(
        baseConfig,
        defineConfig({
          root: __dirname,
          define: {
            __BROWSER__: true,
          }
        })
      );
    `,
    { parser: 'typescript' }
  );

  const indexHtml = await formatCode(
    `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
      </head>
      <body>
        <div id="app"></div>
        <script type="module" src="/src/main.ts"></script>
      </body>
      </html>
    `,
    { parser: 'html' }
  );

  const main = await formatCode(
    `
      import { createApp } from 'vue';
      import App from './app.vue';

      createApp(App).mount('#app');
    `,
    { parser: 'typescript' }
  );

  const appComponent = await formatCode(
    `
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
    `,
    { parser: 'vue' }
  );

  const pathMapper = {
    [resolve(pkgDirPath, 'package.json')]: packageJson,
    [resolve(pkgDirPath, 'vite.config.ts')]: viteConfig,
    [resolve(pkgDirPath, 'index.html')]: indexHtml,
    [resolve(sourceDirPath, 'main.ts')]: main,
    [resolve(sourceDirPath, 'app.vue')]: appComponent,
  };

  for (const [path, source] of Object.entries(pathMapper)) {
    await writeFile(path, source, encode);
  }
}

/**
 * 创建 lib 模板
 */
async function createLibTemplate() {
  const packageJson = await formatCode(
    `
      {
        "name": "@${pkgPrefix}/${pkgName}",
        "version": "0.0.0",
        "description": "",
        "type": "module",
        "main": "dist/${pkgName}.cjs.js",
        "module": "dist/${pkgName}.es.js",
        "types": "dist/${pkgName}.d.ts",
        "exports": {
          ".": {
            "import": "./dist/${pkgName}.es.js",
            "require": "./dist/${pkgName}.cjs.js"
          }
        },
        "dependencies": {},
        "devDependencies": {},
        "peerDependencies": {}
      }
    `,
    { parser: 'json-stringify' }
  );

  const viteConfig = await formatCode(
    `
      import { defineConfig, mergeConfig } from 'vite';

      import { getDirName } from '../../build-utils';
      import baseConfig from '../../config/vite.config';
      import packageJson from './package.json';

      const __dirname = getDirName(import.meta.url);

      const external = [
        ...Object.keys(packageJson.dependencies ?? {}),
        ...Object.keys(packageJson.devDependencies ?? {}),
        ...Object.keys(packageJson.peerDependencies ?? {}),
      ];

      export default mergeConfig(
        baseConfig,
        defineConfig({
          root: __dirname,
          build: {
            lib: {
              entry: ['src/index.ts'],
              formats: ['cjs', 'es'],
              fileName: (format) => \`${pkgName}.\${format}.js\`,
            },
            rollupOptions: {
              external: [...external],
            },
          },
        })
      );
    `,
    { parser: 'typescript' }
  );

  const index = await formatCode(
    `
      /**
       * @public
       */
      const hello = 'hello ${pkgName}';

      export {
        hello,
      };
    `,
    { parser: 'typescript' }
  );

  const pathMapper = {
    [resolve(pkgDirPath, 'package.json')]: packageJson,
    [resolve(pkgDirPath, 'vite.config.ts')]: viteConfig,
    [resolve(sourceDirPath, 'index.ts')]: index,
  };

  for (const [path, source] of Object.entries(pathMapper)) {
    await writeFile(path, source, encode);
  }
}

/**
 * 创建组件库模板
 */
async function createComponentLibTemplate() {
  const packageJson = await formatCode(
    `
      {
        "name": "@${pkgPrefix}/${pkgName}",
        "version": "0.0.0",
        "description": "",
        "type": "module",
        "main": "dist/${pkgName}.cjs.js",
        "module": "dist/${pkgName}.es.js",
        "types": "dist/${pkgName}.d.ts",
        "exports": {
          ".": {
            "import": "./dist/${pkgName}.es.js",
            "require": "./dist/${pkgName}.cjs.js"
          }
        },
        "dependencies": {
          "vue": "${dependencies.vue}"
        },
        "devDependencies": {},
        "peerDependencies": {}
      }
    `,
    { parser: 'json-stringify' }
  );

  const viteConfig = await formatCode(
    `
      import { defineConfig, mergeConfig } from 'vite';

      import { getDirName } from '../../build-utils';
      import baseConfig from '../../config/vite.config';
      import packageJson from './package.json';

      const __dirname = getDirName(import.meta.url);

      const external = [
        ...Object.keys(packageJson.dependencies ?? {}),
        ...Object.keys(packageJson.devDependencies ?? {}),
        ...Object.keys(packageJson.peerDependencies ?? {}),
      ];

      export default mergeConfig(
        baseConfig,
        defineConfig({
          root: __dirname,
          build: {
            lib: {
              entry: ['src/index.ts'],
              formats: ['cjs', 'es'],
              fileName: (format) => \`${pkgName}.\${format}.js\`,
            },
            rollupOptions: {
              external: [...external],
            },
          },
        })
      );
    `,
    { parser: 'typescript' }
  );

  const myComponent = await formatCode(
    `
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
    `,
    { parser: 'vue' }
  );

  const index = await formatCode(
    `
      import MyComponent from './my-component.vue';

      export {
        MyComponent,
      };
    `,
    { parser: 'typescript' }
  );

  const pathMapper = {
    [resolve(pkgDirPath, 'package.json')]: packageJson,
    [resolve(pkgDirPath, 'vite.config.ts')]: viteConfig,
    [resolve(sourceDirPath, 'my-component.vue')]: myComponent,
    [resolve(sourceDirPath, 'index.ts')]: index,
  };

  for (const [path, source] of Object.entries(pathMapper)) {
    await writeFile(path, source, encode);
  }
}
