# vite-monorepo-demo

该项目为使用 vite 搭建的 monorepo demo，使用 pnpm 作为包管理工具。

## scripts

1.运行命令创建可选的模板

```bash
pnpm run boostrap
```

2.启动 app 模板项目

> tips: 脚本会自动列出 app 模板项目

```bash
pnpm run start
```

3.打包

```bash
pnpm run build
```

4.类型检查

> tips: build 前请先进行类型检查

```bash
pnpm run type-check
```

4.生成 d.ts 文件

```bash
pnpm run dts-gen
```

5.生成文档

> tips: 生成文档前需要先生成 d.ts 文件，该脚本使用 @microsoft/api-documenter 来生成文档，但对 vue 文件支持不佳，因此生成不建议使用该工具来生成 vue 文件的文档。

```bash
pnpm run docs-gen
```