import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../client.js', import.meta.url), 'utf8');
const ID = '@local/dsh-git-graph';

function loadSplitter(mainHeight = 600, changesHeight = 240) {
  const listeners = new Map(), ratios = [], states = [];
  const cleanup = { current: null };
  const context = {
    mainRef: { current: { getBoundingClientRect: () => ({ height: mainHeight }) } },
    changesRef: { current: { getBoundingClientRect: () => ({ height: changesHeight }) } },
    resizeCleanup: cleanup, dismissPreview: () => {},
    useCallback: fn => fn, useEffect: () => {},
    setChangesRatio: value => ratios.push(value), setResizing: value => states.push(value),
    window: {
      addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: name => listeners.delete(name),
    },
  };
  const start = source.indexOf('          const clampSplit=');
  const end = source.indexOf('          const group=', start);
  const controls = vm.runInNewContext(source.slice(start, end) + '\n({startResize,resizeByKey});', context);
  return { ...controls, listeners, ratios, states, cleanup };
}

test('history splitter clamps drag height and removes listeners on release or cancellation', () => {
  for (const finish of ['pointerup', 'pointercancel']) {
    const splitter = loadSplitter();
    splitter.startResize({ button: 0, clientY: 100, preventDefault() {} });
    assert.equal(splitter.states[0], true);
    splitter.listeners.get('pointermove')({ clientY: 160, preventDefault() {} });
    assert.equal(splitter.ratios.at(-1), 0.5);
    splitter.listeners.get('pointermove')({ clientY: 2000, preventDefault() {} });
    assert.equal(splitter.ratios.at(-1), 460 / 600);
    splitter.listeners.get('pointermove')({ clientY: -2000, preventDefault() {} });
    assert.equal(splitter.ratios.at(-1), 96 / 600);
    splitter.listeners.get(finish)();
    assert.equal(splitter.states.at(-1), false);
    assert.equal(splitter.listeners.size, 0);
    assert.equal(splitter.cleanup.current, null);
  }
});

test('history splitter supports arrow keys and ignores secondary pointer buttons', () => {
  const splitter = loadSplitter();
  splitter.startResize({ button: 2 });
  assert.equal(splitter.listeners.size, 0);
  splitter.resizeByKey({ key: 'ArrowDown', preventDefault() {} });
  assert.equal(splitter.ratios.at(-1), 256 / 600);
  splitter.resizeByKey({ key: 'ArrowUp', shiftKey: true, preventDefault() {} });
  assert.equal(splitter.ratios.at(-1), 192 / 600);
  splitter.resizeByKey({ key: 'Enter' });
  assert.equal(splitter.ratios.length, 2);
});

function loadClient() {
  let plugin;
  const slots = new Map(), types = [], optional = [], calls = [];
  const React = {
    Fragment: Symbol('Fragment'),
    createElement: (type, props, ...children) => ({ type, props, children }),
    useCallback: fn => fn,
    useMemo: fn => fn(),
    useState: initial => [initial, () => {}],
    useEffect: () => {},
    useSyncExternalStore: () => 0,
  };
  vm.runInNewContext(source, {
    window: { __ModuleLoader__: { load({ factory }) {
      plugin = factory(name => name === 'react' ? React : name === '@deepseek-ai/dsh-client-ui-primitives' ? { Menu: Symbol('Menu') } : {});
    } } },
  });
  plugin.apply({
    effect: fn => fn(),
    locale: { register: () => () => {}, bind: () => key => key, subscribe: () => () => {}, getSnapshot: () => 0 },
    sidebarRightTabs: { register: type => { types.push(type); return () => {}; } },
    slots: {
      inject: (_name, fn) => fn(),
      register: (options, component) => { slots.set(options.name, { options, component }); return () => {}; },
    },
    inject: (services, callback) => { optional.push({ services, callback }); },
    remote: { commands: { execute: (...args) => { calls.push([args[0], args[1], Array.from(args[2]), args[3]]); return 'result'; } } },
  });
  return { slots, types, optional, calls };
}

test('branch selector registers in the session-scoped hero options row', () => {
  const { slots } = loadClient();
  const entry = slots.get('conversation.hero.options');
  assert.equal(entry.options.id, ID);
  assert.equal(entry.options.order, 35);
  assert.equal(entry.options.inject('new-session').sessionId, 'new-session');
  assert.equal(typeof entry.component, 'function');
  const control = entry.component({ sessionId: 'new-session', useSession: select => select({ cwd: '/repo' }) });
  const placeholder = control.children[1];
  assert.equal(placeholder.type, 'button');
  assert.equal(placeholder.props.disabled, true);
  assert.equal(placeholder.children[1], 'branchLoading');
});

