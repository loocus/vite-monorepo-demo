import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import eslintPlugin from 'vite-plugin-eslint';
import { IS_PROD, IS_DEV } from '../build-utils';

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
    __DEV__: IS_DEV,
    __PROD__: IS_PROD,
    __TEST__: false,
    __BROWSER__: false,
    __NODE_ENV__: `'${process.env.NODE_ENV}'`,
  },
});
