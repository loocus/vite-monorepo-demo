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
    },
  })
);