test('native sidebar works independently and renders its title with the graph icon', () => {
  const { slots, types } = loadClient();
  assert.equal(types.length, 1);
  assert.equal(types[0].kind, 'local-git-graph');
  const title = slots.get('sidebar.right.pane.tab.title');
  assert.equal(title.options.key, ID);
  const rendered = title.component({ useTabInfo: () => ({ tab: { title: 'Git Graph' } }) });
  assert.equal(rendered.children[1], 'Git Graph');
  const icon = rendered.children[0];
  const svg = icon.type(icon.props);
  assert.equal(svg.type, 'svg');
  assert.equal(svg.props.width, 16);
  assert.equal(svg.children.filter(child => child.type === 'circle').length, 3);
  assert.ok(svg.children[0].props.stroke.includes('#0085d9'), 'Icon has a colour fallback outside the panel');
});

test('optional workspace registration exposes one bottom entry without another native tab', () => {
  const { optional, types, calls } = loadClient();
  assert.deepEqual(Array.from(optional[0].services), ['betterSidebar']);
  let descriptor;
  const dispose = () => {};
  assert.equal(optional[0].callback({ betterSidebar: { registerTab(value) { descriptor = value; return dispose; } } }), dispose);
  assert.equal(descriptor.id, ID);
  assert.equal(descriptor.title(), 'Git Graph');
  assert.equal(descriptor.bottomOnly, true);
  assert.equal(descriptor.single, true);
  assert.equal(types.length, 1, 'Existing native registration remains unique');
  const icon = descriptor.icon(20);
  assert.equal(icon.type(icon.props).props.width, 20);

  const first = descriptor.component({ scope: { sessionId: 'workspace-a' }, visible: true });
  assert.equal(first.props.key, 'workspace-a');
  assert.equal(first.props.sessionId, 'workspace-a');
  assert.equal(first.props.tab.visible, true);
  const signal = new AbortController().signal;
  assert.equal(first.props.executeCommand('/local-git-graph {}', signal), 'result');
  assert.deepEqual(calls[0], ['workspace-a', '/local-git-graph {}', [], signal]);

  const next = descriptor.component({ scope: { sessionId: 'workspace-b' }, visible: false });
  assert.equal(next.type, first.type, 'Both workspaces share the same panel implementation');
  assert.notEqual(next.props.key, first.props.key, 'Changing sessions resets panel state');
  assert.equal(next.props.tab.visible, false);
  next.props.executeCommand('/local-git-graph {}', signal);
  assert.equal(calls[1][0], 'workspace-b');
});

test('native and workspace adapters share the panel while retaining native command bindings', () => {
  const { slots, optional, calls } = loadClient();
  let descriptor;
  optional[0].callback({ betterSidebar: { registerTab(value) { descriptor = value; } } });
  const body = slots.get('sidebar.right.pane.tab');
  const signal = new AbortController().signal;
  const tab = { visible: true, signal, actions: { bindCommands() {} } };
  const injected = body.options.inject('native-session');
  const native = body.component({ sessionId: 'native-session', ...injected, useTabInfo: () => ({ tab }) });
  const workspace = descriptor.component({ scope: { sessionId: 'native-session' }, visible: true });
  assert.equal(native.type, workspace.type);
  assert.equal(native.props.tab, tab);
  native.props.executeCommand('/local-git-graph {}', signal);
  assert.deepEqual(calls[0], ['native-session', '/local-git-graph {}', [], signal]);
});

// ---------------------------------------------------------------------------
// Inline detail regression tests.
//
// The commit detail used to be a hover preview. It now lives inline: clicking a
// row expands an absolutely-positioned detail panel under that row, closes on a
// second click, ignores stale detail responses, and offers tree / flat file
// views. Everything below drives the real helpers and the real Panel component;
// only React's hook runtime is supplied by this file.

const ROW_HEIGHT_SEEN = 32; // stable layout constant, re-derived below from the rendered rows

let activeRuntime = null;

function flattenChildren(input, out = []) {
  for (const value of input) {
    if (Array.isArray(value)) flattenChildren(value, out);
    else if (value === null || value === undefined || value === false || value === true) continue;
    else out.push(value);
  }
  return out;
}

const ReactMock = {
  Fragment: Symbol('Fragment'),
  createElement(type, props, ...children) {
    const kids = flattenChildren(children);
    const next = { ...(props || {}) };
    if (kids.length) next.children = kids.length === 1 ? kids[0] : kids;
    return { type, props: next, children: kids };
  },
  useState(...args) { return activeRuntime.useState(...args); },
  useEffect(...args) { return activeRuntime.useEffect(...args); },
  useLayoutEffect(...args) { return activeRuntime.useEffect(...args); },
  useRef(...args) { return activeRuntime.useRef(...args); },
  useMemo(...args) { return activeRuntime.useMemo(...args); },
  useCallback(...args) { return activeRuntime.useCallback(...args); },
  useSyncExternalStore(...args) { return activeRuntime.useSyncExternalStore(...args); },
};

