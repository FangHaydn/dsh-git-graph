import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { GitGraphService } from '../git.js';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const gitEnvironment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
Object.assign(gitEnvironment, {
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_TERMINAL_PROMPT: '0',
  GIT_AUTHOR_NAME: 'Integration Test',
  GIT_AUTHOR_EMAIL: 'integration@example.invalid',
  GIT_COMMITTER_NAME: 'Integration Test',
  GIT_COMMITTER_EMAIL: 'integration@example.invalid',
  LC_ALL: 'C',
});

// The production adapter receives argv, never a command string. Keep that contract
// here, including nonzero exits that callers explicitly allow and stdin commits.
function run(cwd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile('git', args, {
      cwd, env: gitEnvironment, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
      signal: options.signal,
    }, (error, stdout, stderr) => {
      if (error && typeof error.code !== 'number') return reject(error);
      const result = { stdout, stderr, code: error?.code ?? 0, truncated: false };
      if (result.code && !options.allowFailure) {
        return reject(Object.assign(new Error(`git ${args[0]} exited ${result.code}: ${stderr}`), result));
      }
      resolve(result);
    });
    child.stdin.on('error', () => {}); // Early Git exits can close stdin first.
    child.stdin.end(options.input);
  });
}

async function repository(t, generate = async () => { throw new Error('Unexpected generation request'); }) {
  await mkdir(testDirectory, { recursive: true });
  const parent = await realpath(testDirectory);
  const root = await mkdtemp(path.join(parent, '.git-graph-test-'));
  const ownedRoot = await realpath(root);
  const ownership = randomUUID();
  const marker = path.join(ownedRoot, '.test-owner');
  await writeFile(marker, ownership);
  t.after(async () => {
    // Refuse recursive removal unless this is the exact root created above,
    // still directly under this test directory, with our unique ownership token.
    assert.equal(path.resolve(root), ownedRoot);
    assert.equal(await realpath(root), ownedRoot);
    assert.equal(path.dirname(ownedRoot), parent);
    assert.match(path.basename(ownedRoot), /^\.git-graph-test-[A-Za-z0-9]+$/);
    assert.equal(await readFile(marker, 'utf8'), ownership);
    await rm(ownedRoot, { recursive: true });
  });
  const cwd = path.join(ownedRoot, 'repository');
  await mkdir(cwd);
  const git = (args, options) => run(cwd, args, options);
  await git(['init', '--initial-branch=main']);
  await git(['config', 'commit.gpgsign', 'false']);
  await git(['config', 'tag.gpgsign', 'false']);
  await git(['config', 'core.autocrlf', 'false']);
  await git(['config', 'core.hooksPath', path.join(ownedRoot, 'empty-hooks')]);
  const service = new GitGraphService(run, generate);
  const execute = request => service.execute(cwd, request);
  const put = async (name, text) => {
    const target = path.join(cwd, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, text);
  };
  const commit = async (message = 'Initial commit') => {
    await git(['add', '--all']);
    await git(['commit', '-F', '-'], { input: message });
    return (await git(['rev-parse', 'HEAD'])).stdout.trim();
  };
  return { cwd, git, execute, put, commit };
}

function file(snapshot, name) {
  const entry = snapshot.files.find(entry => entry.path === name);
  assert.ok(entry, `Expected status entry for ${JSON.stringify(name)}`);
  return entry;
}

async function mergeRepository(t, conflict = false) {
  const repo = await repository(t);
  await repo.put('shared.txt', 'base\n');
  const base = await repo.commit('Base');
  await repo.git(['switch', '-c', 'feature']);
  await repo.put(conflict ? 'shared.txt' : 'feature.txt', 'feature\n');
  const feature = await repo.commit('Feature change');
  await repo.git(['switch', 'main']);
  await repo.put(conflict ? 'shared.txt' : 'main.txt', 'main\n');
  const main = await repo.commit('Main change');
  const result = await repo.git(['merge', '--no-ff', 'feature', '-m', 'Merge feature'], { allowFailure: conflict });
  if (conflict) assert.equal(result.code, 1);
  return { ...repo, base, feature, main };
}

