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
        fileName: (format) => `components.${format}.js`,
      },
      rollupOptions: {
        external: [...external],
      },
    },
  })
);
