// Git operations share one implementation between the sidebar command and agent tool.
import path from 'node:path';

export function parseStatus(text) {
  const tokens = text.split('\0'), files = [];
  for (let i = 0; i < tokens.length; i++) {
    const row = tokens[i];
    if (!row) continue;
    const x = row[0], y = row[1], name = row.slice(3);
    const original = /[RC]/.test(x + y) ? tokens[++i] : undefined;
    files.push({ path: name, ...(original ? { original } : {}), index: x, worktree: y,
      staged: x !== ' ' && x !== '?', unstaged: y !== ' ' || x === '?',
      conflict: x === 'U' || y === 'U' || ['AA', 'DD'].includes(x + y) });
  }
  return files;
}

export function parseLog(text) {
  const fields = text.split('\0'), commits = [];
  for (let i = 0; i + 6 < fields.length; i += 7) {
    const [hash, parents, author, email, time, title, body] = fields.slice(i, i + 7);
    if (!/^[a-f0-9]{40,64}$/.test(hash)) throw new Error('Invalid Git log record');
    commits.push({ hash, shortHash: hash.slice(0, 8), parents: parents ? parents.split(' ') : [], author, email, time: Number(time) * 1000, title, body });
  }
  return commits;
}

export const LOG_FORMAT = '%H%x00%P%x00%an%x00%ae%x00%at%x00%s%x00%b';
const WRITE = new Set(['stage', 'unstage', 'commit', 'checkout', 'branch', 'tag', 'stashSave', 'stashApply', 'stashDrop']);
const ACTIONS = new Set(['snapshot', 'detail', 'diff', 'generate', ...WRITE]);
const hashValue = v => { if (!/^[a-f0-9]{40,64}$/.test(v || '')) throw new Error('A full commit hash is required'); return v; };
const fileValue = v => {
  if (typeof v !== 'string' || !v || v.includes('\0') || path.isAbsolute(v) || v.split(/[\\/]/).includes('..')) throw new Error('Invalid repository-relative path');
  return v;
};