function makeRequire() {
  return name => {
    if (name === 'react') return ReactMock;
    if (name === '@deepseek-ai/dsh-client-ui-primitives') return { Menu: Symbol('Menu') };
    if (name === 'react-dom') return { createPortal: element => element };
    return {};
  };
}

function instrumentedSource() {
  const marker = "\n    return {\n      inject:['slots'";
  const at = source.indexOf(marker);
  assert.notEqual(at, -1, 'client.js keeps its helper scope before the plugin object');
  return source.slice(0, at) + '\n    __ggCapture({ fileTree, historyLayout, ROW_HEIGHT });' + source.slice(at);
}

function runModule({ instrument = false, timers = {} } = {}) {
  let factory = null, captured = null;
  const sandbox = {
    window: {
      __ModuleLoader__: { load(descriptor) { factory = descriptor.factory; } },
      addEventListener() {}, removeEventListener() {}, innerWidth: 1280, innerHeight: 900,
    },
    document: {
      addEventListener() {}, removeEventListener() {},
      hidden: false, body: {}, querySelector() { return null; },
    },
    navigator: { platform: 'Linux', clipboard: { writeText: async () => {} } },
    AbortController, AbortSignal, Intl, console,
    ResizeObserver: class { observe() {} disconnect() {} },
    setTimeout: timers.setTimeout || setTimeout, clearTimeout: timers.clearTimeout || clearTimeout,
    __ggCapture(value) { captured = value; },
  };
  vm.runInNewContext(instrument ? instrumentedSource() : source, sandbox);
  const plugin = factory(makeRequire());
  return { plugin, sandbox, captured };
}

function getInternals() {
  const { captured } = runModule({ instrument: true });
  assert.ok(captured, 'captured fileTree / historyLayout helpers');
  return captured;
}

function sameDeps(previous, next) {
  if (previous === undefined || next === undefined) return false;
  if (!previous || !next || previous.length !== next.length) return false;
  for (let index = 0; index < previous.length; index++) if (!Object.is(previous[index], next[index])) return false;
  return true;
}

function makeHookRuntime() {
  const hooks = [];
  let cursor = 0, dirty = false, pendingEffects = [], component = null, props = null, tree = null;

  function slot(kind) {
    const index = cursor++;
    if (!hooks[index] || hooks[index].kind !== kind) hooks[index] = { kind };
    return hooks[index];
  }

  const runtime = {
    useState(initial) {
      const state = slot('state');
      if (!('value' in state)) state.value = typeof initial === 'function' ? initial() : initial;
      if (!state.set) state.set = next => {
        const value = typeof next === 'function' ? next(state.value) : next;
        if (Object.is(value, state.value)) return;
        state.value = value;
        dirty = true;
      };
      return [state.value, state.set];
    },
    useRef(initial) {
      const ref = slot('ref');
      if (!('value' in ref)) ref.value = { current: initial };
      return ref.value;
    },
    useMemo(factoryFn, deps) {
      const memo = slot('memo');
      if (!('deps' in memo) || !sameDeps(memo.deps, deps)) { memo.deps = deps; memo.value = factoryFn(); }
      return memo.value;
    },
    useCallback(fn, deps) {
      const callback = slot('callback');
      if (!('deps' in callback) || !sameDeps(callback.deps, deps)) { callback.deps = deps; callback.fn = fn; }
      return callback.fn;
    },
    useEffect(fn, deps) {
      const effect = slot('effect');
      if (!('deps' in effect) || !sameDeps(effect.deps, deps)) { effect.deps = deps; effect.fn = fn; pendingEffects.push(effect); }
    },
    useSyncExternalStore(_subscribe, getSnapshot) { return getSnapshot(); },
  };

  function renderOnce() {
    cursor = 0;
    pendingEffects = [];
    const previous = activeRuntime;
    activeRuntime = runtime;
    try { tree = component(props); } finally { activeRuntime = previous; }
    for (const effect of pendingEffects) {
      if (typeof effect.cleanup === 'function') { try { effect.cleanup(); } catch {} }
      const cleanup = effect.fn();
      if (typeof cleanup === 'function') effect.cleanup = cleanup;
      else effect.cleanup = undefined;
    }
  }

  function flush() {
    let guard = 0;
    while (dirty) {
      dirty = false;
      renderOnce();
      if (++guard > 500) throw new Error('panel render loop did not settle');
    }
  }

  return {
    get tree() { return tree; },
    mount(nextComponent, nextProps) { component = nextComponent; props = nextProps; dirty = true; flush(); },
    flush,
    async act(fn) {
      if (fn) fn();
      for (let tick = 0; tick < 40; tick++) { flush(); await Promise.resolve(); }
      flush();
    },
  };
}

