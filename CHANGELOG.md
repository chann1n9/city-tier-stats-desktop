# Changelog

## v0.9.0 - 2026-07-06

### 新增

- 首次发布 City Tier Stats Desktop 桌面应用。
- 支持导入 Excel / CSV 文件并执行城市等级统计。
- 支持按分组查看城市等级占比、总量和明细结果。
- 支持历史分析记录、未查看结果入口、搜索筛选和分页浏览。
- 支持导出分析明细为 Excel 或 CSV。
- 支持城市等级规则查询、添加、删除、恢复默认、打开规则文件和打开规则目录。
- 支持主题切换和桌面端应用图标资源。

### 修复

- 修复 Naive UI 组件默认英文文案导致的本地化问题。
- 修复打包后 native 依赖与 Electron 运行时 ABI 不匹配导致本地数据能力不可用的问题。
- 修复 Windows CI 中依赖重建命令使用错误 pnpm 环境导致构建失败的问题。
- 修复 macOS 签名证书名称传递格式不符合 electron-builder 要求的问题。

### 变更

- 补充桌面端 README，说明应用能力、本地开发、runtime 准备和数据存储位置。
- 将 `city-tier-stats` runtime 版本作为桌面端项目依赖配置维护。
- 调整 release notes 生成规则，使应用内发布说明使用产品化表达。

### 构建

- 建立 Windows 与 macOS 的 GitHub Actions 构建流程。
- 支持在 CI 中下载对应版本的 `city-tier-stats` runtime 并打入安装包。
- 支持 macOS 应用签名、公证和 runtime 二进制签名。
- 支持按 Electron 目标运行时显式重建 `better-sqlite3`。
- 支持使用 `docs/release-notes/v{version}.md` 发布 GitHub Release。
- 发布附件保留 Windows/macOS 安装包与 blockmap，不上传构建调试配置。

详细发布说明：[docs/release-notes/v0.9.0.md](docs/release-notes/v0.9.0.md)