test('generation prefers staged content and excludes subsequent working changes and untracked files', async t => {
  let input;
  const { execute, put, commit, git } = await repository(t, async value => { input = value; return 'fix: use staged changes'; });
  await put('tracked.txt', 'base contents\n');
  await commit();
  await put('tracked.txt', 'staged contents\n');
  await execute({ action: 'stage', paths: ['tracked.txt'] });
  await put('tracked.txt', 'working contents\n');
  await put('untracked.txt', 'untracked contents\n');
  const before = (await git(['status', '--porcelain=v1', '-z'])).stdout;
  const result = await execute({ action: 'generate', locale: 'zh' });
  assert.equal(result.message, 'fix: use staged changes');
  assert.equal(result.truncated, false);
  assert.equal(input.source, 'staged');
  assert.equal(input.locale, 'zh');
  assert.match(input.diff, /\+staged contents/);
  assert.doesNotMatch(input.diff, /working contents|untracked/);
  assert.doesNotMatch(input.summary, /untracked/);
  assert.equal((await git(['status', '--porcelain=v1', '-z'])).stdout, before);
  assert.equal((await git(['show', ':tracked.txt'])).stdout, 'staged contents\n');
});

test('generation falls back to tracked working changes, deletions and untracked file contents', async t => {
  let input;
  const { execute, put, commit, git, cwd } = await repository(t, async value => { input = value; return 'feat: describe working changes'; });
  await put('tracked.txt', 'base contents\n');
  await put('deleted.txt', 'deleted contents\n');
  await commit();
  await put('tracked.txt', 'working contents\n');
  const deleted = path.join(cwd, 'deleted.txt');
  assert.equal(await realpath(deleted), deleted);
  assert.equal(path.dirname(deleted), cwd);
  await rm(deleted);
  await put('新文件 with spaces.txt', 'new file contents\n');
  const before = (await git(['status', '--porcelain=v1', '-z'])).stdout;
  await execute({ action: 'generate' });
  assert.equal(input.source, 'worktree');
  assert.match(input.diff, /\+working contents/);
  assert.match(input.diff, /-deleted contents/);
  assert.match(input.diff, /\+new file contents/);
  assert.match(input.summary, /新文件 with spaces\.txt/);
  assert.equal((await git(['status', '--porcelain=v1', '-z'])).stdout, before);
  assert.equal((await git(['diff', '--cached'])).stdout, '');
});

test('generation supports an unborn repository with only untracked files and then staged files', async t => {
  const inputs = [];
  const { execute, put, git } = await repository(t, async value => { inputs.push(value); return 'feat: add initial file'; });
  await put('initial.txt', 'initial contents\n');
  await execute({ action: 'generate' });
  assert.equal(inputs[0].source, 'worktree');
  assert.match(inputs[0].diff, /\+initial contents/);
  assert.equal(file(await execute({ action: 'snapshot' }), 'initial.txt').index, '?');
  await execute({ action: 'stage' });
  await execute({ action: 'generate' });
  assert.equal(inputs[1].source, 'staged');
  assert.match(inputs[1].diff, /\+initial contents/);
  assert.equal((await git(['rev-parse', '--verify', 'HEAD'], { allowFailure: true })).code, 128);
});

test('generation rejects a clean repository before calling the model', async t => {
  const { execute, put, commit } = await repository(t);
  await put('tracked.txt', 'unchanged contents\n');
  await commit();
  await assert.rejects(execute({ action: 'generate' }), /No changes to generate/);
});

test('generation caps combined untracked diff content and reports truncation', async t => {
  let input;
  const { execute, put } = await repository(t, async value => { input = value; return 'feat: add large files'; });
  await put('a-large.txt', 'large contents\n'.repeat(8000));
  await put('b-small.txt', 'later contents\n');
  const result = await execute({ action: 'generate' });
  assert.equal(input.source, 'worktree');
  assert.equal(input.diff.length, 60000);
  assert.match(input.diff, /\+large contents/);
  assert.doesNotMatch(input.diff, /later contents/);
  assert.match(input.summary, /a-large\.txt/);
  assert.match(input.summary, /b-small\.txt/);
  assert.equal(result.truncated, true);
});