const PANEL_COMMITS = [
  { hash: 'c0', shortHash: 'c0', title: 'Root commit', author: 'Ann', email: 'ann@example.com', time: 1700000000000, parents: [] },
  { hash: 'c1', shortHash: 'c1', title: 'Second commit', author: 'Bob', email: 'bob@example.com', time: 1700000100000, parents: ['c0'] },
  { hash: 'c2', shortHash: 'c2', title: 'Third commit', author: 'Cid', email: 'cid@example.com', time: 1700000200000, parents: ['c1'] },
];

function snapshotValue() {
  return {
    repository: '/repo', branch: 'main', head: 'c0', hasMore: false, hasRemotes: true,
    files: [], refs: [], stashes: [],
    commits: PANEL_COMMITS.map(commit => ({ ...commit, parents: [...commit.parents] })),
  };
}

function detailValue(hash) {
  const commit = PANEL_COMMITS.find(item => item.hash === hash);
  return {
    ...commit,
    body: 'Body of ' + commit.title,
    files: [
      { path: 'README.md', status: 'M' },
      { path: 'src/index.js', status: 'M' },
      { path: 'src/lib/util.js', status: 'A' },
    ],
  };
}

function rpcSuccess(value) {
  return { ok: true, value: { result: { kind: 'ok', text: JSON.stringify(value) } } };
}

function createExecutor({ deferredDetails = false } = {}) {
  const calls = [];
  const detailResolvers = new Map();
  const execute = line => {
    const request = JSON.parse(line.replace('/local-git-graph ', ''));
    calls.push(request);
    if (request.action === 'snapshot') return Promise.resolve(rpcSuccess(snapshotValue()));
    if (request.action === 'detail') {
      if (deferredDetails) {
        return new Promise(resolve => { detailResolvers.set(request.hash, value => resolve(rpcSuccess(value))); });
      }
      return Promise.resolve(rpcSuccess(detailValue(request.hash)));
    }
    return Promise.resolve(rpcSuccess({}));
  };
  return { execute, calls, detailResolvers };
}

function mountPanel(executor, moduleOptions) {
  const { plugin } = runModule(moduleOptions);
  const slots = new Map();
  plugin.apply({
    effect: fn => fn(),
    locale: {
      register: () => () => {}, bind: () => key => key, subscribe: () => () => {},
      getSnapshot: () => 0, getLocale: () => ({ active: 'en' }),
    },
    sidebarRightTabs: { register: () => () => {} },
    slots: {
      inject: (_name, fn) => fn(),
      register: (options, component) => { slots.set(options.name, { options, component }); return () => {}; },
    },
    inject: () => {},
    remote: { commands: { execute: executor.execute } },
  });
  const native = slots.get('sidebar.right.pane.tab').component;
  const tab = { visible: true };
  const element = native({ sessionId: 'inline-session', executeCommand: executor.execute, useTabInfo: () => ({ tab }) });
  const runtime = makeHookRuntime();
  runtime.mount(element.type, element.props);
  return runtime;
}

function expandNode(node) {
  if (node === null || node === undefined || node === false || node === true) return null;
  if (typeof node === 'string' || typeof node === 'number') return node;
  if (Array.isArray(node)) {
    const result = [];
    for (const item of node) {
      const expanded = expandNode(item);
      if (Array.isArray(expanded)) result.push(...expanded);
      else if (expanded !== null) result.push(expanded);
    }
    return result;
  }
  if (node.type === ReactMock.Fragment) return expandNode(node.children);
  if (typeof node.type === 'function') return expandNode(node.type(node.props));
  const children = expandNode(node.children);
  return { type: node.type, props: node.props, children: Array.isArray(children) ? children : children == null ? [] : [children] };
}

function collectHosts(node, out = []) {
  if (node === null || node === undefined) return out;
  if (Array.isArray(node)) { for (const item of node) collectHosts(item, out); return out; }
  if (typeof node === 'object' && typeof node.type !== 'undefined') { out.push(node); collectHosts(node.children, out); }
  return out;
}

function nodeText(node) {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  return nodeText(node.children);
}

function hostsOf(runtime) { return collectHosts(expandNode(runtime.tree)); }

function rowsOf(runtime) {
  return hostsOf(runtime)
    .filter(node => node.type === 'button' && typeof node.props.className === 'string' && node.props.className.split(' ').includes('gg-row'))
    .sort((a, b) => a.props['data-index'] - b.props['data-index']);
}

function inlineDetailOf(runtime) {
  return hostsOf(runtime).find(node => node.type === 'aside' && typeof node.props.className === 'string' && node.props.className.includes('gg-inline-details'));
}

function spacerHeight(runtime) {
  const spacer = hostsOf(runtime).find(node => node.type === 'div' && node.props.style && node.props.style.position === 'relative' && typeof node.props.style.height === 'number');
  assert.ok(spacer, 'history spacer is rendered');
  return spacer.props.style.height;
}

