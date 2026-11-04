import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../client.js', import.meta.url), 'utf8');
const ID = '@local/dsh-git-graph';

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