test('unborn repository stages and unstages paths without creating HEAD or deleting worktree files', async t => {
  const { execute, put, git, cwd } = await repository(t);
  const name = '初始 file.txt';
  await put(name, 'first version\n');
  let snapshot = await execute({ action: 'snapshot' });
  assert.equal(snapshot.head, null);
  assert.equal(snapshot.branch, 'main');
  assert.deepEqual(snapshot.commits, []);
  assert.equal(file(snapshot, name).index, '?');
  await execute({ action: 'stage', paths: [name] });
  snapshot = await execute({ action: 'snapshot' });
  assert.equal(file(snapshot, name).index, 'A');
  assert.equal(file(snapshot, name).staged, true);
  await execute({ action: 'unstage', paths: [name] });
  snapshot = await execute({ action: 'snapshot' });
  assert.equal(file(snapshot, name).index, '?');
  assert.equal(file(snapshot, name).staged, false);
  assert.equal(await readFile(path.join(cwd, name), 'utf8'), 'first version\n');
  assert.equal((await git(['rev-parse', '--verify', 'HEAD'], { allowFailure: true })).code, 128);
});

test('a nested untracked path shown by snapshot can be staged individually', async t => {
  const { execute, put } = await repository(t);
  const name = 'new folder/初始 file.txt';
  await put(name, 'nested contents\n');
  const snapshot = await execute({ action: 'snapshot' });
  assert.equal(file(snapshot, name).index, '?');
  assert.match((await execute({ action: 'diff', path: name })).text, /\+nested contents/);
  await execute({ action: 'stage', paths: [name] });
  assert.equal(file(await execute({ action: 'snapshot' }), name).staged, true);
});

test('rename, Unicode and space paths survive status, unstaging, commit details and diffs', async t => {
  const { execute, put, commit, git } = await repository(t);
  const original = '原始 file.txt';
  const renamed = '改名 file.txt';
  const text = 'unchanged contents for rename detection\n';
  await put(original, text);
  await commit();
  await put(renamed, text);
  await git(['rm', '--', original]);
  await execute({ action: 'stage', paths: [renamed] });
  let snapshot = await execute({ action: 'snapshot' });
  assert.equal(file(snapshot, renamed).original, original);
  assert.equal(file(snapshot, renamed).index, 'R');
  await execute({ action: 'unstage', paths: [renamed] });
  snapshot = await execute({ action: 'snapshot' });
  assert.equal(snapshot.files.some(entry => entry.staged), false);
  assert.equal(file(snapshot, original).worktree, 'D');
  assert.equal(file(snapshot, renamed).index, '?');
  await execute({ action: 'stage' });
  const result = await execute({ action: 'commit', message: 'Rename Unicode file' });
  const detail = await execute({ action: 'detail', hash: result.hash });
  assert.deepEqual(detail.files, [{ status: 'R100', original, path: renamed }]);
  const diff = await execute({ action: 'diff', hash: result.hash, path: renamed, original });
  assert.match(diff.text, /similarity index 100%/);
  assert.match(diff.text, /rename from/);
  assert.match(diff.text, /rename to/);
  assert.equal(diff.truncated, false);
});

test('multi-line commit messages round-trip through real Git, snapshot and root detail', async t => {
  const { execute, put, git } = await repository(t);
  const name = 'message file.txt';
  const message = 'feat: preserve 多行 messages\n\nFirst body line.\nSecond body line.\n\nFooter: integration';
  await put(name, 'root contents\n');
  await execute({ action: 'stage' });
  const result = await execute({ action: 'commit', message });
  assert.match(result.hash, /^[a-f0-9]{40,64}$/);
  assert.equal((await git(['log', '-1', '--format=%B'])).stdout.trimEnd(), message);
  const snapshot = await execute({ action: 'snapshot' });
  const detail = await execute({ action: 'detail', hash: result.hash });
  for (const entry of [snapshot.commits[0], detail]) {
    assert.equal(entry.hash, result.hash);
    assert.equal(entry.title, 'feat: preserve 多行 messages');
    assert.equal(entry.body, 'First body line.\nSecond body line.\n\nFooter: integration\n');
    assert.deepEqual(entry.parents, []);
  }
  assert.equal(detail.parent, null);
  assert.deepEqual(detail.files, [{ status: 'A', path: name }]);
  assert.match((await execute({ action: 'diff', hash: result.hash, path: name })).text, /\+root contents/);
  assert.deepEqual(snapshot.files, []);
});