test('historyLayout offsets every row after the single expanded commit', () => {
  const { historyLayout, ROW_HEIGHT } = getInternals();
  assert.equal(ROW_HEIGHT, ROW_HEIGHT_SEEN, 'row height used by the layout helper');

  const commits = [{ hash: 'a' }, { hash: 'b' }, { hash: 'c' }];

  const collapsed = historyLayout(commits, null, 360);
  assert.equal(collapsed.expandedIndex, -1);
  assert.equal(collapsed.total, 3 * ROW_HEIGHT);
  assert.deepEqual([0, 1, 2, 3].map(collapsed.rowTop), [0, ROW_HEIGHT, 2 * ROW_HEIGHT, 3 * ROW_HEIGHT]);

  const middle = historyLayout(commits, 'b', 360);
  assert.equal(middle.expandedIndex, 1, 'exactly one expanded index');
  assert.equal(middle.total, 3 * ROW_HEIGHT + 360, 'expanded height is added once');
  assert.deepEqual([0, 1, 2, 3].map(middle.rowTop), [0, ROW_HEIGHT, 2 * ROW_HEIGHT + 360, 3 * ROW_HEIGHT + 360], 'rows after the expanded row shift by the detail height');

  const first = historyLayout(commits, 'a', 360);
  assert.equal(first.expandedIndex, 0);
  assert.deepEqual([0, 1, 2].map(first.rowTop), [0, ROW_HEIGHT + 360, 2 * ROW_HEIGHT + 360]);

  const duplicate = historyLayout([{ hash: 'a' }, { hash: 'b' }, { hash: 'a' }], 'a', 360);
  assert.equal(duplicate.expandedIndex, 0, 'only the first matching commit expands');
  assert.deepEqual([0, 1, 2].map(duplicate.rowTop), [0, ROW_HEIGHT + 360, 2 * ROW_HEIGHT + 360]);

  const unknown = historyLayout(commits, 'missing', 360);
  assert.equal(unknown.expandedIndex, -1);
  assert.equal(unknown.total, 3 * ROW_HEIGHT);
  assert.equal(unknown.rowTop(2), 2 * ROW_HEIGHT);
});

test('fileTree keeps full paths and lets a folder and a file share a basename', () => {
  const { fileTree } = getInternals();
  const files = [
    { path: 'src', status: 'M' },
    { path: 'src/index.js', status: 'M' },
    { path: 'src/lib/util.js', status: 'A' },
    { path: 'README.md', status: 'M' },
  ];

  const tree = fileTree(files);
  assert.equal(tree.files.length, 2, 'root keeps a file that shares a name with a folder');
  assert.equal(tree.files[0], files[0], 'file objects are preserved by reference');
  assert.equal(tree.files[0].path, 'src');
  assert.equal(tree.files[1], files[3]);
  assert.equal(tree.files[1].path, 'README.md');

  assert.ok(tree.folders.has('src'), 'folder with the same basename as a file still exists');
  const src = tree.folders.get('src');
  assert.equal(src.files.length, 1);
  assert.equal(src.files[0], files[1], 'nested file keeps identity');
  assert.equal(src.files[0].path, 'src/index.js', 'full path is retained, not just the basename');

  const lib = src.folders.get('lib');
  assert.ok(lib, 'deep folder is nested');
  assert.equal(lib.files.length, 1);
  assert.equal(lib.files[0], files[2]);
  assert.equal(lib.files[0].path, 'src/lib/util.js');
});

test('fetch visibility follows configured remotes when the panel refreshes', async () => {
  const executor = createExecutor(), execute = executor.execute;
  let hasRemotes = false;
  executor.execute = line => {
    const result = execute(line);
    if (JSON.parse(line.replace('/local-git-graph ', '')).action === 'snapshot') {
      return Promise.resolve(rpcSuccess({ ...snapshotValue(), hasRemotes }));
    }
    return result;
  };
  const runtime = mountPanel(executor);
  await runtime.act();
  const fetchButton = () => hostsOf(runtime).find(node => node.type === 'button' && node.props['aria-label'] === 'fetch');
  const refresh = () => hostsOf(runtime).find(node => node.type === 'button' && node.props['aria-label'] === 'refresh').props.onClick();
  assert.equal(fetchButton(), undefined);
  hasRemotes = true;
  await runtime.act(refresh);
  assert.ok(fetchButton(), 'configured remotes show fetch even before any remote refs exist');
  hasRemotes = false;
  await runtime.act(refresh);
  assert.equal(fetchButton(), undefined, 'removing all remotes hides fetch after refresh');
});

