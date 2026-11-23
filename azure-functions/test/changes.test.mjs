import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  BASELINE_CHANGES,
  BASELINE_HISTORY_TARGET_TAG,
  compareToBaseline,
  compareVersions,
  describeChange,
  formatChangesMarkdown,
  getChanges,
  getControlHistory,
  getRelease,
  getReleases,
  normalizeVersion,
  resolveControl,
} from '../dist/src/shared/baseline-changes.js';
import { SCUBAGEAR_BASELINE_TAG, SCUBAGEAR_BASELINE_VERSION } from '../dist/src/shared/baseline-data.js';
import { getLearnUrlsForControl } from '../dist/src/shared/learn-fetcher.js';
import {
  annotateBaselineStatus,
  buildChatContext,
  detectAndParse,
  detectReportVersion,
} from '../dist/src/shared/scubagear-parser.js';

test('change history is generated for the pinned baseline', () => {
  assert.equal(BASELINE_HISTORY_TARGET_TAG, SCUBAGEAR_BASELINE_TAG);
  const versions = getReleases().map((r) => r.version);
  assert.ok(versions.includes('1.8.0'));
  assert.equal(versions.at(-1), SCUBAGEAR_BASELINE_VERSION);
  assert.deepEqual(versions, [...versions].sort(compareVersions), 'releases must be in order');
});

test('version helpers normalise common spellings', () => {
  assert.equal(normalizeVersion('v2.0'), '2.0.0');
  assert.equal(normalizeVersion('2.0.0-rc1'), '2.0.0');
  assert.equal(normalizeVersion('1.8'), '1.8.0');
  assert.equal(normalizeVersion('latest'), null);
  assert.ok(compareVersions('1.10.0', '1.9.0') > 0, 'numeric, not lexical, comparison');
});

test('mapping-only (NIST/MITRE) updates are not reported as changes', () => {
  for (const c of BASELINE_CHANGES) {
    if (c.type === 'revised') {
      assert.ok(c.fields.some((f) => f !== 'nist' && f !== 'mitre'), `${c.controlId} is mapping-only`);
    }
  }
});

test('removed controls carry upstream replacement mapping', () => {
  const [removed] = getChanges({ controlId: 'MS.DEFENDER.1.1v1', types: ['removed'] });
  assert.ok(removed, 'MS.DEFENDER.1.1v1 removal should be recorded');
  assert.equal(removed.toVersion, '2.0.0');
  assert.deepEqual(removed.replacedBy, [
    'MS.SECURITYSUITE.1.1v1',
    'MS.SECURITYSUITE.1.2v1',
    'MS.SECURITYSUITE.1.3v1',
    'MS.SECURITYSUITE.1.4v1',
  ], 'range "1.1v1 - 1.4v1" expands to every control in it');

  const [dropped] = getChanges({ controlId: 'MS.EXO.8.3v1', types: ['removed'] });
  assert.deepEqual(dropped.replacedBy, [], '"None" means no replacement');
  assert.ok(dropped.note, 'removal rationale is preserved');
});

test('re-versioned controls record what changed', () => {
  const [spf] = getChanges({ controlId: 'MS.EXO.2.2v3', types: ['versioned'] });
  assert.equal(spf.fromId, 'MS.EXO.2.2v2');
  assert.match(spf.note, /soft fail/i);

  const [mfa] = getChanges({ controlId: 'MS.AAD.3.2v2', types: ['versioned'] });
  assert.ok(mfa.fields.includes('requirement'));
  assert.notEqual(mfa.title.from, mfa.title.to);
});

test('new controls record the controls they absorbed', () => {
  const [dlp] = getChanges({ controlId: 'MS.SECURITYSUITE.3.1v1', types: ['added'] });
  assert.ok(dlp.replaces.includes('MS.DEFENDER.4.1v2'));
  assert.ok(dlp.replaces.includes('MS.EXO.8.1v2'));
});

test('getChanges filters by version range and product', () => {
  const since18 = getChanges({ from: '1.8.0' });
  assert.ok(since18.length > 0);
  assert.ok(since18.every((c) => compareVersions(c.fromVersion, '1.8.0') >= 0));

  const none = getChanges({ from: SCUBAGEAR_BASELINE_VERSION });
  assert.equal(none.length, 0, 'nothing is newer than the pinned baseline');

  const defender = getChanges({ product: 'DEFENDER', from: '1.8.0' });
  assert.ok(defender.length > 0, 'legacy product key still finds its changes');
  assert.ok(defender.every((c) => c.product === 'DEFENDER' || c.product === 'SECURITYSUITE'));
});