test('merge details and diffs choose the requested parent and reject unrelated commits', async t => {
  const { execute, git, main, feature, base } = await mergeRepository(t);
  const hash = (await git(['rev-parse', 'HEAD'])).stdout.trim();
  const first = await execute({ action: 'detail', hash });
  assert.deepEqual(first.parents, [main, feature]);
  assert.equal(first.parent, main);
  assert.deepEqual(first.files, [{ status: 'A', path: 'feature.txt' }]);
  const second = await execute({ action: 'detail', hash, parent: feature });
  assert.equal(second.parent, feature);
  assert.deepEqual(second.files, [{ status: 'A', path: 'main.txt' }]);
  assert.match((await execute({ action: 'diff', hash, parent: main, path: 'feature.txt' })).text, /\+feature/);
  assert.equal((await execute({ action: 'diff', hash, parent: feature, path: 'feature.txt' })).text, '');
  assert.match((await execute({ action: 'diff', hash, parent: feature, path: 'main.txt' })).text, /\+main/);
  await assert.rejects(execute({ action: 'detail', hash, parent: base }), /Selected parent does not belong/);
  await assert.rejects(execute({ action: 'diff', hash, parent: base, path: 'main.txt' }), /Invalid parent/);
});

test('merge statistics describe the selected parent, matching the changed file list', async t => {
  const { execute, git, feature } = await mergeRepository(t);
  const hash = (await git(['rev-parse', 'HEAD'])).stdout.trim();
  const first = await execute({ action: 'detail', hash });
  assert.match(first.stats, /feature\.txt/);
  const second = await execute({ action: 'detail', hash, parent: feature });
  assert.match(second.stats, /main\.txt/);
  assert.doesNotMatch(second.stats, /feature\.txt/);
});

test('checkout switches a Unicode local branch and detaches at a full commit hash', async t => {
  const { execute, git, put, commit } = await repository(t);
  await put('tracked.txt', 'base\n');
  const hash = await commit();
  await execute({ action: 'branch', name: 'feature/多行', hash });
  await execute({ action: 'checkout', branch: 'feature/多行' });
  assert.equal((await git(['symbolic-ref', '--short', 'HEAD'])).stdout.trim(), 'feature/多行');
  await execute({ action: 'checkout', hash });
  assert.equal((await git(['symbolic-ref', '--quiet', 'HEAD'], { allowFailure: true })).code, 1);
  assert.equal((await execute({ action: 'snapshot' })).branch, hash.slice(0, 8));
  await execute({ action: 'checkout', branch: 'main' });
  assert.equal((await execute({ action: 'snapshot' })).branch, 'main');
});

test('branches, lightweight and annotated tags, remote refs and stashes are exposed accurately', async t => {
  const { execute, git, put, commit, cwd } = await repository(t);
  await put('tracked.txt', 'base\n');
  const hash = await commit();
  await execute({ action: 'branch', name: 'feature/多行', hash });
  await execute({ action: 'tag', name: 'release-light', hash });
  await git(['tag', '-a', 'release-annotated', '-m', 'Annotated release', hash]);
  await git(['remote', 'add', 'origin', './local-only-unused-remote']);
  await git(['update-ref', 'refs/remotes/origin/main', hash]);
  await git(['symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main']);
  await put('tracked.txt', 'stash one\n');
  await put('untracked 文件.txt', 'saved untracked\n');
  const firstSave = await execute({ action: 'stashSave', message: 'first stash 多行' });
  assert.deepEqual((await execute({ action: 'snapshot' })).files, [], firstSave.text);
  await put('tracked.txt', 'stash two\n');
  await execute({ action: 'stashSave', message: 'second stash' });
  let snapshot = await execute({ action: 'snapshot' });
  for (const [name, kind] of [
    ['main', 'branch'], ['feature/多行', 'branch'], ['release-light', 'tag'],
    ['release-annotated', 'tag'], ['origin/main', 'remote'],
  ]) {
    const ref = snapshot.refs.find(ref => ref.name === name);
    assert.ok(ref, `Missing ${name}`);
    assert.equal(ref.kind, kind);
    assert.equal(ref.hash, hash, 'Annotated tags should expose the peeled commit');
  }
  assert.equal(snapshot.refs.some(ref => ref.name === 'origin/HEAD'), false);
  assert.equal(snapshot.stashes.length, 2);
  assert.deepEqual(snapshot.stashes.map(stash => stash.name), ['stash@{0}', 'stash@{1}']);
  assert.match(snapshot.stashes[0].title, /second stash/);
  assert.match(snapshot.stashes[1].title, /first stash 多行/);
  for (const stash of snapshot.stashes) {
    assert.ok(Number.isFinite(stash.time) && stash.time > 0);
    assert.ok(snapshot.commits.some(commit => commit.hash === stash.hash));
  }
  assert.deepEqual(snapshot.files, []);
  await execute({ action: 'stashApply', hash: snapshot.stashes[1].hash });
  assert.equal(await readFile(path.join(cwd, 'tracked.txt'), 'utf8'), 'stash one\n');
  assert.equal(await readFile(path.join(cwd, 'untracked 文件.txt'), 'utf8'), 'saved untracked\n');
  snapshot = await execute({ action: 'snapshot', ref: 'refs/tags/release-annotated' });
  assert.deepEqual(snapshot.commits.map(commit => commit.hash), [hash]);
  assert.equal(snapshot.stashes.length, 2, 'Applying a stash must not drop it');
  await assert.rejects(execute({ action: 'snapshot', ref: '--all' }), /Branch or tag no longer exists/);
  await assert.rejects(execute({ action: 'stashApply', hash }), /Stash no longer exists/);
});

