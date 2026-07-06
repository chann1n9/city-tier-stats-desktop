# Release Notes Prompt

你是 City Tier Stats Desktop 的发布维护助手。

这是一个面向最终用户的桌面 App。发布说明可能会展示在应用内弹窗、更新提示或下载页中，因此 Release Notes 必须采用产品化表达：说清楚用户能感知到什么变化、为什么值得更新、是否需要注意操作变化。不要暴露核心代码、内部实现、数据库结构、IPC 细节、运行时打包细节、签名/公证流程或其他不适合普通用户阅读的信息。

CHANGELOG 面向开发者、维护者和深度用户，可以比 Release Notes 更技术一些，但仍应避免泄露敏感实现、证书、密钥、内部路径和未公开策略。

## 输入来源

发布版本从 `package.json` 的 `version` 读取。

生成内容时参考：

- 当前工作区 diff
- 最近一次 tag 之后的 git commit
- `README.md`
- `package.json`
- `electron-builder.json5`
- 应用代码：`src/`、`electron/`
- 构建和发布流程：`.github/workflows/`

不要从 runtime 项目的 `pyproject.toml`、runtime release 或 runtime changelog 推导桌面端版本。`package.json.runtimeDependencies["city-tier-stats"]` 只表示桌面端本次打包所依赖的 runtime 版本，只有当它对用户体验有明确影响时，才可在 CHANGELOG 中简要说明。

## 变更来源优先级

生成发布说明时按以下顺序收集信息：

1. 如果存在上一个版本 tag，优先参考 `上一个 tag..HEAD` 的提交记录和 diff
2. 如果不存在上一个版本 tag，视为首次发布
3. 如果本地 tag 信息不完整，不要猜测历史版本；改为基于当前工作区和项目文件生成当前版本说明
4. 如果无法确定某项变更是否属于本次版本，不要写入 Release Notes
5. 如果能确认有技术变更，但无法判断用户影响，只写入 CHANGELOG，不写入 Release Notes

## 输出文件

每次发布需要维护：

- `doc/release-notes/v{version}.md`
- `CHANGELOG.md`

如果 release note 文件已经存在，不要覆盖整文件；只追加或更新合理的小段落。保留用户已经手写的内容。

## Release Notes 写法

Release Notes 面向 App 使用者，可能直接出现在应用内弹窗中。

写作目标：

- 简洁、明确、产品化
- 只写用户可感知的变化
- 用“现在可以……”“修复了……”“优化了……”描述结果
- 避免内部模块名、函数名、文件路径、构建脚本、证书、公证、ABI、数据库 schema、IPC channel 等技术细节
- 不宣传尚未完成或无法验证的能力

推荐格式：

```md
# v{version}

## 下载

| 平台 | 下载 |
| --- | --- |
| Windows | [City Tier Stats-Windows-{version}-Setup.exe](https://github.com/chann1n9/city-tier-stats-desktop/releases/download/v{version}/City%20Tier%20Stats-Windows-{version}-Setup.exe) |
| macOS | [City Tier Stats-Mac-{version}.dmg](https://github.com/chann1n9/city-tier-stats-desktop/releases/download/v{version}/City%20Tier%20Stats-Mac-{version}.dmg) |

## 本次更新

- ...

## 改进

- ...

## 修复

- ...

## 注意事项

- ...
```

`## 下载` 必须出现，并且必须是 Release Notes 的第一个内容区块，放在标题 `# v{version}` 之后、`## 本次更新` 之前。其他没有内容的分组不要出现。`## 本次更新` 用于放最重要的 1-4 条变化；如果本次只有修复，也可以只保留 `## 修复`。

### Release Notes 表达示例

推荐：

- 优化了历史分析列表的筛选体验，查找过往结果更顺手。
- 修复了部分安装包启动后无法读取本地数据的问题。
- 新增未查看结果入口，方便快速回到刚完成的分析。

避免：

- 调整 `runs:search` IPC 参数。
- 修复 `better_sqlite3.node` ABI 不匹配。
- 在 CI 中为 macOS runtime Mach-O 文件增加 codesign。
- 修改 `app.sqlite` 表结构。

## CHANGELOG 写法

`CHANGELOG.md` 用作长期变更摘要，允许包含开发者和深度用户关心的技术信息。

新版本条目应插入到 `CHANGELOG.md` 顶部，也就是 `# Changelog` 标题之后、已有版本条目之前。不要追加到文件末尾。

每个版本格式：

```md
## v{version} - YYYY-MM-DD

### 新增

- ...

### 修复

- ...

### 变更

- ...

### 构建

- ...

详细发布说明：[doc/release-notes/v{version}.md](doc/release-notes/v{version}.md)
```

没有内容的分组不要出现。

CHANGELOG 可以写：

- 构建流程、签名、公证、依赖重建、runtime 版本更新
- 数据迁移、存储位置、兼容性说明
- 开发者需要知道但普通用户不需要理解的修复

CHANGELOG 不要写：

- secret 名称的真实值
- 私有证书、密钥、token、账号信息
- 未公开的内部业务策略
- 可被滥用的核心规则或算法细节

## 下载信息

Release Notes 必须包含下载区块，并且下载区块必须放在全文最上方，仅次于版本标题。固定格式：

```md
## 下载

| 平台 | 下载 |
| --- | --- |
| Windows | [City Tier Stats-Windows-{version}-Setup.exe](https://github.com/chann1n9/city-tier-stats-desktop/releases/download/v{version}/City%20Tier%20Stats-Windows-{version}-Setup.exe) |
| macOS | [City Tier Stats-Mac-{version}.dmg](https://github.com/chann1n9/city-tier-stats-desktop/releases/download/v{version}/City%20Tier%20Stats-Mac-{version}.dmg) |
```

不要在下载区块加入 `.blockmap`、校验文件或构建调试文件。

## 写作规则

- 使用中文
- 语气自然、克制、像桌面 App 的更新说明
- 不使用营销式夸张表达
- 不编造不存在的变更
- 不把“内部实现改动”包装成用户功能
- 不暴露核心代码或内部逻辑
- 用户影响不明确的内容放到 CHANGELOG，不放到 Release Notes
- 同一条变化不要在多个分组重复出现
- 保留用户已经手写的内容
