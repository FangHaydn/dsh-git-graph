# DSH Git Graph

DSH 的 Git 工作区和历史插件。会话开始后，可在会话窗口顶部的 Tab 中选择 **Git Graph**，直接在主区域查看当前会话仓库；顶部空间不足时，入口会收进「更多」菜单。也可打开右侧栏，点击「+」进入工具列表，再选择 **Git Graph**；侧栏标签显示 Git Graph 的彩色分支图标。新会话输入框上方显示当前 Git 分支，可切换本地分支或选择已登记的 worktree；切换 worktree 会持久更改当前会话目录，不会新建或删除 worktree。安装 better-sidebar 后，也可在底部工作区 panel 的空白面板入口或「+」菜单中选择 **Git Graph**，在工作区内查看同一套 Git 界面。

- **当前修改**：工作区与暂存区列表，逐个或批量暂存／取消暂存；点击文件查看差异；提交输入框右侧提供 AI Conventional Commits 草稿生成；有暂存修改时仅提交暂存内容，暂存区为空时自动暂存全部改动（含未跟踪文件）后提交；支持 ⌘/Ctrl + Enter 提交。
- **Git 历史**：配置了远程仓库时，标题栏右侧显示「从远程获取 / Fetch from remote」图标按钮，未配置远程仓库时隐藏；执行 `git fetch --all` 获取所有已配置远程的更新，完成后刷新历史；获取期间禁用重复操作并显示加载图标；成功时显示约 4 秒后自动关闭的浮动提示，失败时在面板中保留错误。提交、暂存、分支／标签和 Stash 等成功写操作也使用同一浮动提示；自动暂存后提交只提示一次提交成功。Fetch 只获取远程引用和对象，不合并或切换当前分支；历史右侧仅保留 Fetch 按钮，不再显示同步按钮。历史列表支持鼠标右键菜单：在提交行的空白区域右键显示常规操作「创建分支」「创建标签」「复制 Hash」；右键具体的引用标签时只显示该引用专属的菜单——分支标签提供「切换分支」「推送分支」「拉取分支」（仅当前分支落后时）、「删除本地分支」以及在与远程分支对应时的「删除本地和远程分支」；标签（Tag）提供「推送标签到远程」「删除标签」；Stash 标签提供「应用 Stash」「Pop Stash（应用并删除）」「删除 Stash」；仅有远程分支的标签提供「删除远程分支」。菜单弹出位置跟随鼠标。删除操作一律先弹出确认对话框：删除本地分支使用安全的 `git branch -d`（未合并的分支会被拒绝），当前检出的分支和 worktree 占用的分支不可删除；删除本地和远程分支时还会先确认分支提交已并入当前分支，避免丢失提交；推送使用非强制推送。每条记录以 32px 单行展示引用标签与提交标题，标题保持一行不换行并在过长时省略。分支标签本地与远程合并展示：本地只显示分支名；本地和同名远程分支同时存在时显示「分支名 | origin」（远程名，通常为 origin）；只有远程分支时显示「origin/分支名」。标签内不再显示「分支／远程／Stash」等说明文字，只展示值；引用尽可能全部展示，不再折叠为数量提示，同时限制标签区域宽度以免过度挤压标题。较宽页面在行右侧显示作者和时间。点击历史提交项会在该行下方就地展开提交详情（一次只展开一项，再次点击同一项即可收起），不再使用鼠标悬浮提示浮层。分支线按所属分支贯穿使用同一颜色，节点与其连线颜色一致；支持分支筛选、搜索定位、分页和虚拟列表。在顶部 Git Graph 标签页展示时，会隐藏底部输入框、任务悬浮面板与底部用量数据，并由历史列表在标签页内独立滚动。
- **提交详情**：在历史行下方展开为左右两栏——左栏展示完整 Hash、作者邮箱、完整时间、父提交、标题、提交正文与操作按钮，右栏展示变更文件，可在树状视图和平铺列表之间切换，点击文件查看文本差异；合并提交可选择任一父提交比较；支持复制 Hash、创建分支／标签、切换本地分支或分离 HEAD，以及储藏修改和应用 Stash（保留 Stash）；Stash 详情提供 Drop Stash 按钮，确认后删除储藏记录并刷新历史。
- 两块主区域分别折叠；两块均展开时，可拖动「当前修改」与「Git 历史」之间的分隔条调整历史区块高度，也可聚焦分隔条后按 ↑/↓ 调整（Shift 加大步幅）。调整比例在当前面板挂载期间保留；深色／浅色主题使用 DSH 主题变量；包含中文和英文界面。