test('log limits are bounded, hasMore is correct, and selecting a ref excludes other histories', async t => {
  const { execute, git, put, commit } = await repository(t);
  await put('tracked.txt', 'base\n');
  const initial = await commit();
  const tree = (await git(['rev-parse', 'HEAD^{tree}'])).stdout.trim();
  const hashes = [initial];
  for (let index = 1; index <= 55; index++) {
    const hash = (await git(['commit-tree', tree, '-p', hashes.at(-1)], { input: `History ${index}\n` })).stdout.trim();
    hashes.push(hash);
  }
  await git(['update-ref', 'refs/heads/main', hashes.at(-1)]);
  await git(['branch', 'short-history', initial]);
  for (const limit of [1, 50]) {
    const snapshot = await execute({ action: 'snapshot', limit });
    assert.equal(snapshot.commits.length, 50);
    assert.equal(snapshot.hasMore, true);
    assert.deepEqual(snapshot.commits.map(commit => commit.hash), hashes.slice(-50).reverse());
  }
  for (const limit of [56, 100000]) {
    const snapshot = await execute({ action: 'snapshot', limit });
    assert.equal(snapshot.commits.length, 56);
    assert.equal(snapshot.hasMore, false);
  }
  const filtered = await execute({ action: 'snapshot', ref: 'refs/heads/short-history' });
  assert.deepEqual(filtered.commits.map(commit => commit.hash), [initial]);
  assert.equal(filtered.hasMore, false);

  // fast-import creates a real long history in one Git invocation, so the upper
  // bound is exercised against >1000 commits without spawning 1000 processes.
  let history = '';
  for (let index = 1; index <= 1005; index++) {
    const message = `Long history ${index}\n`;
    history += `commit refs/heads/long-history\nmark :${index}\n`
      + `committer Integration Test <integration@example.invalid> ${1700000000 + index} +0000\n`
      + `data ${Buffer.byteLength(message)}\n${message}\n`
      + `from ${index === 1 ? initial : `:${index - 1}`}\n\n`;
  }
  await git(['fast-import', '--quiet'], { input: history });
  const bounded = await execute({ action: 'snapshot', ref: 'refs/heads/long-history', limit: 100000 });
  assert.equal(bounded.commits.length, 1000);
  assert.equal(bounded.hasMore, true);
  assert.equal(bounded.commits[0].title, 'Long history 1005');
  assert.equal(bounded.commits.at(-1).title, 'Long history 6');
});

test('commit refuses unstaged-only changes and commits only the staged version', async t => {
  const { execute, put, commit, git, cwd } = await repository(t);
  await put('tracked.txt', 'base\n');
  const initial = await commit();
  await put('tracked.txt', 'unstaged\n');
  await assert.rejects(execute({ action: 'commit', message: 'Must refuse' }), /Stage changes before committing/);
  assert.equal((await git(['rev-parse', 'HEAD'])).stdout.trim(), initial);
  await execute({ action: 'stage', paths: ['tracked.txt'] });
  await put('tracked.txt', 'later unstaged version\n');
  await assert.rejects(execute({ action: 'commit', message: ' \n ' }), /valid commit message/);
  const result = await execute({ action: 'commit', message: 'Staged content only' });
  assert.equal((await git(['show', `${result.hash}:tracked.txt`])).stdout, 'unstaged\n');
  assert.equal(await readFile(path.join(cwd, 'tracked.txt'), 'utf8'), 'later unstaged version\n');
  const entry = file(await execute({ action: 'snapshot' }), 'tracked.txt');
  assert.equal(entry.staged, false);
  assert.equal(entry.unstaged, true);
});

