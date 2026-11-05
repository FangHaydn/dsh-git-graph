window.__ModuleLoader__.load({
  id: '@local/dsh-git-graph',
  factory(require) {
    const React = require('react'), h = React.createElement;
    const { Menu } = require('@deepseek-ai/dsh-client-ui-primitives');
    const { createPortal } = require('react-dom');
    const { useState, useEffect, useRef, useMemo, useCallback, useSyncExternalStore } = React;
    const ROW_HEIGHT = 32;
    const ID = '@local/dsh-git-graph', NS = 'localGitGraph';
    const dictionaries = {
      zh: { gitBranch:'分支', branchLoading:'读取分支…', branchUnavailable:'当前目录不是 Git 仓库', branchSwitching:'切换中…', branchFailed:'切换失败', branchOption:'分支', worktreeOption:'Worktree', worktreeDetached:'分离 HEAD', changes:'当前修改', history:'Git 历史', fetch:'从远程获取', fetching:'正在从远程获取…', fetched:'已获取远程更新', sync:'同步', syncing:'正在同步…', synced:'同步成功', syncUnavailable:'同步功能尚未加载，请完全退出并重新打开 DSH 后重试。', syncAhead:'待推送', syncBehind:'待拉取', operationSuccess:'操作成功', stagedSuccess:'已暂存修改', unstagedSuccess:'已取消暂存', committedSuccess:'提交成功', branchSuccess:'已创建分支', tagSuccess:'已创建标签', checkoutSuccess:'已切换到所选版本', stashSaveSuccess:'已储藏修改', stashApplySuccess:'已应用 Stash', stashDropSuccess:'已删除 Stash', fetchUnavailable:'Fetch 功能尚未加载，请完全退出并重新打开 DSH 后重试。', treeView:'树状视图', listView:'平铺列表', resize:'拖动调整高度', staged:'暂存区', worktree:'工作区', clean:'工作区干净', empty:'暂无提交，暂存文件后创建首次提交。', noRepo:'当前会话目录不是 Git 仓库。切换到项目目录后刷新。', refresh:'刷新', message:'提交信息', placeholder:'输入提交信息（type(scope): description）', generate:'AI 生成', generating:'生成中…', commit:'提交', committing:'提交中…', stage:'暂存', unstage:'取消暂存', stageAll:'全部暂存', unstageAll:'全部取消暂存', loading:'正在读取 Git…', retry:'重试', all:'所有分支', search:'搜索提交标题、作者或 Hash', next:'下一个匹配', more:'加载更多', noChanges:'暂无修改', close:'关闭详情', detail:'提交详情', files:'文件', parent:'比较父提交', root:'首次提交', author:'作者', date:'时间', hash:'Hash', copy:'复制 Hash', copied:'已复制', branch:'分支', tag:'标签', remote:'远程', stash:'Stash', stashSave:'储藏修改', stashApply:'应用 Stash', stashDrop:'Drop Stash', dropConfirm:'将删除此 Stash 的储藏记录，删除后无法从 Stash 列表恢复。确定继续？', stashPop:'Pop Stash（应用并删除）', stashPopConfirm:'将应用此 Stash 的修改并删除该储藏记录。确定继续？', stashPopSuccess:'已应用并删除 Stash', stashMenu:'Stash 操作', name:'名称', commitLabel:'提交', merge:'合并提交', parents:'父提交', messageBody:'提交说明', previewHint:'点击历史项查看文件与差异', createBranch:'创建分支', createTag:'创建标签', checkout:'切换到此提交', checkoutBranch:'切换分支', cancel:'取消', confirm:'确认', detached:'将以分离 HEAD 状态切换到此提交。', applyConfirm:'将 Stash 的修改应用到工作区，保留原 Stash。', saveConfirm:'将工作区和暂存区的修改（含未跟踪文件）保存为 Stash。', checkoutConfirm:'将切换工作区分支，Git 会阻止覆盖有冲突的本地修改。', workingDiff:'工作区差异', stagedDiff:'暂存区差异', noDiff:'没有文本差异，可能是空文件、二进制文件或文件模式变化。', truncated:'内容较大，当前显示已截断。', draftTruncated:'AI 使用的差异已截断，请检查生成的提交信息。', conflict:'冲突', noMatch:'没有匹配的提交', count:'条提交', selection:'选择一条提交查看完整信息和文件差异', title:'标题', newName:'输入名称', error:'操作失败', supported:'分支 · 标签 · Stash', aiHint:'优先根据暂存区差异生成 Conventional Commits；暂存区为空时使用工作区（含未跟踪文件），生成后可编辑。', moreLimit:'已显示 1000 条，请通过分支筛选缩小范围。', actions:'操作', currentBranch:'当前分支', deleteBranch:'删除分支', deleteRemoteBranch:'删除远程分支', deleteBranchEverywhere:'删除本地和远程分支', deleteTag:'删除标签', pushBranch:'推送分支', pullBranch:'拉取分支', pushTag:'推送标签', branchDeleted:'已删除分支', remoteBranchDeleted:'已删除远程分支', branchDeletedEverywhere:'已删除本地和远程分支', branchPushed:'已推送分支', pulled:'已拉取分支', tagDeleted:'已删除标签', tagPushed:'已推送标签', deleteBranchConfirm:'将删除本地分支；未合并的分支会被 Git 拒绝删除，不会丢失提交。确定继续？', deleteRemoteBranchConfirm:'将从远程仓库删除该分支，可能影响其他协作者。确定继续？', deleteBranchEverywhereConfirm:'将删除本地分支及其远程分支；若该分支含有尚未并入当前分支的提交，整个操作会被拒绝。确定继续？', deleteTagConfirm:'将删除本地标签，确定继续？', pushTagHint:'将本地标签推送到远程仓库。', pushBranchHint:'将本地分支推送到远程仓库，不会强制推送。', pullBranchHint:'从上游拉取并以快进方式更新当前分支。', },
      en: { gitBranch:'Branch', branchLoading:'Reading branches…', branchUnavailable:'Not a Git repository', branchSwitching:'Switching…', branchFailed:'Could not switch', branchOption:'Branch', worktreeOption:'Worktree', worktreeDetached:'Detached HEAD', changes:'Changes', history:'Git History', fetch:'Fetch from remote', fetching:'Fetching from remote…', fetched:'Remote updates fetched', sync:'Sync', syncing:'Syncing…', synced:'Branch synced', syncUnavailable:'Sync is not loaded yet. Fully quit and reopen DSH, then try again.', syncAhead:'to push', syncBehind:'to pull', operationSuccess:'Operation completed', stagedSuccess:'Changes staged', unstagedSuccess:'Changes unstaged', committedSuccess:'Commit created', branchSuccess:'Branch created', tagSuccess:'Tag created', checkoutSuccess:'Checkout completed', stashSaveSuccess:'Changes stashed', stashApplySuccess:'Stash applied', stashDropSuccess:'Stash deleted', fetchUnavailable:'Fetch is not loaded yet. Fully quit and reopen DSH, then try again.', treeView:'Tree view', listView:'Flat list', resize:'Drag to resize', staged:'Staged Changes', worktree:'Working Tree', clean:'Working tree clean', empty:'No commits yet. Stage files to create the first commit.', noRepo:'The session directory is not a Git repository. Switch to a project directory and refresh.', refresh:'Refresh', message:'Commit message', placeholder:'Enter a commit message (type(scope): description)', generate:'AI Generate', generating:'Generating…', commit:'Commit', committing:'Committing…', stage:'Stage', unstage:'Unstage', stageAll:'Stage All', unstageAll:'Unstage All', loading:'Reading Git…', retry:'Retry', all:'All branches', search:'Search title, author or hash', next:'Next match', more:'Load more', noChanges:'No changes', close:'Close details', detail:'Commit Details', files:'Files', parent:'Compare parent', root:'Root commit', author:'Author', date:'Date', hash:'Hash', copy:'Copy hash', copied:'Copied', branch:'Branch', tag:'Tag', remote:'Remote', stash:'Stash', stashSave:'Stash changes', stashApply:'Apply stash', stashDrop:'Drop Stash', dropConfirm:'Delete this saved stash? It cannot be restored from the stash list.', stashPop:'Pop Stash (apply and drop)', stashPopConfirm:'Apply this stash and delete the stash entry. Continue?', stashPopSuccess:'Stash applied and dropped', stashMenu:'Stash actions', name:'Name', commitLabel:'Commit', merge:'Merge commit', parents:'Parents', messageBody:'Commit message', previewHint:'Click a history row to view files and diffs', createBranch:'Create branch', createTag:'Create tag', checkout:'Check out commit', checkoutBranch:'Switch branch', cancel:'Cancel', confirm:'Confirm', detached:'This checks out the commit with a detached HEAD.', applyConfirm:'Apply the stash to the working tree and keep the original stash.', saveConfirm:'Save staged and working changes, including untracked files, as a stash.', checkoutConfirm:'Switch the working branch. Git will refuse to overwrite conflicting local changes.', workingDiff:'Working Tree Diff', stagedDiff:'Staged Diff', noDiff:'No text diff. This may be an empty or binary file, or a mode change.', truncated:'Large content has been truncated.', draftTruncated:'The AI diff was truncated. Review the generated commit message.', conflict:'Conflict', noMatch:'No matching commits', count:'commits', selection:'Select a commit to view its details and file diffs', title:'Title', newName:'Enter a name', error:'Operation failed', supported:'Branches · Tags · Stashes', aiHint:'Generate an editable Conventional Commits draft from staged changes, or working tree changes (including untracked files) when nothing is staged.', moreLimit:'Showing 1000 commits. Filter by branch to narrow the history.', actions:'Actions', currentBranch:'current', deleteBranch:'Delete branch', deleteRemoteBranch:'Delete remote branch', deleteBranchEverywhere:'Delete local and remote branch', deleteTag:'Delete tag', pushBranch:'Push branch', pullBranch:'Pull branch', pushTag:'Push tag', branchDeleted:'Branch deleted', remoteBranchDeleted:'Remote branch deleted', branchDeletedEverywhere:'Local and remote branch deleted', branchPushed:'Branch pushed', pulled:'Branch pulled', tagDeleted:'Tag deleted', tagPushed:'Tag pushed', deleteBranchConfirm:'Delete this local branch. Git refuses to delete an unmerged branch, so commits are not lost. Continue?', deleteRemoteBranchConfirm:'Delete this branch from the remote. This can affect collaborators. Continue?', deleteBranchEverywhereConfirm:'Delete the local branch and its remote branch. If the branch has commits that are not merged into the current branch, the whole operation is refused. Continue?', deleteTagConfirm:'Delete this local tag. Continue?', pushTagHint:'Push the local tag to the remote.', pushBranchHint:'Push the local branch to the remote without forcing.', pullBranchHint:'Fetch from upstream and fast-forward the current branch.', },
    };
    // Independent artwork inspired by Git Graph's blue / magenta / green graph motif.
    function GraphIcon({size = 18, className}) {
      return h('svg', {width:size,height:size,viewBox:'0 0 24 24',fill:'none',strokeWidth:1.8,strokeLinecap:'round',className,'aria-hidden':true},
        h('path',{d:'M4 2v20',stroke:'var(--gg-lane-0,#0085d9)'}),
        h('path',{d:'M12 2v8m0 7v5',stroke:'var(--gg-lane-1,#d9008f)'}),
        h('path',{d:'M4 9c0 7 16 1 16 9v4',stroke:'var(--gg-lane-2,#20b85a)'}),
        ...[[4,9,'var(--gg-lane-0,#0085d9)'],[12,4,'var(--gg-lane-1,#d9008f)'],[20,18,'var(--gg-lane-2,#20b85a)']].map(([cx,cy,fill],i)=>h('circle',{key:i,cx,cy,r:2.7,fill,stroke:'none'})));
    }
    const iconPaths = {
      refresh:'M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.6-2L20 8M4 16l2.3 3A7 7 0 0 0 17.9 17',
      reload:'M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10',
      sync:'M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4',
      fetch:'M7 17H6a4 4 0 0 1-1-7.9 7 7 0 0 1 13.7-1A4.5 4.5 0 0 1 18 17h-1M12 11v10m-3-3 3 3 3-3',
      spinner:'M21 12a9 9 0 1 1-9-9',
      close:'m6 6 12 12M6 18 18 6', plus:'M12 5v14M5 12h14', minus:'M5 12h14',
      chevronRight:'m9 5 7 7-7 7', chevronDown:'m5 9 7 7 7-7',
      branch:'M6 7v10M18 7v3c0 4-12 0-12 5M8 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0M8 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0M20 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
      tag:'M3 3h8l10 10-8 8L3 11V3ZM7 7h.01',
      remote:'M7 17H6a4 4 0 0 1-1-7.9 7 7 0 0 1 13.7-1A4.5 4.5 0 0 1 18 17h-1M12 21V11m-3 3 3-3 3 3',
      stash:'M4 8h16v13H4V8ZM3 3h18v5H3V3Zm6 9h6',
      trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
      search:'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
      next:'M12 4v16m-6-6 6 6 6-6',
      sparkle:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4m-2-2h4',
      check:'m5 12 4 4L19 6', copy:'M8 8h13v13H8V8ZM16 5V3H3v13h2',
      checkout:'M14 4h6v16h-6M3 12h12m-5-5 5 5-5 5',
      commit:'M3 12h5m8 0h5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
      folder:'M3 7V4h6l2 3h10v13H3V7Z', tree:'M4 3v14h5M4 7h5M10 4h10v6H10V4ZM10 14h10v6H10v-6Z', list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
      file:'M5 2h9l5 5v15H5V2Zm9 0v6h5',
    };
    function Icon({name,size = 16,className = ''}) {
      return h('svg',{className:'gg-icon '+className,width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},h('path',{d:iconPaths[name]}));
    }
    // Git Graph's twelve-colour sequence, blended with the theme foreground for contrast.
    const laneColors = ['#0085d9','#d9008f','#00d90a','#d98500','#a300d9','#ff0000','#00d9cc','#e138e8','#85d900','#dc5b23','#6f24d6','#ffcc00'];
    const laneColor = index => `var(--gg-lane-${index})`;
    const branchCss = `
div:has(> [data-slot="conversation.hero.options"] .gg-branch-selector){margin-left:0}
.gg-branch-button{display:inline-flex;align-items:center;gap:4px;min-height:28px;min-width:0;max-width:min(240px,36vw);padding:0 8px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;font-weight:500;line-height:20px;white-space:nowrap;cursor:pointer}
.gg-branch-button:not(:disabled):hover,.gg-branch-button[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover)}
.gg-branch-button:disabled{cursor:default;color:var(--dsw-alias-label-quaternary)}
.gg-branch-button:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}
.gg-branch-button .gg-icon{flex:none}
`;
    const css = `
.dgg{--gg-bg:var(--dsw-alias-bg-base);--gg-fg:var(--dsw-alias-label-primary);--gg-muted:var(--dsw-alias-label-secondary);--gg-line:color-mix(in srgb,var(--gg-fg) 16%,var(--gg-bg));--gg-divider:color-mix(in srgb,var(--gg-fg) 8%,var(--gg-bg));--gg-canvas:color-mix(in srgb,var(--gg-fg) 4%,var(--gg-bg));--gg-surface:var(--gg-bg);--gg-section-head:color-mix(in srgb,var(--gg-fg) 6%,var(--gg-bg));--gg-accent:var(--gg-lane-0);--gg-button:#0075bf;--gg-button-fg:#fff;--gg-hover:color-mix(in srgb,var(--gg-fg) 6%,var(--gg-bg));--gg-selected:color-mix(in srgb,var(--gg-accent) 14%,var(--gg-bg));--gg-match:color-mix(in srgb,var(--gg-lane-3) 12%,var(--gg-bg));--gg-added:var(--dsw-alias-state-success-primary);--gg-deleted:var(--dsw-alias-state-error-primary);--gg-modified:var(--dsw-alias-state-warn-primary);${laneColors.map((color,i)=>`--gg-lane-${i}:color-mix(in srgb,${color} ${[2,6,8,11].includes(i)?68:82}%,var(--gg-fg));`).join('')}display:flex;flex-direction:column;height:100%;min-height:0;min-width:0;color:var(--gg-fg);background:var(--gg-bg);font-family:inherit;font-size:13px;line-height:1.5;overflow:hidden;container-type:inline-size}
.dgg *{box-sizing:border-box}
.dgg button,.dgg input,.dgg textarea,.dgg select{font:inherit;color:inherit}
.dgg button{cursor:pointer;border:1px solid transparent;background:transparent;border-radius:6px;padding:5px 8px;min-height:28px;display:inline-flex;align-items:center;justify-content:center;gap:5px;transition:background .15s}
.dgg button:hover{background:var(--dsw-alias-bg-layer-2)}
.dgg button:disabled{cursor:default;opacity:.45}
.dgg :is(button,input,textarea,select):focus-visible{outline:2px solid var(--gg-accent);outline-offset:1px}
.dgg input,.dgg textarea,.dgg select{min-width:0;max-width:100%;border:1px solid var(--dsw-alias-border-l2);background:var(--gg-bg);border-radius:6px;padding:6px 8px}
.dgg textarea{resize:none;width:100%;line-height:1.5}
.dgg .gg-primary{background:var(--gg-button);color:var(--gg-button-fg);font-weight:600}
.dgg .gg-primary:hover{background:var(--gg-button);filter:brightness(.95)}
.dgg .gg-current-branch{display:inline-flex;align-items:center;gap:4px;min-width:0;color:var(--gg-muted);font-size:12px;font-weight:500}
.dgg .gg-current-branch>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dgg .gg-changes>.gg-head>button{flex-shrink:0}
.dgg .gg-changes>.gg-head>button:first-child{min-width:0;white-space:nowrap;flex-shrink:1}
.dgg .gg-changes>.gg-head .gg-count{flex-shrink:0}
.dgg .gg-muted{color:var(--gg-muted)}
.dgg .gg-small{font-size:12px}
.dgg .gg-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.dgg .gg-head{display:flex;align-items:center;gap:6px;min-height:38px;padding:4px 8px;border-bottom:1px solid var(--gg-line);background:var(--gg-section-head);flex:none}
.dgg .gg-folded>.gg-head{border-bottom:0}
.dgg .gg-head>button:first-child{flex:1;justify-content:flex-start;gap:8px;font-weight:650}
.dgg :is(.gg-changes,.gg-history)>.gg-head>button:first-child:hover{background:transparent}
.dgg .gg-head>span:first-child{font-weight:600}
.dgg .gg-chevron{color:var(--gg-muted)}
.dgg .gg-head>button{min-height:28px;padding:3px 6px}
.dgg .gg-count{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:18px;font-size:11px;line-height:16px;padding:0 5px;border:1px solid var(--gg-line);border-radius:5px;background:var(--gg-surface);color:var(--gg-muted);font-weight:500;font-variant-numeric:tabular-nums}
.dgg .gg-main{flex:1;min-height:0;display:flex;flex-direction:column;padding:12px;background:var(--gg-canvas);overflow:auto;overscroll-behavior:contain}
.dgg .gg-changes,.dgg .gg-history{border:1px solid var(--gg-line);border-radius:10px;background:var(--gg-surface);overflow:hidden}
.dgg .gg-changes+.gg-history{margin-top:10px}
.dgg .gg-changes{flex:0 0 auto;max-height:48%;display:flex;flex-direction:column;min-height:0}
.dgg .gg-changes.gg-folded{max-height:none}
.dgg .gg-resizer{flex:none;height:12px;min-height:12px;cursor:row-resize;position:relative;display:flex;align-items:center;justify-content:center;touch-action:none;background:transparent;border:0;padding:0;user-select:none}
.dgg .gg-resizer::after{content:"";width:44px;height:3px;border-radius:2px;background:var(--gg-line);transition:background .15s}
.dgg .gg-resizer:hover::after,.dgg .gg-resizer:focus-visible::after,.dgg.gg-resizing .gg-resizer::after{background:var(--gg-accent)}
.dgg .gg-resizer:focus-visible{outline:2px solid var(--gg-accent);outline-offset:-2px}
.dgg.gg-resizing{cursor:row-resize}
.dgg.gg-resizing *{cursor:row-resize!important;user-select:none!important}
.dgg .gg-changes-body{overflow:auto;min-height:0;padding:12px}
.dgg .gg-compose{display:flex;align-items:flex-start;gap:8px;margin:0 0 12px;min-width:0}
.dgg .gg-message-row{position:relative;display:flex;flex:1;min-width:0;height:32px;margin:0;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--gg-surface)}
.dgg .gg-message-row:focus-within{outline:2px solid var(--gg-accent);outline-offset:1px}
.dgg .gg-message-row textarea{flex:1;height:30px;min-height:30px;border:0;border-radius:inherit;background:transparent;padding:5px 36px 5px 8px;line-height:20px}
.dgg .gg-message-row textarea:focus-visible{outline:none}
.dgg .gg-message-row textarea::placeholder{color:var(--gg-muted);opacity:1}
.dgg .gg-ai{position:absolute;top:2px;right:2px;width:26px;height:26px;min-height:26px;padding:0;border-radius:4px;color:var(--gg-muted)}
@keyframes gg-twinkle{0%,100%{opacity:.5;transform:scale(.8) rotate(-8deg)}50%{opacity:1;transform:scale(1.2) rotate(8deg)}}
.dgg .gg-ai.gg-generating{color:var(--gg-accent);opacity:1}
.dgg .gg-ai.gg-generating .gg-icon{animation:gg-twinkle 1s ease-in-out infinite;transform-origin:center}
.dgg .gg-commit{flex:none;width:104px;height:32px;min-height:32px;margin:0;padding:0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dgg .gg-file-group{border:1px solid var(--gg-divider);border-radius:7px;overflow:hidden}
.dgg .gg-file-group+.gg-file-group{margin-top:10px}
.dgg .gg-group-head{display:flex;align-items:center;font-size:12px;padding:3px 6px 3px 10px;gap:6px;background:var(--gg-canvas);border-bottom:1px solid var(--gg-divider)}
.dgg .gg-group-head>span{display:flex;align-items:center;gap:6px;flex:1;font-weight:600}
.dgg .gg-file-group>.gg-file{padding:2px 4px}
.dgg .gg-file-group>.gg-file+.gg-file{border-top:1px solid var(--gg-divider)}
.dgg .gg-group-empty{padding:8px 10px;color:var(--gg-muted);font-size:12px}
.dgg .gg-file:has(.gg-file-main:hover){background:var(--gg-hover)}
.dgg .gg-file-group>.gg-file:hover{background:color-mix(in srgb,var(--gg-fg) 12%,var(--gg-surface))}
.dgg .gg-file-group>.gg-file>.gg-file-main:hover{background:transparent}
.dgg .gg-file{display:flex;align-items:center;gap:5px;min-width:0;padding:1px 0}
.dgg .gg-file-main{flex:1!important;min-width:0;justify-content:flex-start!important;text-align:left}
.dgg .gg-file-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dgg .gg-icon{display:inline-block;flex:none;vertical-align:middle}
@keyframes gg-spin{to{transform:rotate(360deg)}}
.dgg .gg-spinning{animation:gg-spin 1s linear infinite}
.dgg .gg-status{width:20px;flex:none;font:600 11px ui-monospace,monospace;text-align:center;color:var(--gg-muted)}
.dgg .gg-status[data-status=A],.dgg .gg-status[data-status="?"]{color:var(--gg-added)}
.dgg .gg-status[data-status=M],.dgg .gg-status[data-status=R]{color:var(--gg-modified)}
.dgg .gg-status[data-status=D],.dgg .gg-status.gg-conflict{color:var(--gg-deleted)}
.dgg .gg-status[data-status=C]{color:var(--gg-accent)}
.dgg .gg-empty{padding:24px 16px;text-align:center;color:var(--gg-muted)}
.dgg .gg-history{flex:1 1 0%;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.dgg .gg-history.gg-folded{flex:none}
.dgg .gg-filters{display:flex;flex-wrap:nowrap;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--gg-line);flex:none;min-width:0}
.dgg .gg-filters select,.dgg .gg-search input,.dgg .gg-search button{height:32px;min-height:32px;padding:0 8px;font-size:13px;line-height:1.5;border-radius:6px}
.dgg .gg-filters select{width:auto;max-width:45%;flex:0 1 auto}
.dgg .gg-search{display:flex;flex:1;gap:4px;min-width:0;align-items:center}
.dgg .gg-search input{flex:1;min-width:0}
.dgg .gg-search button{flex:none;width:32px;padding:0}
.dgg .gg-scroll{overflow:auto;flex:1 1 0%;min-height:64px;position:relative;overscroll-behavior:contain}
.dgg .gg-row{position:absolute;left:0;right:0;height:${ROW_HEIGHT}px;display:flex;align-items:center;border-radius:0!important;border-bottom:1px solid var(--gg-divider)!important;padding:0 12px 0 6px!important;justify-content:flex-start!important;text-align:left;width:100%;gap:8px!important}
.dgg .gg-row.gg-match{background:var(--gg-match)}
.dgg .gg-row:hover{background:var(--gg-hover)}
.dgg .gg-row[aria-pressed=true]{background:var(--gg-selected);box-shadow:inset 2px 0 var(--gg-accent)}
.dgg .gg-row:focus-visible{outline-offset:-2px}
.dgg .gg-graph{flex:none;overflow:visible;height:${ROW_HEIGHT}px}
.dgg .gg-commit-line{flex:1;min-width:0;display:flex;align-items:center;gap:6px;overflow:hidden}
.dgg .gg-subject{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:500}
.dgg .gg-badges{display:flex;gap:4px;overflow:hidden;min-width:0;min-height:0;flex:none}
.dgg .gg-badge{display:inline-flex;align-items:center;gap:3px;flex-shrink:0;font-size:10px;line-height:16px;border:1px solid color-mix(in srgb,var(--gg-ref-color) 65%,var(--gg-line));background:color-mix(in srgb,var(--gg-ref-color) 10%,var(--gg-bg));border-radius:3px;padding:0 4px;max-width:180px;white-space:nowrap;color:var(--gg-fg)}
.dgg .gg-badge .gg-icon{color:var(--gg-ref-color)}
.dgg .gg-badge-label{overflow:hidden;text-overflow:ellipsis}
.dgg .gg-badge[data-kind=remote]{border-style:dashed}
.dgg .gg-badge[data-kind=head]{font-weight:700;border-color:var(--gg-ref-color);background:color-mix(in srgb,var(--gg-ref-color) 20%,var(--gg-bg))}
.dgg .gg-badges-compact{max-width:56%;flex:0 1 auto;align-items:center;overflow:hidden}
.dgg .gg-badges-compact .gg-badge{max-width:180px;min-width:28px;flex:0 1 auto}
.dgg .gg-meta{display:none;flex:none;align-items:center;gap:12px;font-size:11px;color:var(--gg-muted);white-space:nowrap}
.dgg .gg-author{max-width:140px;overflow:hidden;text-overflow:ellipsis}
.dgg .gg-time{font-variant-numeric:tabular-nums}
.dgg .gg-details{border-top:1px solid var(--gg-line);max-height:45%;min-height:120px;display:flex;flex-direction:column;flex:0 1 auto;overflow:hidden}
.dgg .gg-details.gg-inline-details{position:absolute;left:0;right:0;height:360px;max-height:none;border-bottom:1px solid var(--gg-line);background:var(--gg-canvas);box-shadow:inset 3px 0 var(--gg-accent);overflow:hidden}
.dgg .gg-detail-body{padding:10px 12px;min-height:0;overflow:auto}
.dgg .gg-inline-details>.gg-detail-body{padding:0;flex:1}
.dgg .gg-detail-columns{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);height:100%;min-height:0}
.dgg .gg-detail-info,.dgg .gg-detail-files{min-width:0;min-height:0;overflow:auto;padding:12px 16px}
.dgg .gg-detail-files{border-left:1px solid var(--gg-line);background:var(--gg-surface)}
.dgg .gg-file-tools{display:flex;align-items:center;gap:4px;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid var(--gg-divider)}
.dgg .gg-file-tools>span{flex:1;font-weight:600}
.dgg .gg-file-tools button[aria-pressed=true]{background:var(--gg-selected);color:var(--gg-accent)}
.dgg .gg-tree-folder{margin:0 0 0 14px}
.dgg .gg-tree-folder>summary{cursor:pointer;overflow-wrap:anywhere;padding:3px 0}
.dgg .gg-tree-root>.gg-tree-folder{margin-left:0}
.dgg .gg-detail-files .gg-file-main{width:100%}
.dgg .gg-detail-files .gg-file-label{white-space:normal;overflow-wrap:anywhere;text-align:left}
@container(max-width:520px){.dgg .gg-detail-columns{grid-template-columns:1fr;height:auto}.dgg .gg-detail-files{border-left:0;border-top:1px solid var(--gg-line)}}
.dgg .gg-detail-title{font-size:13px;font-weight:600;margin:0 0 8px;overflow-wrap:anywhere}
.dgg .gg-kv{display:grid;grid-template-columns:55px minmax(0,1fr);align-items:center;gap:4px 8px;margin:8px 0;font-size:11px}
.dgg .gg-kv dt{color:var(--gg-muted)}
.dgg .gg-kv dd{margin:0;overflow-wrap:anywhere}
.dgg .gg-hash{display:flex;align-items:center;gap:4px;min-width:0}
.dgg .gg-hash>span{min-width:0}
.dgg .gg-hash>button{flex:none}
.dgg .gg-body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}
.dgg .gg-detail-actions{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0;padding-top:12px;border-top:1px solid var(--gg-line)}
.dgg .gg-detail-actions button{border-color:var(--gg-line);font-size:11px}
.dgg .gg-danger{color:var(--dsw-alias-state-error-primary)}
.dgg .gg-diff{margin:8px 0;padding:8px;background:var(--gg-surface);border:1px solid var(--gg-line);border-radius:6px;overflow:auto;max-height:320px;font:11px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;tab-size:4;white-space:pre}
.dgg .gg-diff-line{display:block;min-height:1.6em}
.dgg .gg-added{color:var(--dsw-alias-state-success-primary)}
.dgg .gg-deleted{color:var(--dsw-alias-state-error-primary)}
.dgg .gg-hunk{color:var(--gg-accent)}
.dgg .gg-notice{padding:7px 12px;font-size:12px;overflow-wrap:anywhere;flex:none;display:flex;align-items:flex-start;gap:6px;border-bottom:1px solid var(--gg-line)}
.gg-toast-portal{position:fixed;z-index:1000;right:16px;bottom:16px;max-width:min(360px,calc(100vw - 32px));padding:10px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base));color:var(--dsw-alias-label-primary);box-shadow:0 6px 24px color-mix(in srgb,#000 22%,transparent);font:inherit;font-size:13px;line-height:1.5;overflow-wrap:anywhere;animation:gg-toast-in .16s ease-out}
@keyframes gg-toast-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.gg-toast-portal{animation:none}}
.dgg .gg-notice>span{flex:1}
.dgg .gg-notice[data-error=true]{color:var(--dsw-alias-state-error-primary)}
.dgg.gg-modal-overlay{position:fixed;inset:0;z-index:200;display:flex;flex-direction:row;align-items:center;justify-content:center;height:auto;min-height:0;padding:16px;background:color-mix(in srgb,var(--gg-fg) 42%,transparent);overflow:auto;container-type:normal;animation:gg-fade-in .12s ease-out}
.dgg .gg-modal{width:min(400px,calc(100vw - 32px));max-width:100%;max-height:calc(100dvh - 32px);overflow:auto;display:flex;flex-direction:column;gap:12px;padding:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1,var(--gg-bg));box-shadow:0 16px 48px color-mix(in srgb,var(--gg-fg) 26%,transparent);font-size:13px;user-select:text;animation:gg-pop-in .14s ease-out}
.dgg .gg-modal-title{font-size:14px;font-weight:600;line-height:1.4}
.dgg .gg-modal-desc{line-height:1.5}
.dgg .gg-modal-field{display:flex;flex-direction:column;gap:6px}
.dgg .gg-modal-field input{width:100%}
.dgg .gg-dialog-actions{display:flex;justify-content:flex-end;gap:6px;margin-top:2px}
.dgg.gg-menu-overlay{position:fixed;inset:0;z-index:250;background:transparent;container-type:normal}
.dgg .gg-context-menu{position:fixed;min-width:190px;max-width:min(320px,calc(100vw - 16px));max-height:calc(100dvh - 16px);overflow:auto;padding:4px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1,var(--gg-bg));box-shadow:0 10px 32px color-mix(in srgb,var(--gg-fg) 24%,transparent);font-size:13px;user-select:none;animation:gg-pop-in .12s ease-out}
.dgg .gg-menu-heading{padding:5px 8px 3px;font-size:11px;font-weight:600;color:var(--gg-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dgg .gg-menu-heading:not(:first-child){margin-top:4px;padding-top:7px;border-top:1px solid var(--gg-divider)}
.dgg .gg-menu-item{display:flex;align-items:center;justify-content:flex-start;gap:8px;width:100%;min-height:28px;padding:5px 8px;border-radius:6px;text-align:left;white-space:nowrap}
.dgg .gg-menu-item:hover{background:var(--gg-hover)}
.dgg .gg-menu-item:disabled{opacity:.45;cursor:default;background:transparent}
.dgg .gg-menu-item.gg-danger{color:var(--dsw-alias-state-error-primary)}
.dgg .gg-menu-label{overflow:hidden;text-overflow:ellipsis}
@keyframes gg-fade-in{from{opacity:0}to{opacity:1}}
@keyframes gg-pop-in{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:none}}
.dgg .gg-footer{padding:6px 12px;text-align:center;border-top:1px solid var(--gg-line);flex:none}
.dgg .gg-chevron{font-size:12px;display:inline-block;width:12px}
.dgg .gg-loading{color:var(--gg-muted);padding:10px 12px}
.dgg .gg-path{overflow-wrap:anywhere}
.dgg .gg-parent{width:100%;margin:6px 0}
.dgg .gg-diff summary{cursor:pointer}
@container(max-width:400px){.dgg .gg-main{padding:8px}.dgg .gg-changes-body,.dgg .gg-filters{padding:8px}.dgg .gg-commit{width:76px}.dgg .gg-row{gap:4px!important;padding-right:6px!important}}
@container(max-width:280px){.dgg .gg-compose{flex-wrap:wrap}.dgg .gg-message-row{flex-basis:100%}.dgg .gg-commit{width:100%}.dgg .gg-filters{flex-wrap:wrap}.dgg .gg-filters select{max-width:100%}.dgg .gg-search{flex-basis:100%}}
@container(min-width:720px){.dgg .gg-meta{display:flex}.dgg .gg-badges-compact{max-width:48%}}
@media(prefers-reduced-motion:reduce){.dgg *{transition:none!important;animation:none!important}}
/* In the main "Git Graph" conversation tab the view owns the whole viewport and its
   own scrolling; hide the chat composer, floating task dock and the bottom usage meter. */
[data-conversation-content]:has([data-slot="conversation.view"] .dgg) [data-conversation-region="composer"]{display:none!important}
[data-conversation-content]:has([data-slot="conversation.view"] .dgg) [data-conversation-scroll]{overflow:hidden!important}
[data-conversation-content]:has([data-slot="conversation.view"] .dgg) [data-conversation-scroll] > [data-slot="conversation.session"] > div{flex:1 1 0!important;min-height:0!important;overflow:hidden!important}
`;
    // Colour a commit by its branch, not by lane order: follow each ref's first-parent
    // chain so a branch keeps one colour for its whole line. Refs win over merge-only
    // branches; anything still uncoloured gets its own colour in topological order.
    function commitColors(commits, refs, branch) {
      const byHash = new Map(commits.map(commit => [commit.hash, commit])), color = new Map();
      let serial = 0;
      const paint = start => {
        if (!start || !byHash.has(start) || color.has(start)) return;
        const index = serial++ % laneColors.length;
        for (let hash = start; hash && byHash.has(hash) && !color.has(hash); hash = byHash.get(hash).parents[0]) color.set(hash, index);
      };
      const kindRank = ref => ref.kind === 'branch' ? 0 : ref.kind === 'remote' ? 1 : 2;
      const headRef = refs.find(ref => ref.kind === 'branch' && ref.name === branch);
      const ordered = [...refs].sort((a,b) => a === headRef ? -1 : b === headRef ? 1 : (kindRank(a) - kindRank(b)) || a.name.localeCompare(b.name));
      ordered.forEach(ref => paint(ref.hash));
      commits.forEach(commit => { for (let i = 1; i < commit.parents.length; i++) paint(commit.parents[i]); });
      commits.forEach(commit => paint(commit.hash));
      return color;
    }
    // Lanes own their colour until they reach their target commit. Different branches
    // can target the same ancestor without joining early or moving past other nodes.
    function layoutGraph(commits, refs = [], branch) {
      const colorOf = commitColors(commits, refs, branch);
      let lanes = [], width = 1;
      const rows = commits.map(commit => {
        const color = colorOf.get(commit.hash) || 0;
        let column = lanes.findIndex(l => l?.hash === commit.hash && l.color === color);
        if (column < 0) column = lanes.findIndex(l => l?.hash === commit.hash);
        if (column < 0) { column = lanes.indexOf(null); if (column < 0) column = lanes.length; }
        const incoming = lanes;
        const next = lanes.map(l => l?.hash === commit.hash ? null : l);
        const edges = [];
        incoming.forEach((lane,index) => {
          if (!lane) return;
          if (lane.hash === commit.hash) edges.push({x1:index,y1:0,x2:column,y2:ROW_HEIGHT/2,color:lane.color});
          else edges.push({x1:index,y1:0,x2:index,y2:ROW_HEIGHT,color:lane.color});
        });
        commit.parents.forEach((hash,index) => {
          const parentColor = index === 0 ? color : (colorOf.get(hash) || 0);
          let target = next.findIndex(l => l?.hash === hash && l.color === parentColor);
          if (target < 0) {
            target = index === 0 ? column : next.findIndex((l,i) => !l && i > column);
            if (target < 0) target = next.length;
            next[target] = {hash,color:parentColor};
          }
          edges.push({x1:column,y1:ROW_HEIGHT/2,x2:target,y2:ROW_HEIGHT,color:parentColor});
        });
        while (next.length && !next[next.length-1]) next.pop();
        width=Math.max(width,incoming.length,next.length,column+1); lanes=next;
        return {column,color,edges};
      });
      return {rows,width};
    }
    function Graph({row,width,head}) {
      const spacing = 20, x = n => 9+n*spacing;
      return h('svg',{className:'gg-graph',width:width*spacing+4,height:ROW_HEIGHT,viewBox:`0 0 ${width*spacing+4} ${ROW_HEIGHT}`,'aria-hidden':true},
        ...row.edges.map((edge,i)=>h('path',{key:i,d:`M${x(edge.x1)} ${edge.y1} C${x(edge.x1)} ${(edge.y1+edge.y2)/2} ${x(edge.x2)} ${(edge.y1+edge.y2)/2} ${x(edge.x2)} ${edge.y2}`,fill:'none',stroke:laneColor(edge.color),strokeWidth:2})),
        h('circle',{cx:x(row.column),cy:ROW_HEIGHT/2,r:head?5:3.5,fill:'var(--gg-bg)',stroke:laneColor(row.color),strokeWidth:2}),
        head&&h('circle',{cx:x(row.column),cy:ROW_HEIGHT/2,r:2,fill:laneColor(row.color)}));
    }
    // Fold a same-named local branch and its remote-tracking branch into one label
    // (for example "main | origin") instead of showing "main" and "origin/main"
    // separately. Remote-only branches keep their "origin/branch" form.
    function displayRefs(items) {
      const branches = items.filter(item => item.kind === 'branch');
      const remotes = items.filter(item => item.kind === 'remote');
      const rest = items.filter(item => item.kind !== 'branch' && item.kind !== 'remote');
      const remotesByBranch = new Map(), usedRemotes = new Set();
      for (const remote of remotes) {
        const slash = remote.name.indexOf('/');
        const remoteName = slash < 0 ? remote.name : remote.name.slice(0, slash);
        const branchName = slash < 0 ? remote.name : remote.name.slice(slash + 1);
        if (!remotesByBranch.has(branchName)) remotesByBranch.set(branchName, []);
        remotesByBranch.get(branchName).push({ remote, remoteName });
      }
      const result = [];
      for (const branch of branches) {
        const matches = remotesByBranch.get(branch.name) || [];
        if (!matches.length) { result.push({ kind: branch.kind, name: branch.name, label: branch.name }); continue; }
        matches.forEach(match => usedRemotes.add(match.remote));
        const remoteNames = [...new Set(matches.map(match => match.remoteName))];
        result.push({ kind: branch.kind, name: branch.name, label: branch.name + ' | ' + remoteNames.join(', ') });
      }
      for (const remote of remotes) {
        if (usedRemotes.has(remote)) continue;
        result.push({ kind: remote.kind, name: remote.name, label: remote.name });
      }
      for (const item of rest) result.push({ kind: item.kind, name: item.name, label: item.name });
      return result;
    }
    function RefBadges({items,head,color,t,compact=false,onRefContextMenu}) {
      const display = displayRefs(items);
      const all = head ? [{kind:'head',name:'HEAD',label:'HEAD'}, ...display] : display;
      if(!all.length)return null;
      return h('span',{className:'gg-badges'+(compact?' gg-badges-compact':'')},...all.map((item,index)=>{
        const original=item.kind==='head'?null:items.find(source=>source.kind===item.kind&&source.name===item.name);
        const handleContext=original&&onRefContextMenu?event=>{event.preventDefault?.();event.stopPropagation?.();onRefContextMenu(event,original);}:undefined;
        return h('span',{key:item.kind+item.name,className:'gg-badge','data-kind':item.kind,title:item.label,onContextMenu:handleContext,style:{'--gg-ref-color':laneColor(item.kind==='head'?color:index%laneColors.length)},'aria-label':item.kind==='head'?'HEAD':t(item.kind)+': '+item.label},h(Icon,{name:item.kind==='head'?'commit':item.kind==='tag'?'tag':item.kind==='stash'?'stash':item.kind==='remote'?'remote':'branch',size:11}),h('span',{className:'gg-badge-label'},item.label));
      }));
    }
    function fileTree(files) {
      const root={folders:new Map(),files:[]};
      for(const file of files){
        const parts=file.path.split('/');let node=root;
        for(const part of parts.slice(0,-1)){
          if(!node.folders.has(part))node.folders.set(part,{folders:new Map(),files:[]});
          node=node.folders.get(part);
        }
        node.files.push(file);
      }
      return root;
    }
    function historyLayout(commits,hash,expandedHeight) {
      const expandedIndex=commits.findIndex(commit=>commit.hash===hash);
      const extra=expandedIndex<0?0:expandedHeight;
      return {expandedIndex,total:commits.length*ROW_HEIGHT+extra,
        rowTop:index=>index*ROW_HEIGHT+(expandedIndex>=0&&index>expandedIndex?extra:0)};
    }
    return {
      inject:['slots','locale','sidebarRightTabs','sidebarRight','remote','remote.commands'],
      apply(ctx) {
        for (const [locale,dict] of Object.entries(dictionaries)) ctx.effect(()=>ctx.locale.register(NS,locale,dict));
        const translate=ctx.locale.bind(NS);
        function useT() { useSyncExternalStore(fn=>ctx.locale.subscribe(fn),()=>ctx.locale.getSnapshot()); return translate; }
        function Button({label,children,...props}) { return h('button',{type:'button',title:label,'aria-label':label,...props},children||label); }
        function Diff({value,t}) { return value ? h(React.Fragment,null,value.truncated&&h('p',{className:'gg-muted gg-small'},t('truncated')),h('pre',{className:'gg-diff',tabIndex:0},value.text ? value.text.split('\n').map((line,i)=>h('span',{key:i,className:'gg-diff-line '+(line.startsWith('+')?'gg-added':line.startsWith('-')?'gg-deleted':line.startsWith('@@')?'gg-hunk':'')},line||' ')) : t('noDiff'))) : null; }
        function NativePanel({useTabInfo,...props}) {
          return h(Panel,{...props,tab:useTabInfo().tab});
        }
        function BranchSelector({sessionId,useSession}) {
          const t=useT(),cwd=useSession(session=>session.cwd),[workspace,setWorkspace]=useState(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[open,setOpen]=useState(false);
          const executeCommand=useCallback((request,signal)=>ctx.remote.commands.execute(sessionId,'/local-git-graph '+JSON.stringify(request),[],signal),[sessionId]);
          const runRequest=useCallback(async(request,signal)=>{
            const rpc=await executeCommand(request,signal);
            if(!rpc.ok)throw new Error(rpc.error?.message||t('error'));
            const result=rpc.value?.result;
            if(!result)throw new Error('Git Graph command is unavailable');
            if(result.kind==='error')throw new Error(result.text);
            return JSON.parse(result.text);
          },[executeCommand,t]);
          const readWorkspace=useCallback(signal=>runRequest({action:'workspace'},signal),[runRequest]);
          const refresh=useCallback(async signal=>{
            setLoading(true);
            try {const value=await readWorkspace(signal);setWorkspace(value);setError('');}
            catch(cause){if(!signal?.aborted)setError(cause.message);}
            finally {if(!signal?.aborted)setLoading(false);}
          },[readWorkspace]);
          useEffect(()=>{const controller=new AbortController();refresh(controller.signal);return()=>controller.abort();},[refresh,cwd]);
          const select=async id=>{
            setOpen(false);setError('');
            if(!id||id===`branch:${workspace?.branch}`)return;
            const [kind,...value]=id.split(':');
            const request=kind==='branch'?{action:'checkout',branch:value.join(':')}:{action:'switchWorktree',worktreePath:value.join(':')};
            const controller=new AbortController();setBusy(true);
            try {await runRequest(request,controller.signal);await refresh(controller.signal);}
            catch(cause){setError(cause.message);}
            finally {setBusy(false);}
          };
          if(!workspace?.repository)return loading||error?h('div',{className:'gg-branch-selector'},h('style',null,branchCss),loading?h('button',{type:'button',className:'gg-branch-button',disabled:true,'aria-label':t('branchLoading')},h(Icon,{name:'branch',size:16}),t('branchLoading')):h('button',{type:'button',className:'gg-branch-button','aria-label':t('branchFailed'),title:error,onClick:()=>refresh(),style:{color:'var(--dsw-alias-state-error-primary)'}},h(Icon,{name:'reload',size:16}))):null;
          const selected=workspace.branch?`branch:${workspace.branch}`:`worktree:${workspace.worktrees.find(item=>item.current)?.path||workspace.repository}`;
          const items=[...workspace.branches.map(branch=>({id:`branch:${branch}`,label:`${t('branchOption')}: ${branch}`})),...workspace.worktrees.map(item=>({id:`worktree:${item.path}`,label:`${t('worktreeOption')}: ${item.branch||t('worktreeDetached')} · ${item.path.split(/[\\/]/).pop()}`}))];
          return h('div',{className:'gg-branch-selector',style:{display:'flex',alignItems:'center',gap:6,minWidth:0}},h('style',null,branchCss),h(Menu,{open,onClose:()=>setOpen(false),items,selectedId:selected,onSelect:select,align:'start',portal:true,
            anchor:h('button',{type:'button',className:'gg-branch-button',title:workspace.repository,'aria-label':t('gitBranch')+': '+(workspace.branch||t('worktreeDetached')),'aria-haspopup':'menu','aria-expanded':open,disabled:busy,onClick:()=>{setError('');setOpen(value=>!value);}},h(Icon,{name:'branch',size:16}),h('span',{style:{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},busy?t('branchSwitching'):workspace.branch||t('worktreeDetached')),h(Icon,{name:'chevronDown',size:14}))}),
            error&&h('span',{role:'alert',title:error,style:{maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--dsw-alias-state-error-primary)',fontSize:12}},t('branchFailed')));
        }
        function ConversationPanel({sessionId,useSession}) {
          const cwd=useSession(session=>session.cwd);
          return h(WorkspacePanel,{key:cwd,scope:{sessionId},visible:true});
        }
        function WorkspacePanel({scope,visible}) {
          const executeCommand=useCallback((line,signal)=>ctx.remote.commands.execute(scope.sessionId,line,[],signal),[scope.sessionId]);
          const tab=useMemo(()=>({visible}),[visible]);
          return h(Panel,{key:scope.sessionId,sessionId:scope.sessionId,executeCommand,tab});
        }
        function TabTitle({useTabInfo}) {
          return h(React.Fragment,null,h(GraphIcon,{size:16}),useTabInfo().tab.title);
        }
        function Panel({sessionId,executeCommand,tab}) {
          const t=useT();
          const [data,setData]=useState(null),[busy,setBusy]=useState(''),[notice,setNotice]=useState(null),[toast,setToast]=useState(null);
          const [foldChanges,setFoldChanges]=useState(false),[foldHistory,setFoldHistory]=useState(false);
          const [message,setMessage]=useState(''),[ref,setRef]=useState(''),[limit,setLimit]=useState(100),[query,setQuery]=useState('');
          const [detail,setDetail]=useState(null),[diff,setDiff]=useState(null),[dialog,setDialog]=useState(null),[name,setName]=useState('');
          const [scroll,setScroll]=useState(0),[height,setHeight]=useState(500),[copied,setCopied]=useState(false),[fileView,setFileView]=useState('tree');
          const [changesRatio,setChangesRatio]=useState(null),[resizing,setResizing]=useState(false);
          const [menu,setMenu]=useState(null);
          const mainRef=useRef(null),changesRef=useRef(null),resizeCleanup=useRef(null),menuRef=useRef(null);
          useEffect(()=>{
            if(!toast)return;
            const timer=setTimeout(()=>setToast(current=>current===toast?null:current),4000);
            return()=>clearTimeout(timer);
          },[toast]);
          useEffect(()=>{
            if(!dialog)return;
            const onKey=event=>{if(event.key==='Escape'){event.preventDefault();setDialog(null);}};
            document.addEventListener('keydown',onKey);
            return()=>document.removeEventListener('keydown',onKey);
          },[dialog]);
          useEffect(()=>{
            if(!menu)return;
            const onKey=event=>{if(event.key==='Escape'){event.preventDefault();setMenu(null);}};
            const close=()=>setMenu(null);
            document.addEventListener('keydown',onKey);
            window.addEventListener('scroll',close,true);
            window.addEventListener('resize',close);
            return()=>{document.removeEventListener('keydown',onKey);window.removeEventListener('scroll',close,true);window.removeEventListener('resize',close);};
          },[menu]);
          // Anchor the menu exactly at the pointer, then nudge it inside the viewport
          // only after its real size is known, so short menus stay under the cursor.
          useEffect(()=>{
            if(!menu||menu.placed)return;
            const element=menuRef.current;
            if(!element||typeof element.getBoundingClientRect!=='function')return;
            const rect=element.getBoundingClientRect();
            const vw=window.innerWidth||1024,vh=window.innerHeight||768;
            const x=Math.max(8,Math.min(menu.x,vw-8-rect.width));
            const y=Math.max(8,Math.min(menu.y,vh-8-rect.height));
            setMenu({...menu,x,y,placed:true});
          },[menu]);
          const viewport=useRef(null), generation=useRef(0), detailGeneration=useRef(0), pending=useRef(false), mounted=useRef(true), lifetime=useRef(null);
          useEffect(()=>{const controller=new AbortController();lifetime.current=controller;mounted.current=true;return()=>{controller.abort();mounted.current=false;generation.current++;detailGeneration.current++;};},[]);
          const call=useCallback(async request=>{
            const signal=tab.signal?AbortSignal.any([tab.signal,lifetime.current.signal]):lifetime.current.signal;
            const rpc=await executeCommand('/local-git-graph '+JSON.stringify(request),signal);
            if(!rpc.ok) throw new Error(rpc.error?.message||t('error'));
            const result=rpc.value?.result;
            if(!result) throw new Error('Git Graph command is unavailable');
            if(result.kind==='error') throw new Error(['fetch','sync'].includes(request.action)&&result.text==='Unknown Git Graph action'?t(request.action+'Unavailable'):result.text);
            const value=JSON.parse(result.text);
            if(request.action==='snapshot'&&value.stashes?.length){
              const stashParents=new Map(),internal=new Set();
              for(const stash of value.stashes){
                const commit=value.commits.find(item=>item.hash===stash.hash);
                if(!commit)continue;
                stashParents.set(stash.hash,commit.parents.slice(0,1));
                commit.parents.slice(1).forEach(parent=>internal.add(parent));
              }
              value.commits=value.commits.filter(commit=>!internal.has(commit.hash))
                .map(commit=>stashParents.has(commit.hash)?{...commit,parents:stashParents.get(commit.hash)}:commit);
            }
            return value;
          },[executeCommand,tab.signal]);
          const refresh=useCallback(async()=>{
            if(pending.current)return;
            const id=++generation.current; setBusy('refresh');
            try { const next=await call({action:'snapshot',ref,limit});if(mounted.current&&id===generation.current) {setData(next);setNotice(null);} }
            catch(error){if(mounted.current&&id===generation.current)setNotice({error:true,text:error.message});}
            finally {if(mounted.current&&id===generation.current)setBusy('');}
          },[call,ref,limit]);
          useEffect(()=>{if(tab.visible)refresh();},[refresh,tab.visible]);
          useEffect(()=>tab.actions?.bindCommands({refresh}),[tab.actions,refresh]);
          useEffect(()=>{
            if(!tab.visible)return;
            const focus=()=>refresh();window.addEventListener('focus',focus);
            return()=>window.removeEventListener('focus',focus);
          },[refresh,tab.visible]);
          useEffect(()=>{
            const element=viewport.current;if(!element)return;
            const observer=new ResizeObserver(entries=>setHeight(entries[0].contentRect.height));observer.observe(element);
            return()=>observer.disconnect();
          },[data?.repository,foldHistory]);
          const action=async(request,onSuccess,options={})=>{
            if(pending.current)return false;pending.current=true;generation.current++;setBusy(request.action);setNotice(null);setToast(null);
            try {
              const result=await call(request);
              if(!mounted.current)return false;
              if(onSuccess)onSuccess(result);
              if(request.action==='generate')setNotice(result.truncated?{text:t('draftTruncated')}:null);
              else {
                const next=await call({action:'snapshot',ref,limit});
                if(mounted.current){
                  setData(next);
                  const key={fetch:'fetched',sync:'synced',stage:'stagedSuccess',unstage:'unstagedSuccess',commit:'committedSuccess',branch:'branchSuccess',tag:'tagSuccess',checkout:'checkoutSuccess',stashSave:'stashSaveSuccess',stashApply:'stashApplySuccess',stashPop:'stashPopSuccess',stashDrop:'stashDropSuccess',deleteBranch:'branchDeleted',deleteRemoteBranch:'remoteBranchDeleted',deleteBranchEverywhere:'branchDeletedEverywhere',deleteTag:'tagDeleted',pushTag:'tagPushed',pushBranch:'branchPushed',pullBranch:'pulled'}[request.action]||'operationSuccess';
                  if(!options.silentSuccess)setToast({text:t(key)});
                }
              }
              return true;
            } catch(error){if(mounted.current)setNotice({error:true,text:error.message});return false;}
            finally {pending.current=false;if(mounted.current)setBusy('');}
          };
          const openCommit=async(commit,parent)=>{
            const id=++detailGeneration.current;setDetail({loading:true,hash:commit.hash});setDiff(null);
            try {const value=await call({action:'detail',hash:commit.hash,...(parent?{parent}:{})});if(mounted.current&&id===detailGeneration.current)setDetail(value);}
            catch(error){if(mounted.current&&id===detailGeneration.current)setDetail({error:error.message,hash:commit.hash});}
          };
          const openDiff=async(file,staged,commit)=>{
            const id=++detailGeneration.current;
            if(!commit)setDetail({working:true,title:file.path,staged});
            setDiff({loading:true,path:file.path});
            try {const value=await call({action:'diff',path:file.path,original:file.original,staged,...(commit?{hash:commit.hash,parent:commit.parent}:{})});if(mounted.current&&id===detailGeneration.current)setDiff({...value,path:file.path});}
            catch(error){if(mounted.current&&id===detailGeneration.current)setDiff({error:error.message,path:file.path});}
          };
          const closeDetail=()=>{detailGeneration.current++;setDetail(null);setDiff(null);};
          const toggleCommit=commit=>{if(detail?.hash===commit.hash)closeDetail();else openCommit(commit);};
          const commits=data?.commits||[], graph=useMemo(()=>layoutGraph(commits,data?.refs||[],data?.branch),[commits,data]);
          const matches=useMemo(()=>query ? commits.map((c,i)=>[c,i]).filter(([c])=>(c.title+' '+c.author+' '+c.hash).toLowerCase().includes(query.toLowerCase())).map(([,i])=>i):[],[commits,query]);
          const refsAt=useMemo(()=>{const map=new Map();for(const item of [...(data?.refs||[]),...(data?.stashes||[]).map(s=>({...s,kind:'stash'}))])map.set(item.hash,[...(map.get(item.hash)||[]),item]);return map;},[data]);
          const remoteBranchNames=useMemo(()=>{const names=new Set();for(const item of data?.refs||[]){if(item.kind!=='remote')continue;const slash=item.name.indexOf('/');const branch=slash<0?'':item.name.slice(slash+1);if(branch&&branch!=='HEAD')names.add(branch);}return names;},[data]);
          const staged=data?.files?.filter(f=>f.staged)||[],working=data?.files?.filter(f=>f.unstaged)||[];
          const canCommit=!!message.trim()&&(staged.length>0||working.length>0)&&!data?.files?.some(f=>f.conflict);
          // Stage everything first when nothing is staged, so commit works even if the
          // running Host still only supports committing an already-staged index.
          const commitChanges=async()=>{
            if(busy||!canCommit)return;
            if(!staged.length&&working.length){const stagedOk=await action({action:'stage'},undefined,{silentSuccess:true});if(!stagedOk)return;}
            await action({action:'commit',message},()=>setMessage(''));
          };
          const copyHashValue=async hash=>{try{await navigator.clipboard.writeText(hash);setToast({text:t('copied')});}catch(error){setNotice({error:true,text:error.message});}};
          const branchMenuItems=branch=>{
            const showRemote=data?.hasRemotes??(data?.refs||[]).some(item=>item.kind==='remote');
            const isCurrent=branch.name===data.branch;
            const hasUpstream=!!(branch.remote&&branch.remoteRef);
            const ahead=Number(branch.ahead)||0,behind=Number(branch.behind)||0;
            const hasCounterpart=hasUpstream||remoteBranchNames.has(branch.name);
            const items=[];
            if(!isCurrent)items.push({id:'checkout',icon:'checkout',label:t('checkoutBranch')+' · '+branch.name,onSelect:()=>setDialog({title:t('checkoutBranch')+' · '+branch.name,description:t('checkoutConfirm'),request:{action:'checkout',branch:branch.name}})});
            if(showRemote&&(!hasUpstream||(ahead>0&&behind===0)))items.push({id:'push',icon:'remote',label:t('pushBranch'),title:t('pushBranchHint'),onSelect:()=>action({action:'pushBranch',name:branch.name})});
            if(isCurrent&&hasUpstream&&behind>0&&ahead===0)items.push({id:'pull',icon:'fetch',label:t('pullBranch'),title:t('pullBranchHint'),onSelect:()=>action({action:'pullBranch',name:branch.name})});
            if(!isCurrent)items.push({id:'delete-branch',icon:'trash',danger:true,label:t('deleteBranch'),onSelect:()=>setDialog({title:t('deleteBranch')+' · '+branch.name,description:t('deleteBranchConfirm'),request:{action:'deleteBranch',name:branch.name}})});
            if(!isCurrent&&showRemote&&hasCounterpart)items.push({id:'delete-everywhere',icon:'trash',danger:true,label:t('deleteBranchEverywhere'),onSelect:()=>setDialog({title:t('deleteBranchEverywhere')+' · '+branch.name,description:t('deleteBranchEverywhereConfirm'),request:{action:'deleteBranchEverywhere',name:branch.name}})});
            return items;
          };
          // Label (badge) menus expose only that ref's own actions; the commit row
          // itself exposes the regular commit actions.
          const buildRefMenu=ref=>{
            const showRemote=data?.hasRemotes??(data?.refs||[]).some(item=>item.kind==='remote');
            if(ref.kind==='branch'){
              const items=branchMenuItems(ref);
              if(!items.length)return [];
              return [{label:t('branch')+': '+ref.name+(ref.name===data.branch?' · '+t('currentBranch'):''),items}];
            }
            if(ref.kind==='tag'){
              const items=[];
              if(showRemote)items.push({id:'push-tag',icon:'remote',label:t('pushTag'),title:t('pushTagHint'),onSelect:()=>action({action:'pushTag',name:ref.name})});
              items.push({id:'delete-tag',icon:'trash',danger:true,label:t('deleteTag'),onSelect:()=>setDialog({title:t('deleteTag')+' · '+ref.name,description:t('deleteTagConfirm'),request:{action:'deleteTag',name:ref.name}})});
              return [{label:t('tag')+': '+ref.name,items}];
            }
            if(ref.kind==='stash'){
              const items=[
                {id:'stash-apply',icon:'check',label:t('stashApply'),title:t('applyConfirm'),onSelect:()=>setDialog({title:t('stashApply'),description:t('applyConfirm'),request:{action:'stashApply',hash:ref.hash}})},
                {id:'stash-pop',icon:'stash',label:t('stashPop'),title:t('stashPopConfirm'),onSelect:()=>setDialog({title:t('stashPop'),description:t('stashPopConfirm'),request:{action:'stashPop',hash:ref.hash}})},
                {id:'stash-drop',icon:'trash',danger:true,label:t('stashDrop'),title:t('dropConfirm'),onSelect:()=>setDialog({title:t('stashDrop')+' · '+String(ref.name||ref.hash).slice(0,8),description:t('dropConfirm'),request:{action:'stashDrop',hash:ref.hash}})},
              ];
              return [{label:(ref.name||t('stash'))+(ref.title?' · '+ref.title:''),items}];
            }
            if(ref.kind==='remote'){
              const items=[];
              if(showRemote)items.push({id:'delete-remote',icon:'trash',danger:true,label:t('deleteRemoteBranch'),onSelect:()=>setDialog({title:t('deleteRemoteBranch')+' · '+ref.name,description:t('deleteRemoteBranchConfirm'),request:{action:'deleteRemoteBranch',remoteRef:ref.fullName}})});
              return items.length?[{label:t('remote')+': '+ref.name,items}]:[];
            }
            return [];
          };
          const buildCommitMenu=commit=>[{items:[
            {id:'create-branch',icon:'branch',label:t('createBranch'),onSelect:()=>{setName('');setDialog({title:t('createBranch'),needsName:true,request:{action:'branch',hash:commit.hash}});}},
            {id:'create-tag',icon:'tag',label:t('createTag'),onSelect:()=>{setName('');setDialog({title:t('createTag'),needsName:true,request:{action:'tag',hash:commit.hash}});}},
            {id:'copy-hash',icon:'copy',label:t('copy'),title:commit.hash,onSelect:()=>copyHashValue(commit.hash)},
          ]}];
          const openContextMenu=(event,commit)=>{
            event.preventDefault?.();event.stopPropagation?.();
            setMenu({x:Math.max(0,event.clientX??0),y:Math.max(0,event.clientY??0),sections:buildCommitMenu(commit)});
          };
          const openRefContextMenu=(event,ref)=>{
            event.preventDefault?.();event.stopPropagation?.();
            setMenu({x:Math.max(0,event.clientX??0),y:Math.max(0,event.clientY??0),sections:buildRefMenu(ref)});
          };
          const messagePlaceholder=t('placeholder');
          const locale=ctx.locale.getLocale().active?.startsWith('zh')?'zh-CN':'en';
          const fullDate=value=>new Intl.DateTimeFormat(locale,{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZoneName:'short'}).format(value);
          const shortDate=value=>new Intl.DateTimeFormat(locale,{year:'2-digit',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(value);
          // Drag the divider between Changes and History to trade height between them.
          const clampSplit=useCallback((next,mainHeight)=>{
            const minChanges=96,minHistory=140,limit=Math.max(minChanges,mainHeight-minHistory);
            return Math.max(minChanges,Math.min(limit,next));
          },[]);
          const startResize=useCallback(event=>{
            if(event.button!==undefined&&event.button!==0)return;
            const main=mainRef.current,changes=changesRef.current;
            if(!main||!changes)return;
            const mainHeight=main.getBoundingClientRect().height;
            if(!mainHeight)return;
            event.preventDefault();
            resizeCleanup.current?.();
            const startY=event.clientY,startHeight=changes.getBoundingClientRect().height;
            setResizing(true);
            const move=e=>{setChangesRatio(clampSplit(startHeight+(e.clientY-startY),mainHeight)/mainHeight);e.preventDefault();};
            const stop=()=>{setResizing(false);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',stop);window.removeEventListener('pointercancel',stop);resizeCleanup.current=null;};
            resizeCleanup.current=stop;
            window.addEventListener('pointermove',move,{passive:false});
            window.addEventListener('pointerup',stop);
            window.addEventListener('pointercancel',stop);
          },[clampSplit]);
          const resizeByKey=useCallback(event=>{
            if(event.key!=='ArrowUp'&&event.key!=='ArrowDown')return;
            const main=mainRef.current,changes=changesRef.current;
            if(!main||!changes)return;
            const mainHeight=main.getBoundingClientRect().height;
            if(!mainHeight)return;
            event.preventDefault();
            const step=event.shiftKey?48:16;
            const next=clampSplit(changes.getBoundingClientRect().height+(event.key==='ArrowDown'?step:-step),mainHeight);
            setChangesRatio(next/mainHeight);
          },[clampSplit]);
          useEffect(()=>()=>{resizeCleanup.current?.();},[]);
          const group=(title,files,isStaged)=>h('div',{className:'gg-file-group'},
            h('div',{className:'gg-group-head'},h('span',null,title,' ',h('span',{className:'gg-count'},files.length)),h(Button,{label:t(isStaged?'unstageAll':'stageAll'),disabled:!!busy||!files.length,onClick:()=>action({action:isStaged?'unstage':'stage'})},h(Icon,{name:isStaged?'minus':'plus',size:14}))),
            files.length?files.map(file=>h('div',{className:'gg-file',key:file.path},h(Button,{label:(file.original?file.original+' → ':'')+file.path,className:'gg-file-main',onClick:()=>openDiff(file,isStaged)},h('span',{className:'gg-status '+(file.conflict?'gg-conflict':''),'data-status':file.conflict?'U':isStaged?file.index:file.worktree===' '?'?':file.worktree,title:file.conflict?t('conflict'):undefined},file.conflict?'U':isStaged?file.index:file.worktree===' '?'?':file.worktree),h('span',{className:'gg-file-label'},file.path)),h(Button,{label:t(isStaged?'unstage':'stage')+' '+file.path,disabled:!!busy,onClick:()=>action({action:isStaged?'unstage':'stage',paths:[file.path]})},h(Icon,{name:isStaged?'minus':'plus',size:14})))):h('div',{className:'gg-group-empty'},t('noChanges')));
          const layout=historyLayout(commits,detail?.hash,360);
          const visibleIndices=commits.map((_,index)=>index).filter(index=>{
            const top=layout.rowTop(index);
            return top+ROW_HEIGHT>=scroll-4*ROW_HEIGHT&&top<=scroll+height+4*ROW_HEIGHT;
          });
          const renderFile=(file,tree)=>h('div',{className:'gg-file',key:file.path},h(Button,{label:(file.original?file.original+' → ':'')+file.path,className:'gg-file-main',onClick:()=>openDiff(file,false,detail)},h(Icon,{name:'file',size:14}),h('span',{className:'gg-status','data-status':file.status},file.status),h('span',{className:'gg-file-label'},tree?file.path.split('/').pop():file.path)));
          const renderTree=node=>h(React.Fragment,null,...[...node.folders].sort(([a],[b])=>a.localeCompare(b)).map(([folder,child])=>h('details',{key:folder,className:'gg-tree-folder',open:true},h('summary',null,h(Icon,{name:'folder',size:14}),' ',folder),renderTree(child))),...node.files.map(file=>renderFile(file,true)));
          const renderDiff=()=>diff&&(diff.loading?h('div',{className:'gg-loading'},t('loading')):diff.error?h('div',{role:'alert'},diff.error):h(React.Fragment,null,h('div',{className:'gg-path gg-small'},diff.path),h(Diff,{value:diff,t})));
          const detailPanel=detail&&h('aside',{className:'gg-details'+(detail.working?'':' gg-inline-details'),style:detail.working?undefined:{top:(layout.expandedIndex+1)*ROW_HEIGHT},'aria-label':t('detail')},h('div',{className:'gg-head'},h('span',{style:{flex:1},className:'gg-small'},detail.working?t(detail.staged?'stagedDiff':'workingDiff'):t('detail')),h(Button,{label:t('close'),onClick:closeDetail},h(Icon,{name:'close'}))),
              h('div',{className:'gg-detail-body'},detail.loading?t('loading'):detail.error?h('div',{role:'alert'},detail.error):detail.working?h('strong',{className:'gg-path'},detail.title):h('div',{className:'gg-detail-columns'},h('div',{className:'gg-detail-info'},
                h('dl',{className:'gg-kv'},h('dt',null,'Hash'),h('dd',{className:'gg-mono gg-hash'},h('span',null,detail.hash),h(Button,{label:t(copied?'copied':'copy'),onClick:async()=>{try{await navigator.clipboard.writeText(detail.hash);setCopied(true);}catch(error){setNotice({error:true,text:error.message});}}},h(Icon,{name:copied?'check':'copy',size:14}))),h('dt',null,t('author')),h('dd',null,detail.author,' <',detail.email,'>'),h('dt',null,t('date')),h('dd',null,fullDate(detail.time)),h('dt',null,t('parents')),h('dd',{className:'gg-mono'},detail.parents.length?detail.parents.join(' · '):t('root'))),h('h3',{className:'gg-detail-title'},detail.title),detail.body&&h('div',{className:'gg-body'},detail.body),
                detail.parents.length>1&&h('label',{className:'gg-small'},t('parent'),h('select',{className:'gg-parent',value:detail.parent,onChange:e=>openCommit(detail,e.target.value)},...detail.parents.map((parent,i)=>h('option',{key:parent,value:parent},`${i+1}: ${parent.slice(0,8)}`)))),
                h('div',{className:'gg-detail-actions'},...['branch','tag'].map(kind=>h(Button,{key:kind,label:t(kind==='branch'?'createBranch':'createTag'),disabled:!!busy,onClick:()=>{setName('');setDialog({title:t(kind==='branch'?'createBranch':'createTag'),needsName:true,request:{action:kind,hash:detail.hash}});}},h(Icon,{name:kind==='branch'?'branch':'tag',size:14}))),h(Button,{label:t('checkout'),disabled:!!busy,onClick:()=>setDialog({title:t('checkout'),description:t('detached'),request:{action:'checkout',hash:detail.hash}})},h(Icon,{name:'checkout',size:14})),...(refsAt.get(detail.hash)||[]).filter(item=>item.kind==='branch'||item.kind==='stash').map(item=>h(Button,{key:item.kind+item.name,label:item.kind==='stash'?t('stashApply'):t('checkoutBranch')+' '+item.name,disabled:!!busy,onClick:()=>setDialog({title:item.kind==='stash'?t('stashApply'):t('checkoutBranch')+' '+item.name,description:t(item.kind==='stash'?'applyConfirm':'checkoutConfirm'),request:item.kind==='stash'?{action:'stashApply',hash:detail.hash}:{action:'checkout',branch:item.name}})})),(data.stashes||[]).some(item=>item.hash===detail.hash)&&h(Button,{label:t('stashDrop'),className:'gg-danger',disabled:!!busy,onClick:()=>setDialog({title:t('stashDrop')+' · '+detail.shortHash,description:t('dropConfirm'),request:{action:'stashDrop',hash:detail.hash}})},h(Icon,{name:'trash',size:14}),t('stashDrop'))),
                                 ),h('div',{className:'gg-detail-files'},h('div',{className:'gg-file-tools'},h('span',null,t('files'),' ',h('span',{className:'gg-count'},detail.files.length)),...['tree','list'].map(mode=>h(Button,{key:mode,label:t(mode==='tree'?'treeView':'listView'),'aria-pressed':fileView===mode,onClick:()=>setFileView(mode)},h(Icon,{name:mode,size:16})))),fileView==='tree'?h('div',{className:'gg-tree-root'},renderTree(fileTree(detail.files))):detail.files.map(file=>renderFile(file,false)),renderDiff())),
                 detail.working&&renderDiff()));
          const confirmAction=()=>{const current=dialog;setDialog(null);action({...current.request,...(current.needsName?{name}:{} )},current.request.action==='stashDrop'?closeDetail:undefined);};
          const resizable=!foldChanges&&!foldHistory;
          const changesStyle=resizable&&changesRatio!=null?{flex:'0 0 '+(changesRatio*100).toFixed(3)+'%',maxHeight:'none'}:undefined;
          return h('div',{className:'dgg'+(resizing?' gg-resizing':''),'data-git-graph-version':'1.0.0'},h('style',null,css),
            notice&&h('div',{className:'gg-notice','data-error':!!notice.error,role:notice.error?'alert':'status'},h('span',null,notice.text),h(Button,{label:t('close'),onClick:()=>setNotice(null)},h(Icon,{name:'close'}))),
             toast&&createPortal(h('div',{className:'gg-toast-portal',role:'status','aria-live':'polite'},toast.text),document.body),
            dialog&&createPortal(h('div',{className:'dgg gg-modal-overlay',onMouseDown:e=>{if(e.target===e.currentTarget)setDialog(null);}},h('form',{className:'gg-modal',role:'dialog','aria-modal':'true','aria-label':dialog.title,onSubmit:e=>{e.preventDefault();confirmAction();}},h('strong',{className:'gg-modal-title'},dialog.title),dialog.description&&h('div',{className:'gg-small gg-muted gg-modal-desc'},dialog.description),dialog.needsName&&h('label',{className:'gg-modal-field'},h('span',null,t('name')),h('input',{autoFocus:true,required:true,value:name,onChange:e=>setName(e.target.value),placeholder:t('newName')})),h('div',{className:'gg-dialog-actions'},h(Button,{label:t('cancel'),onClick:()=>setDialog(null)}),h('button',{className:'gg-primary',type:'submit',disabled:!!busy||(dialog.needsName&&!name.trim())},t('confirm'))))),document.body),
            menu&&createPortal(h('div',{className:'dgg gg-menu-overlay',onMouseDown:e=>{if(e.target===e.currentTarget)setMenu(null);},onContextMenu:e=>{e.preventDefault();if(e.target===e.currentTarget)setMenu(null);}},h('div',{className:'gg-context-menu',role:'menu','aria-label':t('actions'),ref:menuRef,style:{left:menu.x,top:menu.y}},...menu.sections.map((section,si)=>h(React.Fragment,{key:'s'+si},section.label&&h('div',{className:'gg-menu-heading',role:'presentation'},section.label),...section.items.map((item,ii)=>h('button',{key:'i'+si+'-'+ii,type:'button',role:'menuitem',className:'gg-menu-item'+(item.danger?' gg-danger':''),title:item.title||item.label,onClick:()=>{setMenu(null);item.onSelect();}},item.icon?h(Icon,{name:item.icon,size:14}):null,h('span',{className:'gg-menu-label'},item.label))))))),document.body),
            !data ? h('div',{className:'gg-empty'},busy?t('loading'):h(Button,{label:t('retry'),onClick:refresh})) : !data.repository ? h('div',{className:'gg-empty'},h('div',null,t('noRepo')),h(Button,{label:t('refresh'),disabled:!!busy,onClick:refresh},h(Icon,{name:'reload'}))) : h('div',{className:'gg-main',ref:mainRef},
              h('section',{className:'gg-changes '+(foldChanges?'gg-folded':''),ref:changesRef,style:changesStyle},h('div',{className:'gg-head'},h(Button,{label:t('changes'),'aria-expanded':!foldChanges,onClick:()=>setFoldChanges(!foldChanges)},h(Icon,{name:foldChanges?'chevronRight':'chevronDown',size:14,className:'gg-chevron'}),t('changes'),h('span',{className:'gg-count'},data.files.length),h('span',{className:'gg-current-branch gg-mono',title:data.branch},h(Icon,{name:'branch',size:13}),h('span',null,data.branch))),h(Button,{label:t('stashSave'),disabled:!!busy||!data.files.length,onClick:()=>setDialog({title:t('stashSave'),description:t('saveConfirm'),request:{action:'stashSave'}})},h(Icon,{name:'stash',size:14})),h(Button,{label:t('refresh'),disabled:!!busy,onClick:refresh},h(Icon,{name:'reload'}))),
                !foldChanges&&h('div',{className:'gg-changes-body'},h('div',{className:'gg-compose'},h('div',{className:'gg-message-row'},h('textarea',{id:'gg-message-'+sessionId,'aria-label':t('message'),rows:1,value:message,placeholder:messagePlaceholder,title:messagePlaceholder,onChange:e=>setMessage(e.target.value),onKeyDown:e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'&&canCommit&&!busy){e.preventDefault();commitChanges();}}}),h(Button,{label:t(busy==='generate'?'generating':'generate'),title:t(busy==='generate'?'generating':'aiHint'),className:'gg-ai'+(busy==='generate'?' gg-generating':''),'aria-busy':busy==='generate',disabled:!!busy||(!staged.length&&!working.length),onClick:()=>action({action:'generate',locale:ctx.locale.getLocale().active},result=>setMessage(result.message))},h(Icon,{name:'sparkle',size:18}))),h(Button,{label:t(busy==='commit'?'committing':'commit'),className:'gg-primary gg-commit',disabled:!!busy||!canCommit,onClick:commitChanges})),group(t('staged'),staged,true),group(t('worktree'),working,false))),
              resizable&&h('div',{className:'gg-resizer',role:'separator','aria-orientation':'horizontal','aria-label':t('resize'),title:t('resize'),tabIndex:0,onPointerDown:startResize,onKeyDown:resizeByKey}),
              h('section',{className:'gg-history '+(foldHistory?'gg-folded':'')},h('div',{className:'gg-head'},h(Button,{label:t('history'),'aria-expanded':!foldHistory,onClick:()=>setFoldHistory(!foldHistory)},h(Icon,{name:foldHistory?'chevronRight':'chevronDown',size:14,className:'gg-chevron'}),t('history')),(data.hasRemotes??data.refs.some(item=>item.kind==='remote'))&&h(Button,{label:t(busy==='fetch'?'fetching':'fetch'),disabled:!!busy,'aria-busy':busy==='fetch',onClick:()=>action({action:'fetch'})},h(Icon,{name:busy==='fetch'?'spinner':'fetch',size:14,className:busy==='fetch'?'gg-spinning':''}))),
                !foldHistory&&h(React.Fragment,null,h('div',{className:'gg-filters'},h('select',{'aria-label':t('branch'),value:ref,onChange:e=>{setRef(e.target.value);setLimit(100);setScroll(0);viewport.current?.scrollTo(0,0);}},h('option',{value:''},t('all')),...data.refs.map(item=>h('option',{key:item.fullName,value:item.fullName},`${t(item.kind)}: ${item.name}`))),h('div',{className:'gg-search'},h('input',{type:'search','aria-label':t('search'),placeholder:t('search'),value:query,onChange:e=>setQuery(e.target.value)}),query&&h(Button,{label:t('next')+' ('+matches.length+')',disabled:!matches.length,onClick:()=>{const index=matches.find(i=>layout.rowTop(i)>scroll+2)??matches[0];viewport.current?.scrollTo({top:layout.rowTop(index)});}},h(Icon,{name:'next',size:14})))),
                  h('div',{className:'gg-scroll',ref:viewport,onScroll:e=>setScroll(e.currentTarget.scrollTop),'aria-label':t('history')},commits.length?h('div',{style:{height:layout.total,position:'relative'}},...visibleIndices.map(index=>{
                    const commit=commits[index];
                    return h('button',{type:'button',key:commit.hash,className:'gg-row '+(matches.includes(index)?'gg-match':''),style:{top:layout.rowTop(index)},'data-index':index,'aria-pressed':detail?.hash===commit.hash,'aria-label':commit.title+' · '+commit.author+' · '+commit.shortHash,'aria-expanded':detail?.hash===commit.hash,onClick:()=>toggleCommit(commit),onContextMenu:event=>openContextMenu(event,commit)},
                      h(Graph,{row:graph.rows[index],width:graph.width,head:data.head===commit.hash}),
                      h('span',{className:'gg-commit-line'},h(RefBadges,{items:refsAt.get(commit.hash)||[],head:data.head===commit.hash,color:graph.rows[index].color,t,compact:true,onRefContextMenu:(event,source)=>openRefContextMenu(event,source)}),h('span',{className:'gg-subject'},commit.title)),
                      h('span',{className:'gg-meta'},h('span',{className:'gg-author',title:commit.author},commit.author),h('span',{className:'gg-time',title:fullDate(commit.time)},shortDate(commit.time))));
                  }),(layout.expandedIndex>=0||detail?.working)&&detailPanel):h('div',{className:'gg-empty'},t('empty'))),
                  (busy==='refresh'||data.hasMore)&&h('div',{className:'gg-footer gg-muted gg-small'},busy==='refresh'?t('loading'):(limit<1000?h(Button,{label:t('more'),disabled:!!busy,onClick:()=>setLimit(Math.min(1000,limit+100))}):t('moreLimit')))))),
            detail?.working&&detailPanel);
        }
        ctx.slots.inject('conversation.view',()=>ctx.slots.register({name:'conversation.view',id:ID,label:()=> 'Git Graph',order:35,inject:sessionId=>({sessionId})},ConversationPanel));
        ctx.effect(()=>ctx.sidebarRightTabs.register({id:ID,kind:'local-git-graph',title:()=> 'Git Graph',keepMounted:true,guide:[{id:'main',order:35,title:()=> 'Git Graph',description:()=>translate('supported'),icon:GraphIcon}]}));
        ctx.slots.inject('sidebar.right.pane.tab',()=>ctx.slots.register({name:'sidebar.right.pane.tab',key:ID,inject:sessionId=>({executeCommand:(line,signal)=>ctx.remote.commands.execute(sessionId,line,[],signal)})},NativePanel));
        ctx.slots.inject('sidebar.right.pane.tab.title',()=>ctx.slots.register({name:'sidebar.right.pane.tab.title',key:ID},TabTitle));
        ctx.slots.inject('conversation.hero.options',()=>ctx.slots.register({name:'conversation.hero.options',id:ID,order:35,inject:sessionId=>({sessionId})},BranchSelector));
        ctx.inject(['betterSidebar'],injected=>injected.betterSidebar.registerTab({
          id:ID,title:()=> 'Git Graph',description:()=>translate('supported'),icon:size=>h(GraphIcon,{size}),order:35,
          single:true,bottomOnly:true,component:WorkspacePanel
        }));
      }
    };
  }
});