test('fetch visibility supports old Host snapshots while respecting explicit remote configuration', async () => {
  const remote = { kind: 'remote', name: 'origin/main', fullName: 'refs/remotes/origin/main', hash: 'c0' };
  const cases = [
    { hasRemotes: undefined, refs: [remote], visible: true },
    { hasRemotes: undefined, refs: [], visible: false },
    { hasRemotes: false, refs: [remote], visible: false },
    { hasRemotes: true, refs: [], visible: true },
  ];
  for (const { hasRemotes, refs, visible } of cases) {
    const executor = createExecutor(), execute = executor.execute;
    executor.execute = line => {
      const result = execute(line);
      if (JSON.parse(line.replace('/local-git-graph ', '')).action === 'snapshot') {
        return Promise.resolve(rpcSuccess({ ...snapshotValue(), hasRemotes, refs }));
      }
      return result;
    };
    const runtime = mountPanel(executor);
    await runtime.act();
    const fetch = hostsOf(runtime).find(node => node.type === 'button' && node.props['aria-label'] === 'fetch');
    assert.equal(!!fetch, visible, `hasRemotes=${hasRemotes}, remote refs=${refs.length}`);
  }
});

function fakeTimers() {
  const jobs = new Map();
  let nextId = 0;
  return {
    jobs,
    setTimeout(fn, delay) { const id = ++nextId; jobs.set(id, { fn, delay }); return id; },
    clearTimeout(id) { jobs.delete(id); },
    fire(id) { const job = jobs.get(id); assert.ok(job); jobs.delete(id); job.fn(); },
  };
}

test('history header fetch works while folded, prevents duplicates and shows a closing toast', async () => {
  const executor = createExecutor(), execute = executor.execute;
  let finishFetch;
  executor.execute = line => {
    const result = execute(line);
    if (JSON.parse(line.replace('/local-git-graph ', '')).action === 'fetch') {
      return new Promise(resolve => { finishFetch = () => resolve(rpcSuccess({ ok: true })); });
    }
    return result;
  };
  const timers = fakeTimers();
  const runtime = mountPanel(executor, { timers });
  await runtime.act();
  const history = () => hostsOf(runtime).find(node => node.type === 'section' && node.props.className.startsWith('gg-history'));
  const button = label => collectHosts(history()).find(node => node.type === 'button' && node.props['aria-label'] === label);
  assert.equal(button('fetch').props.title, 'fetch');
  assert.ok(button('fetch').children.some(node => node.type === 'svg'));
  await runtime.act(() => button('history').props.onClick());
  assert.ok(history().props.className.includes('gg-folded'));
  const snapshots = executor.calls.filter(call => call.action === 'snapshot').length;
  const initialFetch = button('fetch');
  await runtime.act(() => { initialFetch.props.onClick(); initialFetch.props.onClick(); });
  assert.equal(executor.calls.filter(call => call.action === 'fetch').length, 1);
  assert.equal(button('fetching').props.disabled, true);
  assert.equal(button('fetching').props['aria-busy'], true);
  assert.ok(button('fetching').children[0].props.className.includes('gg-spinning'));
  assert.equal(executor.calls.filter(call => call.action === 'snapshot').length, snapshots);
  finishFetch();
  await runtime.act();
  assert.equal(executor.calls.filter(call => call.action === 'snapshot').length, snapshots + 1);
  assert.equal(button('fetch').props.disabled, false);
  assert.equal(button('fetch').props['aria-busy'], false);
  const toast = () => hostsOf(runtime).find(node => node.props.className === 'gg-toast-portal');
  assert.equal(nodeText(toast()), 'fetched');
  const timer = [...timers.jobs.entries()].find(([,job]) => job.delay === 4000)?.[0];
  assert.ok(timer, 'success toast auto-dismiss is scheduled');
  timers.fire(timer);
  await runtime.act();
  assert.equal(toast(), undefined, 'success toast disappears automatically');
});

test('repeated successes restart the toast lifetime and stale timers cannot close a newer toast', async () => {
  const executor = createExecutor(), timers = fakeTimers();
  const runtime = mountPanel(executor, { timers });
  await runtime.act();
  const fetch = () => hostsOf(runtime).find(node => node.type === 'button' && node.props['aria-label'] === 'fetch').props.onClick();
  const toast = () => hostsOf(runtime).find(node => node.props.className === 'gg-toast-portal');
  await runtime.act(fetch);
  const [firstId, firstJob] = [...timers.jobs.entries()].find(([,job]) => job.delay === 4000);
  await runtime.act(fetch);
  assert.equal(timers.jobs.has(firstId), false, 'previous timer is cancelled');
  const secondId = [...timers.jobs.entries()].find(([,job]) => job.delay === 4000)?.[0];
  assert.ok(secondId && secondId !== firstId, 'the next success starts a fresh timer');
  firstJob.fn();
  await runtime.act();
  assert.equal(nodeText(toast()), 'fetched', 'an already queued old timer cannot dismiss the latest success');
  assert.equal(hostsOf(runtime).some(node => node.props.className === 'gg-notice'), false, 'success is absent from the persistent notice area');
  timers.fire(secondId);
  await runtime.act();
  assert.equal(toast(), undefined);
});