test('commit refuses unresolved merge conflicts and keeps HEAD and index unchanged', async t => {
  const { execute, git, main } = await mergeRepository(t, true);
  const before = (await git(['ls-files', '--stage'])).stdout;
  assert.equal(file(await execute({ action: 'snapshot' }), 'shared.txt').conflict, true);
  await assert.rejects(execute({ action: 'commit', message: 'Must not resolve conflict' }), /Resolve merge conflicts/);
  assert.equal((await git(['rev-parse', 'HEAD'])).stdout.trim(), main);
  assert.equal((await git(['ls-files', '--stage'])).stdout, before);
});

test('unsafe repository paths, revisions, parent hashes and ref names are rejected without mutation', async t => {
  const { execute, git, put, commit } = await repository(t);
  await put('safe.txt', 'base\n');
  const hash = await commit();
  await put('safe.txt', 'pending\n');
  const status = (await git(['status', '--porcelain=v1', '-z'])).stdout;
  const refs = (await git(['show-ref'])).stdout;
  for (const unsafe of ['../outside', 'nested/../../outside', '..\\outside', '/tmp/outside', '', 'bad\0name']) {
    for (const action of ['stage', 'unstage']) {
      await assert.rejects(execute({ action, paths: [unsafe] }), /Invalid repository-relative path/);
    }
    await assert.rejects(execute({ action: 'diff', path: unsafe }), /Invalid repository-relative path/);
    if (unsafe) await assert.rejects(execute({ action: 'diff', hash, path: 'safe.txt', original: unsafe }), /Invalid repository-relative path/);
  }
  for (const unsafe of ['HEAD', '--all', 'a'.repeat(39), 'g'.repeat(40), `${hash};echo injected`]) {
    await assert.rejects(execute({ action: 'detail', hash: unsafe }), /full commit hash/);
    await assert.rejects(execute({ action: 'diff', hash: unsafe, path: 'safe.txt' }), /full commit hash/);
    await assert.rejects(execute({ action: 'detail', hash, parent: unsafe }), /full commit hash/);
    await assert.rejects(execute({ action: 'checkout', hash: unsafe }), /full commit hash/);
    await assert.rejects(execute({ action: 'stashApply', hash: unsafe }), /full commit hash/);
  }
  for (const name of ['-option', '../outside', 'bad..name', 'bad name', 'bad~name', 'bad:ref', 'bad\\name', 'bad@{name', 'trailing/', '']) {
    for (const action of ['branch', 'tag']) {
      await assert.rejects(execute({ action, name, hash }), `${action} must reject ${JSON.stringify(name)}`);
    }
  }
  await assert.rejects(execute({ action: 'checkout', branch: '--detach' }), /existing local branch/);
  assert.equal((await git(['status', '--porcelain=v1', '-z'])).stdout, status);
  assert.equal((await git(['show-ref'])).stdout, refs);
  assert.equal((await git(['rev-parse', 'HEAD'])).stdout.trim(), hash);
});

test('stage and unstage treat Git pathspec syntax and option-looking filenames literally', async t => {
  const { execute, put } = await repository(t);
  const names = ['*.txt', 'matches.txt', ':(glob)*.txt', '-option.txt', '空 格.txt'];
  for (const name of names) await put(name, `${name}\n`);
  for (const name of ['*.txt', ':(glob)*.txt', '-option.txt', '空 格.txt']) {
    await execute({ action: 'stage', paths: [name] });
    const staged = (await execute({ action: 'snapshot' })).files.filter(entry => entry.staged).map(entry => entry.path);
    assert.deepEqual(staged, [name], 'Only the exact selected file may be staged');
    await execute({ action: 'unstage', paths: [name] });
    assert.equal((await execute({ action: 'snapshot' })).files.some(entry => entry.staged), false);
  }
});
