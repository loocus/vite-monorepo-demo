/**
 * 为所选的包生成 d.ts 文件
 */

import { execa } from 'execa';
import { checkbox, Separator } from '@inquirer/prompts';
import { resolve } from 'path';
import { mkdir } from 'fs/promises';
import { remove, exists } from 'fs-extra';
import { format } from 'prettier';
import { pkgNames, pkgDir, isLibMode, loadPkgConfig } from '../build-utils';
import { writeFile } from 'fs/promises';
import { ExtractorConfig, Extractor, IConfigFile, ExtractorResult } from '@microsoft/api-extractor';

const rootDir = process.cwd();
const pkgCaches = await loadPkgConfig();

/**
 * 已选中的包名列表
 */
const checkedList = await checkbox({
  message: '请选择需要生成 d.ts 文件的包',
  choices: [
    new Separator(),
    ...pkgNames
      // 只对 lib 模式下的包生成d.ts文件
      .filter((name) => isLibMode(pkgCaches.get(name)))
      .map((name) => ({ name, value: name })),
  ],
});

if (checkedList.length === 0) {
  console.log('没有选择任何包');
  process.exit(0);
}

const dtsTempDir = resolve(rootDir, 'dts-temp');

/**
 * module 的 tsconfig.json 文件
 */
const moduleConfig = {
  extends: resolve(rootDir, 'tsconfig.json'),
  compilerOptions: {
    noEmit: false,
    declaration: true,
    declarationMap: true,
    declarationDir: dtsTempDir,
    emitDeclarationOnly: true,
  },
  exclude: [...pkgNames]
    .filter((pkgName) => !checkedList.includes(pkgName))
    .reduce((arr, name) => [...arr, `packages/${name}`], []),
};

const moduleConfigPath = resolve(rootDir, 'tsconfig.module.json');

if (!(await exists(dtsTempDir))) {
  // 创建临时目录
  await mkdir(dtsTempDir);
}

// 写入临时 tsconfig.json 文件
await writeFile(moduleConfigPath, await format(JSON.stringify(moduleConfig), { parser: 'json' }));

// 生成 d.ts 文件
await execa('vue-tsc', ['--project', 'tsconfig.module.json']);

// api-extractor 配置文件路径
const apiExtractorJsonPath = resolve(rootDir, 'api-extractor.json');
// 加载 extractor 配置文件
const config = ExtractorConfig.loadFile(apiExtractorJsonPath);

checkedList.forEach((pkgName) => {
  invoke(pkgName);
});

await remove(moduleConfigPath);
await remove(dtsTempDir);

function invoke(pkgName: string) {
  // 指定要分析的入口文件
  config.mainEntryPointFilePath =
    checkedList.length === 1
      ? resolve(dtsTempDir, 'index.d.ts')
      : resolve(dtsTempDir, pkgName, 'src/index.d.ts');
  // 指定合并过后 d.ts 文件的输出路径
  config.dtsRollup.publicTrimmedFilePath = resolve(pkgDir, pkgName, 'dist/index.d.ts');
  // 指定报告文件的输出路径
  config.apiReport.reportFolder = resolve(pkgDir, pkgName, 'api-config');
  // 指定生成的 api.json 文件的输出路径
  config.docModel.apiJsonFilePath = resolve(pkgDir, pkgName, `${pkgName}.api.json`);
  // 生成 Extractor 执行所需配置
  const extractorConfig = ExtractorConfig.prepare({
    configObject: config,
    configObjectFullPath: apiExtractorJsonPath,
    packageJsonFullPath: resolve(rootDir, 'package.json'),
  });

  return Extractor.invoke(extractorConfig, {
    localBuild: true,
    showVerboseMessages: true,
  });
}