Git 仓库由当前 DSH 会话的工作目录确定，可在 Git 项目或其子目录中打开。非 Git 目录会显示提示。手动刷新、重新显示面板、切换窗口回到 DSH 都会刷新 Git 状态。

AI 使用当前会话最近一次请求的模型配置，没有时使用 DSH 默认模型。AI 优先使用暂存区差异；暂存区没有修改时，自动使用工作区差异（含未跟踪文件），并将所选差异发送给该模型。生成结果保留在编辑框中，点击提交才会提交。大差异最多向模型提供 60,000 个字符，并显示截断提醒。

Git 调用通过 DSH subprocess / sandbox 服务执行，遵守当前会话的文件权限；插件不覆盖用户的 Git 配置。提交 hooks 与签名按 Git 自身配置执行，错误会反馈到面板。

## 安装

通过 DSH `plugin_manager` 的 `install_bundle` 安装本目录；不需要 npm 依赖或安装脚本。安装为 profile 持久插件，影响该 profile 的所有会话。升级已加载的版本后按 DSH 安装结果提示重启，以加载新的 Host 模块。

## Agent API

侧栏与 `git_graph` 工具使用同一个 `GitGraphService.execute`，也可调用 `/local-git-graph <JSON>` 会话命令。例：

```json
{"action":"snapshot","limit":100}
{"action":"fetch"}
{"action":"sync"}
{"action":"detail","hash":"<完整提交Hash>"}
{"action":"diff","path":"src/app.js","staged":true}
{"action":"stage","paths":["src/app.js"]}
{"action":"generate","locale":"zh"}
{"action":"pushBranch","name":"main"}
{"action":"pullBranch","name":"main"}
{"action":"deleteBranch","name":"feature"}
{"action":"deleteBranchEverywhere","name":"feature"}
{"action":"deleteRemoteBranch","remoteRef":"refs/remotes/origin/feature"}
{"action":"deleteTag","name":"v1.0.0"}
{"action":"pushTag","name":"v1.0.0"}
{"action":"stashPop","hash":"<完整StashHash>"}
```

写操作包括 stage、unstage、commit、fetch、sync、checkout、switchWorktree、branch、tag、stashSave、stashApply、stashPop、stashDrop，以及 pushBranch、pullBranch、deleteBranch、deleteRemoteBranch、deleteBranchEverywhere、deleteTag、pushTag。switchWorktree 只接受当前仓库已登记的 worktree 路径，并将当前会话工作目录持久切换到该 worktree，不会创建或关联新的 DSH worktree 记录。工具描述要求在用户明确请求后才提交或删除 Stash。stashApply/stashPop/stashDrop 接受完整 Stash Hash，执行时解析当前储藏序号；stashApply 保留储藏，stashPop 应用后删除，stashDrop 直接删除；目标已不存在时返回错误。界面的切换和 Stash 操作显示确认说明。pushBranch 与 pullBranch 均不使用强制推送；pullBranch 仅在当前分支落后且未分叉时做快进更新。deleteBranch 使用 `git branch -d`，拒绝删除当前检出分支、worktree 占用的分支和未合并分支；deleteBranchEverywhere 在删除前额外确认分支提交已并入当前分支，然后删除本地与其远程分支；deleteRemoteBranch 只删除远程分支并保留本地副本；deleteTag 只删除本地标签，pushTag 将本地标签非强制推送到远程。历史列表的右键菜单通过同一套服务执行这些操作。sync 仍保留（仅同步当前分支配置的远程上游），但历史标题栏不再显示同步按钮。没有实现 rebase、cherry-pick、reset 或丢弃修改。

本项目是独立实现，功能参考 VS Code Git Graph 的历史浏览方式；未复制该项目的源代码或图标。

## 验证

```sh
node --test test/*.test.js
node --check index.js
node --check client.js
```

测试使用独立临时仓库覆盖首次提交、暂存与取消暂存、重命名与特殊文件名、合并父节点、分支标签、Stash、路径校验，以及分支／标签的推送、拉取、删除与安全校验，不修改用户仓库。

本次验证结果：74 项自动化测试全部通过，`node --check index.js` 与 `node --check client.js` 通过。右键菜单（提交行常规操作、分支／标签／Stash 标签专属菜单、跟随鼠标定位）、删除确认、当前／未合并分支保护、Stash apply/pop/drop、远程分支与标签推送均在测试中覆盖。

浏览器工具打开当前 DSH 地址时返回登录校验提示，因此实际页面点击、布局与浅色／深色显示尚未目视验证。安装后的中文／英文资源及图标导出已检查。

`icon.svg` 是为本插件绘制的原创 SVG。
