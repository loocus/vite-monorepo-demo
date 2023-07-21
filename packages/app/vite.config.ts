import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    __BROWSER__: true,
  },
});
