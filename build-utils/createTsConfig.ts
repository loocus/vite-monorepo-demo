import { rootDir } from '.';
import { resolve } from 'node:path';

export const createTsConfig = (declarationDir: string, pkgName: string) => {
  return {
    extends: resolve(rootDir, 'tsconfig.json'),
    compilerOptions: {
      noEmit: false,
      declaration: true,
      declarationMap: true,
      declarationDir: declarationDir,
      emitDeclarationOnly: true,
    },
    include: [`packages/src/${pkgName}/*.ts`, `packages/src/${pkgName}/*.d.ts`],
    exclude: ['packages/app'],
  };
};
