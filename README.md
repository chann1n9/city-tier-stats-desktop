# City Tier Stats Desktop

一个用于本地分析表格中城市等级分布的桌面应用。应用支持导入 `.xlsx` / `.csv` 文件，调用本地 `city-tier-stats` runtime 完成城市等级识别与分组统计，并在桌面端查看、检索、导出分析结果。

## 功能

- 导入 Excel / CSV 文件并执行城市等级统计
- 按企微名称等字段分组查看各城市等级占比
- 查看分析详情、原始文件元数据和规则文件元数据
- 导出明细结果为 Excel 或 CSV
- 管理历史分析记录、未查看结果和搜索筛选
- 编辑、重置、打开本地城市等级规则文件
- 支持主题切换

## 技术栈

- Electron
- Vue 3
- TypeScript
- Vite
- Naive UI
- Pinia
- better-sqlite3
- electron-builder

## 环境要求

- Node.js 22
- pnpm

本项目依赖一个外部 runtime：[city-tier-stats](https://github.com/chann1n9/city-tier-stats/releases)。仓库只保留 `resources/runtimes/.gitkeep`，不会提交 runtime 二进制和默认规则文件。开发或打包前，需要将 runtime 解包到：

```text
resources/runtimes/city-tier-stats/
```

目录中至少应包含：

```text
resources/runtimes/city-tier-stats/city-tier-stats
resources/runtimes/city-tier-stats/city_tiers.yaml
```

CI 也应在构建前完成同样的解包步骤。打包后该目录会通过 `electron-builder` 的 `extraResources` 复制到应用资源目录。

## 本地开发

安装依赖：

```bash
pnpm install
```

准备 runtime 后启动开发环境：

```bash
pnpm dev
```

构建当前平台安装包：

```bash
pnpm build
```

按平台构建：

```bash
pnpm build:mac
pnpm build:win
```

本地 macOS 构建且跳过证书自动发现：

```bash
pnpm build:mac:local
```

构建产物输出到：

```text
release/<version>/
```

## 数据存储

应用数据写入 Electron 的 `userData` 目录：

- `app.sqlite`：导入文件和分析记录索引
- `results/*.json`：每次分析的 JSON 结果
- `rules/city_tiers.yaml`：用户可编辑的城市等级规则

首次使用规则功能时，应用会从 runtime 内置的 `city_tiers.yaml` 复制一份到用户数据目录。之后的规则修改只影响用户数据目录中的副本。

## 项目结构

```text
electron/                 Electron 主进程、IPC、数据库和服务
src/                      Vue 渲染进程代码
build/icons/              应用图标资源
resources/runtimes/       runtime 占位目录，实际内容由 CI 或本地构建前解包
scripts/                  构建辅助脚本
dist/                     Vite 构建产物，已忽略
dist-electron/            Electron 编译产物，已忽略
release/                  electron-builder 输出目录，已忽略
```

## 许可说明

当前仓库没有提交 runtime 二进制文件。若要完整复现构建，需要另外提供与当前桌面端 IPC 调用兼容的 [city-tier-stats runtime](https://github.com/chann1n9/city-tier-stats/releases)。

本仓库未授予任何开源或再分发许可。除 GitHub 平台条款允许的查看和 fork 外，保留全部权利。
