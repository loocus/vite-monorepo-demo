import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import eslintPlugin from 'vite-plugin-eslint';
import { IS_PROD, rootDir } from '../build-utils';
import { resolve } from 'node:path';

// 加载对应环境配置文件
const env = await import(`file://${resolve(rootDir, `config/env.${process.env.NODE_ENV}.ts`)}`);

export default defineConfig({
  mode: IS_PROD ? 'production' : 'development',
  plugins: [
    vue(),
    eslintPlugin({
      include: ['pakages/**/*.ts', 'pakages/**/*.vue'],
    }),
  ],
  // 定义全局变量
  define: {
    ...env,
  },
});