test('resolveControl distinguishes current, re-versioned, removed and unknown IDs', () => {
  assert.equal(resolveControl('MS.AAD.3.2v2').status, 'current');

  const drift = resolveControl('MS.AAD.3.2v1');
  assert.equal(drift.status, 'versionDrift');
  assert.equal(drift.control.id, 'MS.AAD.3.2v2');
  assert.match(drift.note, /MS\.AAD\.3\.2v2/);

  const removed = resolveControl('MS.DEFENDER.4.1v2');
  assert.equal(removed.status, 'removed');
  assert.deepEqual(removed.replacements.map((c) => c.id), ['MS.SECURITYSUITE.3.1v1']);
  assert.ok(removed.legacy.title.length > 0);

  assert.equal(resolveControl('MS.NOPE.9.9v9').status, 'unknown');
});

test('control history combines current state with recorded changes', () => {
  const { resolution, timeline } = getControlHistory('MS.AAD.3.2v1');
  assert.equal(resolution.status, 'versionDrift');
  assert.ok(timeline.some((c) => c.type === 'versioned'));
});

test('release notes are captured per release', () => {
  const release = getRelease('2.0.0');
  assert.ok(release);
  assert.match(release.baselineNotes, /MS\.SECURITYSUITE\.1\.1v1/);
  assert.ok(release.url.startsWith('https://github.com/cisagov/ScubaGear/'));
});

test('compareToBaseline reports relation and change count', () => {
  const old = compareToBaseline('1.8.0');
  assert.equal(old.relation, 'older');
  assert.ok(old.changesSince > 0);
  assert.match(old.summary, /1\.8\.0/);

  assert.equal(compareToBaseline(SCUBAGEAR_BASELINE_VERSION).relation, 'same');
  assert.equal(compareToBaseline('99.0.0').relation, 'newer');
  assert.equal(compareToBaseline(undefined).relation, 'unknown');
});

test('report version is read from ScubaResults metadata', () => {
  assert.equal(detectReportVersion({ MetaData: { ToolVersion: '1.8.0' }, Results: {} }), '1.8.0');
  assert.equal(detectReportVersion({ Metadata: { ToolVersion: ' 2.0.0 ' } }), '2.0.0');
  assert.equal(detectReportVersion([]), null);
  assert.equal(detectReportVersion({ Results: {} }), null);
});

test('results from an older release are annotated and explained in the chat context', () => {
  const older = {
    MetaData: { ToolVersion: '1.8.0' },
    Results: {
      Defender: [
        {
          Controls: [
            { 'Control ID': 'MS.DEFENDER.4.1v2', Result: 'Fail', Criticality: 'SHALL', Details: 'no DLP policy' },
          ],
        },
      ],
      AAD: [
        {
          Controls: [
            { 'Control ID': 'MS.AAD.3.2v1', Result: 'Pass', Criticality: 'SHALL', Details: 'ok' },
            { 'Control ID': 'MS.AAD.1.1v1', Result: 'Pass', Criticality: 'SHALL', Details: 'ok' },
          ],
        },
      ],
    },
  };

  const { controls } = detectAndParse(older);
  annotateBaselineStatus(controls);
  const byId = Object.fromEntries(controls.map((c) => [c.controlId, c]));

  assert.equal(byId['MS.DEFENDER.4.1v2'].baselineStatus, 'removed');
  assert.deepEqual(byId['MS.DEFENDER.4.1v2'].replacedBy, ['MS.SECURITYSUITE.3.1v1']);
  assert.equal(byId['MS.AAD.3.2v1'].baselineStatus, 'versionDrift');
  assert.equal(byId['MS.AAD.1.1v1'].baselineStatus, undefined, 'current controls are left untouched');

  const ctx = buildChatContext(controls, null, compareToBaseline(detectReportVersion(older)));
  assert.match(ctx, /ScubaGear 1\.8\.0/);
  assert.match(ctx, /MS\.DEFENDER\.4\.1v2\*\* \[SHALL\] — Fail \(REMOVED from baseline; now MS\.SECURITYSUITE\.3\.1v1\)/);
  assert.match(ctx, /MS\.AAD\.3\.2v1\*\* .* re-versioned/);
});