export class GitGraphService {
  constructor(run, generate) { this.run = run; this.generate = generate; this.locks = new Set(); }
  async execute(cwd, request, signal) {
    if (!request || !ACTIONS.has(request.action)) throw new Error('Unknown Git Graph action');
    const { action } = request;
    const git = (args, options) => this.run(cwd, args, { signal, ...options });
    const rootResult = await git(['rev-parse', '--show-toplevel'], { allowFailure: true });
    if (rootResult.code !== 0) {
      if (action === 'snapshot' && /not a git repository/i.test(rootResult.stderr)) return { repository: null, cwd };
      throw new Error(rootResult.stderr || 'Cannot open Git repository');
    }
    const root = rootResult.stdout.trim();
    const g = (args, options) => this.run(root, ['diff', 'show', 'diff-tree'].includes(args[0]) ? ['--literal-pathspecs', ...args] : args, { signal, ...options });
    const isWrite = WRITE.has(action);
    if (isWrite && this.locks.has(root)) throw new Error('Another Git operation is running. Refresh and try again.');
    if (isWrite) this.locks.add(root);
    try {
      if (action === 'snapshot') {
        const limit = Math.max(50, Math.min(1000, Number(request.limit) || 100));
        const [status, head, refsResult, stashResult] = await Promise.all([
          g(['status', '--porcelain=v1', '-z', '--untracked-files=all']),
          g(['symbolic-ref', '--quiet', '--short', 'HEAD'], { allowFailure: true }),
          g(['for-each-ref', '--format=%(objectname)%00%(*objectname)%00%(refname)%00%(symref)%00', 'refs/heads', 'refs/remotes', 'refs/tags']),
          g(['stash', 'list', '--format=%H%x00%gd%x00%gs%x00%at%x00%P%x00'])
        ]);
        const refs = [];
        const refFields = refsResult.stdout.split('\0');
        for (let i = 0; i + 3 < refFields.length; i += 4) {
          const hash = refFields[i].trim(), peeled = refFields[i + 1], fullName = refFields[i + 2], symref = refFields[i + 3];
          if (!hash || symref) continue;
          const kind = fullName.startsWith('refs/tags/') ? 'tag' : fullName.startsWith('refs/remotes/') ? 'remote' : 'branch';
          refs.push({ hash: peeled || hash, name: fullName.replace(/^refs\/(heads|remotes|tags)\//, ''), fullName, kind });
        }
        const stashFields = stashResult.stdout.split('\0'), stashes = [], stashParents = new Map(), stashInternals = new Set();
        for (let i = 0; i + 4 < stashFields.length; i += 5) {
          const hash = stashFields[i].trim();
          if (!hash) continue;
          stashes.push({ hash, name: stashFields[i + 1], title: stashFields[i + 2], time: Number(stashFields[i + 3]) * 1000 });
          const parents = stashFields[i + 4].split(' ').filter(Boolean);
          stashParents.set(hash, parents.slice(0, 1));
          parents.slice(1).forEach(parent => stashInternals.add(parent));
        }
        const headHash = await g(['rev-parse', '--verify', 'HEAD'], { allowFailure: true });
        const selectedRef = request.ref ? refs.find(ref => ref.fullName === request.ref) : undefined;
        if (request.ref && !selectedRef) throw new Error('Branch or tag no longer exists; refresh the repository');
        const revisions = selectedRef ? [selectedRef.fullName] : ['--all', ...(headHash.code === 0 ? ['HEAD'] : []), ...stashes.map(s => s.hash)];
        let commits = [];
        if (refs.length || stashes.length || headHash.code === 0) {
          // Stash index/untracked parents are implementation records, not history rows.
          // Read past them before applying the visible limit and computing hasMore.
          const log = await g(['log', '--topo-order', '-z', `--format=${LOG_FORMAT}`, `--max-count=${limit + 1 + (selectedRef ? 0 : stashInternals.size)}`, ...revisions, '--']);
          commits = parseLog(log.stdout);
          if (!selectedRef) commits = commits.filter(commit => !stashInternals.has(commit.hash))
            .map(commit => stashParents.has(commit.hash) ? { ...commit, parents: stashParents.get(commit.hash) } : commit);
        }
        return { repository: root, branch: head.stdout.trim() || (headHash.code === 0 ? headHash.stdout.trim().slice(0, 8) : 'HEAD'),
          head: headHash.code === 0 ? headHash.stdout.trim() : null, files: parseStatus(status.stdout), refs, stashes,
          commits: commits.slice(0, limit), hasMore: commits.length > limit };
      }
      if (action === 'detail') {
        const hash = hashValue(request.hash);
        const log = await g(['log', '-1', '-z', `--format=${LOG_FORMAT}`, hash, '--']);
        const commit = parseLog(log.stdout)[0];
        const parent = request.parent ? hashValue(request.parent) : commit.parents[0];
        if (parent && !commit.parents.includes(parent)) throw new Error('Selected parent does not belong to this commit');
        const range = parent ? [parent, hash] : ['--root', hash];
        const changes = await g(['diff-tree', '--no-commit-id', '-r', '-M', '--name-status', '-z', ...range, '--']);
        const fields = changes.stdout.split('\0'), files = [];
        for (let i = 0; i + 1 < fields.length; i += 2) {
          const status = fields[i], name = fields[i + 1];
          if (!status) continue;
          if (/^[RC]/.test(status)) files.push({ status, original: name, path: fields[++i + 1] });
          else files.push({ status, path: name });
        }
        const stats = parent ? await g(['diff', '--stat', parent, hash, '--']) : await g(['show', '--format=', '--stat', hash, '--']);
        return { ...commit, parent: parent || null, files, stats: stats.stdout };
      }
      if (action === 'diff') {
        const file = fileValue(request.path);
        if (request.original !== undefined) fileValue(request.original);
        let result;
        if (request.hash) {
          const hash = hashValue(request.hash);
          const parentList = (await g(['rev-list', '--parents', '-n', '1', hash])).stdout.trim().split(' ').slice(1);
          const parent = request.parent ? hashValue(request.parent) : parentList[0];
          if (parent && !parentList.includes(parent)) throw new Error('Invalid parent');
          result = parent ? await g(['diff', '--no-ext-diff', '--no-textconv', '--no-color', '-M', parent, hash, '--', ...(request.original ? [fileValue(request.original)] : []), file], { truncate: true })
            : await g(['show', '--format=', '--no-ext-diff', '--no-textconv', '--no-color', hash, '--', file], { truncate: true });
        } else {
          const files = parseStatus((await g(['status', '--porcelain=v1', '-z', '--untracked-files=all'])).stdout);
          const entry = files.find(f => f.path === file);
          if (!entry) throw new Error('File is no longer modified; refresh');
          result = entry.index === '?' ? await g(['diff', '--no-index', '--no-ext-diff', '--no-textconv', '--no-color', '--', '/dev/null', file], { allowFailure: true, truncate: true })
            : await g(['diff', '--no-ext-diff', '--no-textconv', '--no-color', ...(request.staged ? ['--cached'] : []), '--', ...(entry.original ? [entry.original] : []), file], { truncate: true });
          if (entry.index === '?' && result.code > 1) throw new Error(result.stderr);
        }
        return { text: result.stdout, truncated: result.truncated || false };
      }
      if (action === 'stage' || action === 'unstage') {
        const files = parseStatus((await g(['status', '--porcelain=v1', '-z', '--untracked-files=all'])).stdout);
        const selected = request.paths?.length ? request.paths.map(fileValue) : files.filter(f => action === 'stage' ? f.unstaged : f.staged).map(f => f.path);
        const paths = [...new Set(selected.flatMap(file => {
          const entry = files.find(f => f.path === file);
          if (!entry) throw new Error('File is no longer modified; refresh');
          return entry.original ? [entry.original, file] : [file];
        }))];
        if (!paths.length) throw new Error('No matching changes');
        if (action === 'stage') await g(['--literal-pathspecs', 'add', '--', ...paths]);
        else {
          const head = await g(['rev-parse', '--verify', 'HEAD'], { allowFailure: true });
          await g(head.code === 0 ? ['--literal-pathspecs', 'reset', '--quiet', 'HEAD', '--', ...paths] : ['--literal-pathspecs', 'rm', '--cached', '--quiet', '-f', '--', ...paths]);
        }
        return { ok: true };
      }
      if (action === 'commit') {
        const message = String(request.message || '').trim();
        if (!message || message.length > 16000 || message.includes('\0')) throw new Error('Enter a valid commit message');
        const status = parseStatus((await g(['status', '--porcelain=v1', '-z', '--untracked-files=all'])).stdout);
        if (status.some(f => f.conflict)) throw new Error('Resolve merge conflicts before committing');
        const staged = await g(['diff', '--cached', '--quiet'], { allowFailure: true });
        if (staged.code !== 0 && staged.code !== 1) throw new Error(staged.stderr);
        // Match message generation: commit the staged content when anything is staged,
        // otherwise stage every change (including untracked files) and commit that.
        if (staged.code === 0) {
          if (!status.length) throw new Error('No changes to commit');
          await g(['add', '-A', '--', '.']);
          const afterStage = await g(['diff', '--cached', '--quiet'], { allowFailure: true });
          if (afterStage.code === 0) throw new Error('No changes to commit');
          if (afterStage.code !== 1) throw new Error(afterStage.stderr);
        }
        await g(['commit', '-F', '-'], { input: message });
        return { ok: true, hash: (await g(['rev-parse', 'HEAD'])).stdout.trim() };
      }
      if (action === 'generate') {
        const status = parseStatus((await g(['status', '--porcelain=v1', '-z', '--untracked-files=all'])).stdout);
        if (!status.length) throw new Error('No changes to generate a commit message');
        const staged = status.some(f => f.staged), source = staged ? 'staged' : 'worktree';
        const flags = staged ? ['--cached'] : [];
        const diff = await g(['diff', ...flags, '--no-ext-diff', '--no-textconv', '--no-color', '--', '.'], { truncate: true });
        const summary = await g(['diff', ...flags, '--no-ext-diff', '--no-textconv', '--stat'], { truncate: true });
        let text = diff.stdout.slice(0, 60000), summaryText = summary.stdout;
        let truncated = diff.truncated || summary.truncated || diff.stdout.length > 60000;
        if (!staged) for (const file of status.filter(f => f.index === '?')) {
          summaryText += `\nUntracked: ${JSON.stringify(file.path)}`;
          if (text.length >= 60000) { truncated = true; continue; }
          const patch = await g(['diff', '--no-index', '--no-ext-diff', '--no-textconv', '--no-color', '--', '/dev/null', fileValue(file.path)], { allowFailure: true, truncate: true });
          if (patch.code > 1) throw new Error(patch.stderr);
          const combined = text + '\n' + patch.stdout;
          text = combined.slice(0, 60000);
          truncated ||= patch.truncated || combined.length > 60000;
        }
        truncated ||= summaryText.length > 60000;
        return { message: await this.generate({ source, diff: text, summary: summaryText.slice(0, 60000), locale: request.locale, signal }), truncated };
      }
      if (action === 'checkout') {
        if (request.branch) {
          const name = String(request.branch);
          if (name.startsWith('-') || !(await g(['show-ref', '--verify', `refs/heads/${name}`], { allowFailure: true })).stdout) throw new Error('Choose an existing local branch');
          await g(['switch', '--', name]);
        } else await g(['switch', '--detach', hashValue(request.hash)]);
        return { ok: true };
      }
      if (action === 'branch' || action === 'tag') {
        const name = String(request.name || '');
        const valid = await g(['check-ref-format', action === 'branch' ? '--branch' : '--normalize', action === 'branch' ? name : `refs/tags/${name}`], { allowFailure: true });
        if (!name || name.startsWith('-') || valid.code !== 0) throw new Error('Invalid branch or tag name');
        await g([action, name, hashValue(request.hash)]);
        return { ok: true };
      }
      if (action === 'stashSave') {
        const result = await g(['stash', 'push', '--include-untracked', '-m', String(request.message || 'Git Graph stash')]);
        return { ok: true, text: result.stdout };
      }
      if (action === 'stashDrop') {
        const hash = hashValue(request.hash);
        // Resolve the current reflog selector by hash: stash indices can shift
        // while the details or confirmation dialog are open.
        const stashes = await g(['stash', 'list', '--format=%H%x00%gd']);
        const entry = stashes.stdout.split('\n').map(row => row.split('\0')).find(([value]) => value === hash);
        if (!entry || !/^stash@\{\d+\}$/.test(entry[1])) throw new Error('Stash no longer exists; refresh');
        await g(['stash', 'drop', entry[1]]);
        return { ok: true };
      }
      if (action === 'stashApply') {
        const hash = hashValue(request.hash);
        const stashes = await g(['stash', 'list', '--format=%H']);
        if (!stashes.stdout.split('\n').includes(hash)) throw new Error('Stash no longer exists; refresh');
        await g(['stash', 'apply', hash]);
        return { ok: true };
      }
    } finally { if (isWrite) this.locks.delete(root); }
  }
}
