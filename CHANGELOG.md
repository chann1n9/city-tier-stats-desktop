# Changelog

## v0.9.1 - 2026-07-07

### 新增

- 新增应用内检查更新能力，支持启动后静默提示，并在设置页展示新版本说明和下载入口。
- 关于页新增项目仓库入口，方便查看发布信息和反馈问题。

### 修复

- 修复返回按钮在侧边栏区域附近可能无法点击的问题。
- 修复 Windows 打包版本调用内置分析器时未使用 `.exe` 可执行文件名的问题。
- 修复模板测试消息残留导致的无意义日志输出。

### 变更

- 将渲染进程可用的桌面通信能力收窄为按需调用接口。
- 调整应用布局，减少自定义层级关系对浮动按钮和侧边栏交互的影响。
- 统一安装包产物命名，避免下载链接和实际产物名称不一致。

### 构建

- 优化发布流程，按固定产物名称上传 Windows/macOS 安装包和 blockmap。
- 支持将安装包与 `latest.json` 上传到 OSS 下载目录。
- 为更新检查增加 8 秒超时，避免网络异常时长时间等待。

详细发布说明：[docs/release-notes/v0.9.1.md](docs/release-notes/v0.9.1.md)

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