test('commits show a temporary success toast without a separate auto-stage toast', async () => {
  const executor = createExecutor(), execute = executor.execute, timers = fakeTimers();
  executor.execute = line => {
    const result = execute(line);
    if (JSON.parse(line.replace('/local-git-graph ', '')).action === 'snapshot') {
      return Promise.resolve(rpcSuccess({ ...snapshotValue(), files: [{ path: 'work.txt', index: ' ', worktree: 'M', staged: false, unstaged: true, conflict: false }] }));
    }
    return result;
  };
  const runtime = mountPanel(executor, { timers });
  await runtime.act();
  const input = hostsOf(runtime).find(node => node.type === 'textarea');
  await runtime.act(() => input.props.onChange({ target: { value: 'feat: add change' } }));
  const commit = hostsOf(runtime).find(node => node.type === 'button' && node.props['aria-label'] === 'commit');
  await runtime.act(() => commit.props.onClick());
  assert.deepEqual(executor.calls.filter(call => ['stage', 'commit'].includes(call.action)).map(call => call.action), ['stage', 'commit']);
  const toast = hostsOf(runtime).find(node => node.props.className === 'gg-toast-portal');
  assert.equal(nodeText(toast), 'committedSuccess');
  assert.ok([...timers.jobs.values()].some(job => job.delay === 4000), 'commit success toast is temporary');
});

test('fetch errors are visible and the button can retry', async () => {
  const executor = createExecutor(), execute = executor.execute;
  let fail = true;
  executor.execute = async line => {
    const result = await execute(line);
    if (fail && JSON.parse(line.replace('/local-git-graph ', '')).action === 'fetch') {
      return { ok: true, value: { result: { kind: 'error', text: 'Remote connection failed' } } };
    }
    return result;
  };
  const runtime = mountPanel(executor);
  await runtime.act();
  const fetchButton = () => hostsOf(runtime).find(node => node.type === 'button' && node.props['aria-label'] === 'fetch');
  const snapshots = executor.calls.filter(call => call.action === 'snapshot').length;
  await runtime.act(() => fetchButton().props.onClick());
  assert.ok(hostsOf(runtime).some(node => node.props.role === 'alert' && nodeText(node).includes('Remote connection failed')));
  assert.equal(hostsOf(runtime).some(node => node.props.className === 'gg-toast-portal'), false, 'failed operations cannot show success toasts');
  assert.equal(executor.calls.filter(call => call.action === 'snapshot').length, snapshots);
  assert.equal(fetchButton().props.disabled, false);
  fail = false;
  await runtime.act(() => fetchButton().props.onClick());
  assert.equal(executor.calls.filter(call => call.action === 'fetch').length, 2);
  assert.equal(executor.calls.filter(call => call.action === 'snapshot').length, snapshots + 1);
  assert.equal(hostsOf(runtime).some(node => node.props.role === 'alert'), false);
});

test('fetch on an old Host explains that DSH must restart and leaves the button available', async () => {
  const executor = createExecutor(), execute = executor.execute;
  executor.execute = async line => {
    const result = await execute(line);
    if (JSON.parse(line.replace('/local-git-graph ', '')).action === 'fetch') {
      return { ok: true, value: { result: { kind: 'error', text: 'Unknown Git Graph action' } } };
    }
    return result;
  };
  const runtime = mountPanel(executor);
  await runtime.act();
  const fetchButton = () => hostsOf(runtime).find(node => node.type === 'button' && node.props['aria-label'] === 'fetch');
  await runtime.act(() => fetchButton().props.onClick());
  assert.ok(hostsOf(runtime).some(node => node.props.role === 'alert' && nodeText(node).includes('fetchUnavailable')));
  assert.equal(hostsOf(runtime).some(node => node.props.role === 'alert' && nodeText(node).includes('Unknown Git Graph action')), false);
  assert.equal(fetchButton().props.disabled, false);
});

test('Panel opens one inline detail per row, toggles it closed, and keeps offsets aligned', async () => {
  const executor = createExecutor();
  const runtime = mountPanel(executor);
  await runtime.act();
  assert.ok(executor.calls.some(call => call.action === 'snapshot'), 'panel requested an initial snapshot');

  let rows = rowsOf(runtime);
  assert.equal(rows.length, 3);
  const rowHeight = rows[1].props.style.top;
  assert.equal(rowHeight, ROW_HEIGHT_SEEN);
  const collapsedHeight = spacerHeight(runtime);
  assert.equal(collapsedHeight, 3 * rowHeight);

  await runtime.act(() => rows[0].props.onClick());

  let detail = inlineDetailOf(runtime);
  assert.ok(detail, 'clicking a row renders the inline detail panel');
  const expandedHeight = spacerHeight(runtime) - 3 * rowHeight;
  assert.ok(expandedHeight > 0, 'detail height is reserved in the scroll area');
  assert.equal(detail.props.style.top, rowHeight, 'detail sits directly below the expanded row');

  rows = rowsOf(runtime);
  assert.equal(rows[0].props['aria-expanded'], true);
  assert.equal(rows[0].props['aria-pressed'], true);
  assert.equal(rows[1].props['aria-expanded'], false);
  assert.equal(rows[1].props.style.top, rowHeight + expandedHeight);
  assert.equal(rows[2].props.style.top, 2 * rowHeight + expandedHeight);

  await runtime.act(() => rowsOf(runtime)[0].props.onClick());
  assert.equal(inlineDetailOf(runtime), undefined, 'clicking the expanded row closes it');
  rows = rowsOf(runtime);
  assert.equal(rows[0].props['aria-expanded'], false);
  assert.equal(spacerHeight(runtime), 3 * rowHeight, 'closing restores the collapsed height');
});

