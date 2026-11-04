# DSH Git Graph

DSH 的 Git 工作区和历史插件。会话开始后，可在会话窗口顶部的 Tab 中选择 **Git Graph**，直接在主区域查看当前会话仓库；顶部空间不足时，入口会收进「更多」菜单。也可打开右侧栏，点击「+」进入工具列表，再选择 **Git Graph**；侧栏标签显示 Git Graph 的彩色分支图标。新会话输入框上方显示当前 Git 分支，可切换本地分支或选择已登记的 worktree；切换 worktree 会持久更改当前会话目录，不会新建或删除 worktree。安装 better-sidebar 后，也可在底部工作区 panel 的空白面板入口或「+」菜单中选择 **Git Graph**，在工作区内查看同一套 Git 界面。

- **当前修改**：工作区与暂存区列表，逐个或批量暂存／取消暂存；点击文件查看差异；提交输入框右侧提供 AI Conventional Commits 草稿生成；有暂存修改时仅提交暂存内容，暂存区为空时自动暂存全部改动（含未跟踪文件）后提交；支持 ⌘/Ctrl + Enter 提交。
- **Git 历史**：每条记录以 32px 单行展示引用标签与提交标题，标题保持一行不换行并在过长时省略。分支标签本地与远程合并展示：本地只显示分支名；本地和同名远程分支同时存在时显示「分支名 | origin」（远程名，通常为 origin）；只有远程分支时显示「origin/分支名」。标签内不再显示「分支／远程／Stash」等说明文字，只展示值；引用尽可能全部展示，不再折叠为数量提示，同时限制标签区域宽度以免过度挤压标题。较宽页面在行右侧显示作者和时间。鼠标悬停或键盘聚焦可查看详情浮层，完整展示标题、全部引用、作者邮箱、含时区的提交时间、完整 Hash、父提交与提交正文；浮层可移入阅读和选择文本，支持 Escape 关闭，并自动避让窗口边缘。分支线按所属分支贯穿使用同一颜色，节点与其连线颜色一致；支持分支筛选、搜索定位、分页和虚拟列表。在顶部 Git Graph 标签页展示时，会隐藏底部输入框、任务悬浮面板与底部用量数据，并由历史列表在标签页内独立滚动。
- **提交详情**：完整 Hash、作者邮箱、完整时间、提交正文、变更文件和文本差异；合并提交可选择任一父提交比较；支持复制 Hash、创建分支／标签、切换本地分支或分离 HEAD，以及储藏修改和应用 Stash（保留 Stash）；Stash 详情提供 Drop Stash 按钮，确认后删除储藏记录并刷新历史。
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
{"action":"detail","hash":"<完整提交Hash>"}
{"action":"diff","path":"src/app.js","staged":true}
{"action":"stage","paths":["src/app.js"]}
{"action":"generate","locale":"zh"}
```

写操作包括 stage、unstage、commit、checkout、switchWorktree、branch、tag、stashSave、stashApply、stashDrop。switchWorktree 只接受当前仓库已登记的 worktree 路径，并将当前会话工作目录持久切换到该 worktree，不会创建或关联新的 DSH worktree 记录。工具描述要求在用户明确请求后才提交或删除 Stash。stashDrop 接受完整 Stash Hash，执行时解析当前储藏序号；目标已不存在时返回错误。界面的切换和 Stash 操作显示确认说明。没有实现 push/pull、rebase、cherry-pick、reset、丢弃修改或删除分支／标签。

本项目是独立实现，功能参考 VS Code Git Graph 的历史浏览方式；未复制该项目的源代码或图标。

## 验证

```sh
node --test test/*.test.js
node --check index.js
node --check client.js
```

测试使用独立临时仓库覆盖首次提交、暂存与取消暂存、重命名与特殊文件名、合并父节点、分支标签、Stash 和路径校验，不修改用户仓库。

本次验证结果：19 项集成测试全部通过；DSH 安装返回 `application: applied`，已确认客户端标签注册和 `git_graph` 工具注册。实际运行时通过独立仓库验证状态、详情、暂存、差异和取消暂存，并成功调用会话模型生成 `fix(calculator): 修正加法函数的运算符`。测试仓库已清理，会话目录已恢复。

浏览器工具打开当前 DSH 地址时返回登录校验提示，因此实际页面点击、布局、浅色／深色显示和插件管理器中图标渲染尚未目视验证。安装后的中文／英文资源及图标导出已检查。

`icon.svg` 是为本插件绘制的原创 SVG。
