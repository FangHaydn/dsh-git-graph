import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

// Exercise the actual client functions without requiring a DSH or React runtime.
const source = await readFile(new URL('../client.js', import.meta.url), 'utf8');
const context = vm.createContext({
  window: { __ModuleLoader__: { load({ factory }) {
    factory(name => name === 'react' ? {
      createElement: (type, props, ...children) => ({ type, props, children }),
    } : {});
  } } },
});
vm.runInContext(source.replace('    function RefBadges(', '    globalThis.graphTest = { layoutGraph, Graph, displayRefs, RefBadges, css };\n    function RefBadges('), context);
const { layoutGraph, Graph, displayRefs, RefBadges, css } = context.graphTest;
const commit = (hash, ...parents) => ({ hash, parents });
const main = hash => [{ kind: 'branch', name: 'main', hash }];
const fixture = [
  commit('merge', 'main-tip', 'feature'),
  commit('main-tip', 'main-middle'),
  commit('feature', 'base'),
  commit('main-middle', 'main-last'),
  commit('main-last', 'base'),
  commit('base'),
];

function assertContinuous(rows) {
  for (let i = 0; i < rows.length - 1; i++) {
    const ends = rows[i].edges.filter(edge => edge.y2 === 32)
      .map(edge => `${edge.x2}:${edge.color}`).sort();
    const starts = rows[i + 1].edges.filter(edge => edge.y1 === 0)
      .map(edge => `${edge.x1}:${edge.color}`).sort();
    assert.deepEqual(ends, starts, `Continuous geometry and colour at row ${i + 1}`);
  }
}

test('a merged branch keeps its colour all the way to the shared ancestor', () => {
  const { rows } = layoutGraph(fixture, main('merge'), 'main');
  const featureColor = rows[2].color;
  assert.notEqual(featureColor, rows[0].color);
  const departing = rows[2].edges.find(edge => edge.y1 === 16);
  for (const index of [3, 4]) {
    assert.ok(rows[index].edges.some(edge => edge.color === featureColor && edge.x1 === departing.x2),
      `Feature colour survives through main row ${index}`);
  }
  assert.ok(rows[5].edges.some(edge => edge.color === featureColor && edge.y2 === 16),
    'Feature colour reaches the common ancestor node');
  assertContinuous(rows);
});

test('a branch bends into its ancestor only on the ancestor row', () => {
  const { rows } = layoutGraph(fixture, main('merge'), 'main');
  const outgoing = rows[2].edges.find(edge => edge.y1 === 16);
  assert.equal(outgoing.x2, rows[2].column, 'Do not bend away from the feature node early');
  for (const index of [3, 4]) {
    const passing = rows[index].edges.find(edge => edge.color === rows[2].color);
    assert.ok(passing, 'Branch still has a separate line');
    assert.equal(passing.x1, passing.x2, 'Pass unrelated main nodes vertically');
    assert.notEqual(passing.x1, rows[index].column, 'Keep clear of unrelated nodes');
  }
  const joining = rows[5].edges.find(edge => edge.color === rows[2].color);
  assert.notEqual(joining.x1, joining.x2);
  assert.equal(joining.x2, rows[5].column);
});

test('finishing one branch does not shift other branches past unrelated nodes', () => {
  const commits = [commit('merge', 'main-tip', 'short', 'long'), commit('short', 'main-tip'),
    commit('long', 'long-parent'), commit('main-tip', 'base'), commit('long-parent', 'base'), commit('base')];
  const { rows } = layoutGraph(commits, main('merge'), 'main');
  const longColor = rows[2].color;
  const before = rows[1].edges.find(edge => edge.color === longColor);
  assert.ok(before);
  assert.equal(before.x1, before.x2, 'Do not compact a passing lane when a neighbour ends');
  assertContinuous(rows);
});

test('multiple branches can reach one ancestor in their own colours', () => {
  const commits = [commit('merge', 'main-tip', 'a', 'b'), commit('a', 'base'),
    commit('b', 'base'), commit('main-tip', 'base'), commit('base')];
  const { rows } = layoutGraph(commits, main('merge'), 'main');
  const arriving = new Set(rows.at(-1).edges.map(edge => edge.color));
  for (const index of [1, 2, 3]) assert.ok(arriving.has(rows[index].color));
  assertContinuous(rows);
});