test('Learn docs follow a control through a replacement and fall back to baseline resources', () => {
  // MS.SECURITYSUITE.3.1v1 has no curated entry; it inherits docs from the DLP controls it replaced.
  assert.ok(getLearnUrlsForControl('MS.SECURITYSUITE.3.1v1').length > 0);
  // A control whose version drifted still finds its curated docs.
  assert.ok(getLearnUrlsForControl('MS.AAD.3.5v1').length > 0);
});

test('markdown formatting groups by release and stays bounded', () => {
  const md = formatChangesMarkdown(getChanges({ from: '1.8.0' }), 3);
  assert.match(md, /## 1\.8\.0 → 2\.0\.0/);
  assert.match(md, /### Removed/);
  assert.match(md, /…and \d+ more/);
  assert.equal(formatChangesMarkdown([]), 'No recorded baseline changes match that query.');
  assert.ok(describeChange(BASELINE_CHANGES[0]).length > 0);
});

// ── Chat tools ──────────────────────────────────────────────

const { TOOLS, dispatchToolCall } = await import('../dist/src/functions/chat.js');

test('every declared chat tool is handled by the dispatcher', async () => {
  const names = TOOLS.map((t) => t.function.name);
  assert.equal(new Set(names).size, names.length, 'tool names must be unique');
  for (const name of ['baseline_get_changes', 'baseline_get_control_history', 'baseline_get_release_notes']) {
    assert.ok(names.includes(name), `${name} should be offered to the model`);
  }

  // Network-backed tools (learn_*, fetch_rego_policy) are covered by their own helpers.
  const offline = names.filter((n) => !n.startsWith('learn_') && n !== 'fetch_rego_policy');
  for (const name of offline) {
    const out = await dispatchToolCall(name, { controlId: 'MS.AAD.3.2v2', query: 'mfa', sectionNumber: 1, product: 'AAD' });
    assert.ok(!out.startsWith('Unknown tool'), `${name} is declared but not dispatched`);
    assert.ok(!out.startsWith('Error calling'), `${name} threw: ${out}`);
  }
});

test('baseline_get_changes explains a major release', async () => {
  const out = await dispatchToolCall('baseline_get_changes', { from: '1.8.0', product: 'DEFENDER', type: 'removed' });
  assert.match(out, /1\.8\.0 → 2\.0\.0/);
  assert.match(out, /MS\.DEFENDER\.1\.1v1/);
  assert.match(out, /Replaced by MS\.SECURITYSUITE\.1\.1v1/);

  assert.match(await dispatchToolCall('baseline_get_changes', { from: 'banana' }), /Invalid from version/);
});

test('baseline_get_control_history covers removed, re-versioned and unknown controls', async () => {
  const removed = await dispatchToolCall('baseline_get_control_history', { controlId: 'MS.DEFENDER.4.1v2' });
  assert.match(removed, /Status in baseline v[\d.]+:\*\* removed/);
  assert.match(removed, /MS\.SECURITYSUITE\.3\.1v1/);

  const bumped = await dispatchToolCall('baseline_get_control_history', { controlId: 'MS.AAD.3.2v1' });
  assert.match(bumped, /versionDrift/);
  assert.match(bumped, /MFA SHALL be enforced for all users/);

  assert.match(await dispatchToolCall('baseline_get_control_history', { controlId: 'MS.NOPE.1.1v1' }), /unknown/);
});

test('baseline_get_release_notes lists releases and returns a release', async () => {
  assert.match(await dispatchToolCall('baseline_get_release_notes', {}), /Available releases[\s\S]*2\.0\.0/);
  assert.match(await dispatchToolCall('baseline_get_release_notes', { version: 'v2.0' }), /MS\.SECURITYSUITE/);
  assert.match(await dispatchToolCall('baseline_get_release_notes', { version: '9.9.9' }), /No release notes/);
});

test('removed controls point to replacements instead of failing', async () => {
  const info = await dispatchToolCall('baseline_get_control_info', { controlId: 'MS.DEFENDER.1.1v1' });
  assert.match(info, /was removed from the baseline/);
  assert.match(info, /MS\.SECURITYSUITE\.1\.1v1/);

  const scan = await dispatchToolCall('analyze_scan_result', { controlId: 'MS.DEFENDER.1.1v1' });
  assert.match(scan, /Baseline version note/);
});
