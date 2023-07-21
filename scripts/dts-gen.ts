import { execa } from 'execa';
import { checkbox, Separator } from '@inquirer/prompts';
import { resolve } from 'path';
import { stat, mkdir } from 'fs/promises';
import { remove, exists } from 'fs-extra';
import { format } from 'prettier';
import { pkgNames, pkgDir, runParallel, rootDir } from '../build-utils';
import { writeFile, unlink } from 'fs/promises';
import { ExtractorConfig, Extractor, IConfigFile } from '@microsoft/api-extractor';

const existsFlags = await Promise.all(
  pkgNames.map(async (pkgName) => await exists(resolve(pkgDir, pkgName, 'index.html')))
);

const exclude = pkgNames.filter((_, index) => existsFlags[index]);

const include = pkgNames.filter((_, index) => !existsFlags[index]);

const checkedList = await checkbox({
  message: '请选择需要生成 d.ts 文件的包',
  choices: [...include.map((name) => ({ name, value: name }))],
});

if (checkedList.length === 0) {
  console.log('没有选择任何包');
  process.exit(0);
}

const dtsTempDir = resolve(rootDir, 'dts-temp');
const tsConfig = {
  extends: resolve(rootDir, 'tsconfig.json'),
  compilerOptions: {
    noEmit: false,
    declaration: true,
    declarationMap: true,
    declarationDir: dtsTempDir,
    emitDeclarationOnly: true,
  },
  exclude: [...exclude, ...pkgNames.filter((pkgName) => !checkedList.includes(pkgName))].reduce(
    (arr, name) => [...arr, `packages/${name}`],
    []
  ),
};

const configPath = resolve(rootDir, 'tsconfig.dts.json');

if (!(await exists(dtsTempDir))) {
  // 创建临时目录
  await mkdir(dtsTempDir);
}

// 写入临时 tsconfig.json 文件
await writeFile(configPath, await format(JSON.stringify(tsConfig), { parser: 'json' }));

// 生成 d.ts 文件
await execa('tsc', ['--project', 'tsconfig.dts.json']);

// 如果只选中一个包，那么tsc生成的目录结构将不会包括packages目录
if (checkedList.length === 1) {
  invoke((config) => {
    // 指定 d.ts 文件的入口
    config.mainEntryPointFilePath = resolve(dtsTempDir, 'index.d.ts');
    // 指定合并过后 d.ts 文件的输出路径
    config.dtsRollup.publicTrimmedFilePath = resolve(pkgDir, checkedList[0], 'dist/index.d.ts');
    return config;
  });
} else {
  checkedList.forEach((pkgName) => {
    invoke((config) => {
      // 指定 d.ts 文件的入口
      config.mainEntryPointFilePath = resolve(dtsTempDir, pkgName, 'src/index.d.ts');
      // 指定合并过后 d.ts 文件的输出路径
      config.dtsRollup.publicTrimmedFilePath = resolve(pkgDir, pkgName, 'dist/index.d.ts');
      return config;
    });
  });
  //
}

await remove(configPath);
await remove(dtsTempDir);

function invoke(fn: (config: IConfigFile) => IConfigFile) {
  // 加载 extractor 配置文件
  const config = fn(ExtractorConfig.loadFile(resolve(rootDir, 'api-extractor.json')));
  // 生成 Extractor 执行所需配置
  const extractorConfig = ExtractorConfig.prepare({
    configObject: config,
    configObjectFullPath: resolve(rootDir, 'api-extractor.json'),
    packageJsonFullPath: resolve(rootDir, 'package.json'),
  });

  const result = Extractor.invoke(extractorConfig, {
    localBuild: true,
    showVerboseMessages: true,
  });
}