test('branch curves and HEAD nodes have enough horizontal clearance', () => {
  const { rows, width } = layoutGraph(fixture, main('merge'), 'main');
  const left = Graph({ row: rows[0], width, head: true });
  const right = Graph({ row: rows[2], width, head: false });
  const head = left.children.find(child => child.type === 'circle');
  const feature = right.children.find(child => child.type === 'circle');
  assert.ok(feature.props.cx - head.props.cx >= 20, 'Adjacent lanes are at least 20px apart');
  assert.ok(feature.props.cx + feature.props.r + 1 < right.props.width, 'Last node fits inside its SVG');
});

test('empty, linear and truncated histories remain continuous', () => {
  assert.equal(layoutGraph([]).rows.length, 0);
  for (const commits of [[commit('a', 'b'), commit('b')], fixture.slice(0, 4)]) {
    const { rows } = layoutGraph(commits, main(commits[0].hash), 'main');
    assertContinuous(rows);
    for (const row of rows) {
      for (const edge of row.edges) assert.ok(edge.x1 >= 0 && edge.x2 >= 0);
    }
  }
});

test('branch labels fold local and same-named remote refs into a single value', () => {
  // displayRefs runs in a vm realm, so normalise its arrays before comparing.
  const plain = value => JSON.parse(JSON.stringify(value));
  const items = [
    { kind: 'branch', name: 'main' },
    { kind: 'remote', name: 'origin/main' },
    { kind: 'remote', name: 'origin/feature' },
    { kind: 'tag', name: 'v1.0.0' },
    { kind: 'stash', name: 'stash@{0}' },
  ];
  assert.deepEqual(plain(displayRefs(items)), [
    { kind: 'branch', name: 'main', label: 'main | origin' },
    { kind: 'remote', name: 'origin/feature', label: 'origin/feature' },
    { kind: 'tag', name: 'v1.0.0', label: 'v1.0.0' },
    { kind: 'stash', name: 'stash@{0}', label: 'stash@{0}' },
  ]);
});

test('compact badges render every value without kind prefixes or a count placeholder', () => {
  const items = [{kind:'branch',name:'main'}, {kind:'remote',name:'origin/main'},
    {kind:'tag',name:'v1'}, {kind:'stash',name:'stash@{0}'}, {kind:'remote',name:'upstream/other'}];
  for (const compact of [false, true]) {
    const badges = RefBadges({items,head:true,color:0,t:kind=>kind,compact});
    assert.equal(badges.children.length, 5);
    assert.deepEqual(Array.from(badges.children, badge=>badge.children[1].children[0]),
      ['HEAD','main | origin','upstream/other','v1','stash@{0}']);
    assert.ok(badges.children.every(badge=>badge.props.title));
  }
});

test('matching branch labels include all remote names', () => {
  const labels = displayRefs([{kind:'remote',name:'origin/main'}, {kind:'branch',name:'main'},
    {kind:'remote',name:'upstream/main'}]);
  assert.equal(labels.length, 1);
  assert.equal(labels[0].label, 'main | origin, upstream');
});

test('the main conversation tab hides chat chrome and lets the view own scrolling', () => {
  assert.ok(css.includes('[data-conversation-content]:has([data-slot="conversation.view"] .dgg) [data-conversation-region="composer"]{display:none!important}'),
    'The chat composer, task dock and usage meter share the composer region');
  assert.ok(css.includes('[data-conversation-content]:has([data-slot="conversation.view"] .dgg) [data-conversation-scroll]{overflow:hidden!important}'),
    'The outer conversation scroller must yield to the panel');
  assert.ok(css.includes('[data-conversation-scroll] > [data-slot="conversation.session"] > div{flex:1 1 0!important;min-height:0!important;overflow:hidden!important}'),
    'The active view area must take a bounded height so the history list can scroll');
});

test('branch labels keep the remote name and support slashed branch names', () => {
  const plain = value => JSON.parse(JSON.stringify(value));
  assert.deepEqual(plain(displayRefs([{ kind: 'branch', name: 'feature/x' }, { kind: 'remote', name: 'upstream/feature/x' }])),
    [{ kind: 'branch', name: 'feature/x', label: 'feature/x | upstream' }]);
  assert.deepEqual(plain(displayRefs([{ kind: 'remote', name: 'origin/release/1.0' }])),
    [{ kind: 'remote', name: 'origin/release/1.0', label: 'origin/release/1.0' }]);
  assert.deepEqual(plain(displayRefs([{ kind: 'branch', name: 'local-only' }])),
    [{ kind: 'branch', name: 'local-only', label: 'local-only' }]);
});