test('Panel ignores stale detail responses after another row is opened', async () => {
  const executor = createExecutor({ deferredDetails: true });
  const runtime = mountPanel(executor);
  await runtime.act();

  const rows = rowsOf(runtime);
  await runtime.act(() => rows[0].props.onClick());
  await runtime.act(() => rowsOf(runtime)[1].props.onClick());
  assert.ok(executor.detailResolvers.has('c0') && executor.detailResolvers.has('c1'), 'both detail requests are in flight');

  executor.detailResolvers.get('c1')(detailValue('c1'));
  await runtime.act();
  const title = () => {
    const heading = hostsOf(runtime).find(node => node.type === 'h3' && node.props.className === 'gg-detail-title');
    return heading ? nodeText(heading) : '';
  };
  assert.equal(title(), 'Second commit', 'the newest response is shown');

  executor.detailResolvers.get('c0')(detailValue('c0'));
  await runtime.act();
  assert.equal(title(), 'Second commit', 'a slower earlier response cannot replace the active detail');

  const hash = hostsOf(runtime).find(node => typeof node.props.className === 'string' && node.props.className.includes('gg-hash'));
  assert.ok(hash && nodeText(hash).includes('c1'), 'the active commit hash is still c1');
});

test('Panel switches inline file details between tree and flat list views, with no hover preview handlers', async () => {
  const executor = createExecutor();
  const runtime = mountPanel(executor);
  await runtime.act();

  await runtime.act(() => rowsOf(runtime)[0].props.onClick());
  assert.ok(inlineDetailOf(runtime), 'detail panel is open');

  const fileLabels = () => hostsOf(runtime)
    .filter(node => node.type === 'span' && node.props.className === 'gg-file-label')
    .map(nodeText);
  const treeFolders = () => hostsOf(runtime).filter(node => node.type === 'details' && typeof node.props.className === 'string' && node.props.className.includes('gg-tree-folder'));
  const toolButtons = label => hostsOf(runtime).filter(node => node.type === 'button' && node.props['aria-label'] === label);

  assert.ok(treeFolders().length >= 2, 'tree mode renders nested folder groups by default');
  assert.ok(fileLabels().includes('util.js'), 'tree mode shows basenames');
  assert.ok(!fileLabels().includes('src/lib/util.js'), 'tree mode does not repeat the full path');
  assert.equal(toolButtons('treeView')[0].props['aria-pressed'], true);
  assert.equal(toolButtons('listView')[0].props['aria-pressed'], false);

  await runtime.act(() => toolButtons('listView')[0].props.onClick());
  assert.equal(treeFolders().length, 0, 'list mode removes folder groups');
  assert.ok(fileLabels().includes('src/lib/util.js'), 'list mode shows full paths');
  assert.equal(toolButtons('listView')[0].props['aria-pressed'], true);
  assert.equal(toolButtons('treeView')[0].props['aria-pressed'], false);

  await runtime.act(() => toolButtons('treeView')[0].props.onClick());
  assert.ok(treeFolders().length >= 2, 'switching back restores the tree');

  const rows = rowsOf(runtime);
  assert.ok(rows.length > 0);
  for (const row of rows) {
    for (const handler of ['onMouseEnter', 'onMouseLeave', 'onMouseOver', 'onMouseOut', 'onPointerEnter', 'onPointerLeave', 'onFocus', 'onBlur']) {
      assert.equal(typeof row.props[handler], 'undefined', 'rows no longer open hover previews via ' + handler);
    }
    assert.equal(typeof row.props.onClick, 'function');
    assert.equal('aria-expanded' in row.props, true, 'rows describe their inline expansion state');
    assert.equal('aria-describedby' in row.props, false, 'rows no longer reference a preview tooltip');
  }
  const preview = hostsOf(runtime).find(node => (typeof node.props.className === 'string' && node.props.className.includes('gg-preview')) || node.props.role === 'tooltip');
  assert.equal(preview, undefined, 'the old hover preview is gone');
});
