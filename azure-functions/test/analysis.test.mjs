import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCapAnalysis,
  buildConfigSnippet,
  crossReferenceIds,
  DIAGNOSIS_INTENT_RE,
  extractControlReferences,
  extractRegoRule,
  FAILURE_INTENT_RE,
  parseNearMisses,
  prioritizeFailures,
} from '../dist/src/shared/analysis.js';
import { extractExclusionContext } from '../dist/src/shared/scubagear-parser.js';
import { getControlById } from '../dist/src/shared/baseline-data.js';

const USER = '11111111-2222-3333-4444-555555555555';
const OTHER_USER = '99999999-8888-7777-6666-555555555555';
const GROUP = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

const policy = (over) => ({
  Id: over.Id,
  DisplayName: over.DisplayName,
  State: over.State ?? 'enabled',
  Conditions: {
    Users: {
      IncludeUsers: over.IncludeUsers ?? ['All'],
      ExcludeUsers: over.ExcludeUsers ?? [],
      ExcludeGroups: over.ExcludeGroups ?? [],
    },
    Applications: { IncludeApplications: ['All'] },
    UserRiskLevels: over.UserRiskLevels ?? [],
    SignInRiskLevels: [],
  },
  GrantControls: {
    BuiltInControls: over.Grant ?? [],
    AuthenticationStrength: over.Strength ? { DisplayName: over.Strength } : null,
  },
});

function report({ approved } = {}) {
  return {
    Raw: {
      scuba_config: approved ? { Aad: { 'MS.AAD.3.1v1': { CapExclusions: { Users: [USER] } } } } : {},
      privileged_users: { [OTHER_USER]: { DisplayName: 'Break Glass', roles: ['Global Administrator'] } },
      conditional_access_policies: [
        policy({ Id: 'p1', DisplayName: 'Require PR MFA', Strength: 'Phishing-resistant MFA', ExcludeUsers: [USER, OTHER_USER] }),
        policy({ Id: 'p2', DisplayName: 'Old policy', State: 'disabled', IncludeUsers: [USER], Grant: ['mfa'] }),
        policy({ Id: 'p3', DisplayName: 'Report only', State: 'enabledForReportingButNotEnforced', Strength: 'Phishing-resistant MFA' }),
      ],
    },
  };
}

const NEAR = (name) => `0 conditional access policy(s) found that meet(s) all requirements.   Near miss:  ${name} would pass if the config file is updated to include: user exclusions.  Run the Start-SCuBAConfigAnalyzer cmdlet.`;

const scans = {
  'MS.AAD.3.1v1': { status: 'Fail', reportDetails: NEAR('Require PR MFA') },
  'MS.AAD.3.2v2': { status: 'Fail', reportDetails: NEAR('Require PR MFA') },
  'MS.AAD.3.4v1': { status: 'Pass', reportDetails: 'Requirement met' },
  'MS.AAD.1.1v1': { status: 'Fail', reportDetails: '0 conditional access policy(s) found that meet(s) all requirements.' },
  'MS.AAD.3.7v1': { status: 'Warning', reportDetails: '0 conditional access policy(s) found.' },
  'MS.AAD.3.5v2': { status: 'Error', reportDetails: 'Check failed to run' },
  'MS.DEFENDER.1.1v1': { status: 'Fail', reportDetails: 'preset policies missing' },
};

test('near misses are parsed from ScubaGear 2.0 report text', () => {
  assert.deepEqual(parseNearMisses(scans['MS.AAD.3.1v1'].reportDetails), [
    { policyName: 'Require PR MFA', missing: 'user exclusions' },
  ]);
  assert.deepEqual(parseNearMisses('Requirement not met'), []);
  assert.deepEqual(parseNearMisses(undefined), []);
});

test('CAP analysis shows policy evidence including state and what is enforced', () => {
  const out = buildCapAnalysis('MS.AAD.3.1v1', extractExclusionContext(report()), scans);
  assert.match(out, /\| Require PR MFA ⚠️ near miss \| enabled \| All users → all apps \| Phishing-resistant MFA/);
  assert.match(out, /2 user\(s\), 0 group\(s\) \(2 unapproved\)/);
  assert.match(out, /Report only \| report-only \(not enforced\)/, 'report-only policies are called out');
});

test('near miss produces a decision with a config snippet that covers shared controls', () => {
  const out = buildCapAnalysis('MS.AAD.3.1v1', extractExclusionContext(report()), scans);
  assert.match(out, /### Decision/);
  assert.match(out, /Remove the exclusion from the policy/);
  assert.match(out, /intentionally exempt/);
  const yaml = out.match(/```yaml\n([\s\S]*?)\n```/)[1];
  assert.match(yaml, /^Aad:/);
  assert.match(yaml, /MS\.AAD\.3\.1v1:\n\s+CapExclusions:\n\s+Users:\n\s+- 11111111-2222-3333-4444-555555555555/);
  assert.match(yaml, /MS\.AAD\.3\.2v2:/, 'another control naming the same policy shares the fix');
});

test('approved exclusions are not offered again', () => {
  const out = buildCapAnalysis('MS.AAD.3.1v1', extractExclusionContext(report({ approved: true })), scans);
  assert.match(out, /Unapproved exclusions: 1 user\(s\)/, 'only the other excluded user remains');
  const yaml = out.match(/```yaml\n([\s\S]*?)\n```/)[1];
  assert.ok(!yaml.includes(USER), 'the approved user is not repeated in the snippet');
  assert.ok(yaml.includes(OTHER_USER));
});

test('GUIDs are cross-referenced and unresolved ones come with lookup steps', () => {
  const ctx = extractExclusionContext(report());
  const out = crossReferenceIds(ctx, [USER, OTHER_USER], [GROUP]);
  assert.match(out, /Break Glass.*Global Administrator/, 'privileged users are named');
  assert.match(out, new RegExp(`\`${USER}\` \\(user\\) — name is not in the report`));
  assert.match(out, /Excluded from: "Require PR MFA" \(enabled\)/);
  assert.match(out, /Included in: "Old policy" \(DISABLED\)/);
  assert.match(out, /az ad user show --id 11111111/);
  assert.match(out, /az ad group show --group aaaaaaaa/);
  assert.equal(crossReferenceIds(ctx, [], []), '');
});

test('non-CAP controls get no CAP analysis', () => {
  assert.equal(buildCapAnalysis('MS.AAD.3.4v1', extractExclusionContext(report()), scans), '');
  assert.equal(buildCapAnalysis('MS.EXO.1.1v2', extractExclusionContext(report()), scans), '');
});

test('config snippet is valid, minimal YAML', () => {
  assert.equal(
    buildConfigSnippet(['MS.AAD.3.1v1'], [USER], [GROUP]),
    `Aad:\n  MS.AAD.3.1v1:\n    CapExclusions:\n      Users:\n        - ${USER}\n      Groups:\n        - ${GROUP}`,
  );
});

test('failures are prioritised: quick wins first, then BOD SHALL, then SHOULD', () => {
  const out = prioritizeFailures(scans);
  assert.match(out, /5 failing of 7 controls/);
  assert.match(out, /Failing by product: AAD 4, SECURITYSUITE 1/);
  assert.match(out, /## Quick wins — 2 control\(s\)/);
  assert.ok(out.indexOf('## Quick wins') < out.indexOf('## 1. Required by BOD 25-01'));
  assert.ok(out.indexOf('## 1. Required by BOD 25-01') < out.indexOf('## 3. SHOULD recommendations'));
  assert.match(out, /MS\.AAD\.3\.1v1\*\* .*near miss: "Require PR MFA" needs user exclusions/);
  assert.match(out, /Checks that errored — 1\n.*MS\.AAD\.3\.5v2/);
  assert.match(out, /From an older ScubaGear — 1 control.*MS\.DEFENDER\.1\.1v1/s);
});

test('triage can be limited to a product and handles a clean report', () => {
  const aad = prioritizeFailures(scans, { product: 'AAD' });
  assert.ok(!aad.includes('MS.DEFENDER.1.1v1'));
  assert.match(aad, /Failure triage — AAD/);
  assert.match(prioritizeFailures({ 'MS.AAD.3.4v1': { status: 'Pass', reportDetails: '' } }), /No failing controls/);
});

test('control titles are the policy statement; guidance lives in the description', () => {
  const c = getControlById('MS.AAD.3.1v1');
  assert.equal(c.title, 'Phishing-resistant MFA SHALL be enforced for all users.');
  assert.ok(c.description.length > c.title.length, 'explanatory paragraphs are kept in the description');
});

// ── Understanding the question ──────────────────────────────

const refScans = {
  'MS.AAD.3.1v1': { status: 'Fail', reportDetails: NEAR('Require PR MFA') },
  'MS.AAD.3.2v2': { status: 'Fail', reportDetails: 'x' },
  'MS.EXO.3.1v1': { status: 'Warning', reportDetails: 'x' },
  'MS.TEAMS.3.1v2': { status: 'Pass', reportDetails: 'ok' },
  'MS.EXO.4.1v1': { status: 'Fail', reportDetails: 'x' },
  'MS.DEFENDER.1.1v1': { status: 'Fail', reportDetails: 'x' },
};

test('controls are found however the question writes them', () => {
  assert.deepEqual(extractControlReferences('why is MS.AAD.3.1v1 failing', refScans).ids, ['MS.AAD.3.1v1']);
  assert.deepEqual(extractControlReferences('how do I fix MS.AAD.3.1v2?', refScans).ids, ['MS.AAD.3.1v1'], 'a stale version suffix resolves to the report entry');
  assert.deepEqual(extractControlReferences('what is wrong with entra 3.1', refScans).ids, ['MS.AAD.3.1v1']);
  assert.deepEqual(extractControlReferences('exchange check 3.1', refScans).ids, ['MS.EXO.3.1v1']);
  assert.deepEqual(extractControlReferences('security suite 1.1', refScans).ids, ['MS.DEFENDER.1.1v1'], 'renamed products resolve to the report entry');
  assert.deepEqual(extractControlReferences('how do I pass check 4.1', refScans).ids, ['MS.EXO.4.1v1'], 'a bare number that is unique needs no product');
  assert.deepEqual(extractControlReferences('compare aad 3.1 and aad 3.2', refScans).ids, ['MS.AAD.3.1v1', 'MS.AAD.3.2v2']);
  assert.deepEqual(extractControlReferences('check 9.9', refScans), { ids: [], candidates: [] });
});

test('a bare number that matches several failing products is a question, not a guess', () => {
  const r = extractControlReferences('how do I pass check 3.1', refScans);
  assert.deepEqual(r.ids, []);
  assert.deepEqual(r.candidates.sort(), ['MS.AAD.3.1v1', 'MS.EXO.3.1v1'], 'passing controls are not offered');
  assert.deepEqual(extractControlReferences('aad 3.1, and also check 3.1', refScans).candidates, [], 'an explicit control settles it');
});

test('failure-clarification phrasings are recognised, other questions are not', () => {
  const diagnose = [
    'why am I failing aad 3.1', 'how do I pass MS.AAD.3.1v1', 'what is wrong with entra 3.1', 'get aad 3.1 to pass',
    'how can I get MS.AAD.3.1v1 to pass?', 'how do I fix aad 3.1', "what's causing aad 3.1 to fail", 'what do I need to change for aad 3.1',
    'summarize my failures', 'what should I fix first?', 'give me a remediation plan',
  ];
  for (const q of diagnose) assert.ok(DIAGNOSIS_INTENT_RE.test(q) || FAILURE_INTENT_RE.test(q), `should diagnose: ${q}`);

  const other = [
    'what does MS.AAD.3.1v1 require?', 'what license do I need for aad 3.1', 'is aad 3.1 passing?',
    'why does CISA require phishing-resistant MFA?', 'compare aad 3.1 and aad 3.2', 'what changed in aad 3.2 in 2.0?',
    'what is conditional access?', 'explain MS.AAD.3.1v1',
  ];
  for (const q of other) assert.ok(!DIAGNOSIS_INTENT_RE.test(q) && !FAILURE_INTENT_RE.test(q), `should not force a diagnosis: ${q}`);
});

// ── Rego extraction ─────────────────────────────────────────

const REGO = `package aad
import rego.v1
import data.utils.key.Count

# MS.AAD.1.1v1
#--
Other(p) if { true }
tests contains {
    "PolicyId": "MS.AAD.1.1v1",
    "ReportDetails": "one"
} if {
    true
}

# MS.AAD.3.1v1
#--
Base(policy) if {
    policy.State == "enabled"
}
Eval(policy) := r if {
    checks := [{"label": "user exclusions", "ok": UserFull(policy, "MS.AAD.3.1v1")}]
    r := Cap(Base(policy), checks)
}
tests contains {
    "PolicyId": "MS.AAD.3.1v1",
    "RequirementMet": Status
} if {
    Status := true
}

# MS.AAD.3.2v2
#--
tests contains {
    "PolicyId": "MS.AAD.3.2v2",
} if { true }
`;

test('Rego extraction finds the rule that reports the control, including 2.x helpers before it', () => {
  const rule = extractRegoRule(REGO, 'MS.AAD.3.1v1');
  assert.match(rule, /Base\(policy\) if/);
  assert.match(rule, /policy\.State == "enabled"/);
  assert.match(rule, /"PolicyId": "MS\.AAD\.3\.1v1",\n\s+"RequirementMet"/);
  assert.ok(!rule.includes('Other(p)') && !rule.includes('MS.AAD.3.2v2'), 'neighbouring controls are excluded');
  assert.ok(!rule.includes('import data.utils'), 'import noise is dropped');

  assert.match(extractRegoRule(REGO, 'MS.AAD.1.1v1'), /"ReportDetails": "one"/);
  assert.match(extractRegoRule(REGO, 'MS.AAD.9.9v1'), /No Rego rule found/);
});

// ── Pre-fetched diagnosis ───────────────────────────────────

const { setScanState, buildPrefetch } = await import('../dist/src/functions/chat.js');

test('only failure-clarification questions get a pre-fetched diagnosis', async () => {
  globalThis.fetch = async () => ({ ok: false }); // keep the Rego lookup offline
  setScanState(refScans, extractExclusionContext(report()));

  const why = await buildPrefetch('why am I failing aad 3.1', null);
  const how = await buildPrefetch('how do I pass MS.AAD.3.1v1', null);
  assert.equal(why, how, 'the same need gets the same diagnosis whatever the wording');
  assert.match(why, /### Policy evidence/);
  assert.match(why, /### Decision/);

  for (const q of ['what does MS.AAD.3.1v1 require?', 'is aad 3.1 passing?', 'compare aad 3.1 and aad 3.2', 'what is conditional access?']) {
    assert.equal(await buildPrefetch(q, null), '', `nothing should be forced for: ${q}`);
  }
});

test('ambiguous numbers are resolved from the conversation or put to the user', async () => {
  globalThis.fetch = async () => ({ ok: false });
  setScanState(refScans, extractExclusionContext(report()));

  const ask = await buildPrefetch('how do I pass check 3.1', null);
  assert.match(ask, /## Which control\?/);
  assert.ok(ask.includes('MS.AAD.3.1v1') && ask.includes('MS.EXO.3.1v1'));
  assert.ok(!ask.includes('### Policy evidence'), 'no full diagnosis until the user picks one');

  const history = [{ role: 'user', content: 'tell me about MS.AAD.3.2v2' }, { role: 'assistant', content: 'ok' }];
  const resolved = await buildPrefetch('how do I pass check 3.1', history);
  assert.ok(!resolved.includes('## Which control?'));
  assert.match(resolved, /MS\.AAD\.3\.1v1/, 'the AAD conversation settles which 3.1 is meant');
});

test('short follow-ups use the control just discussed', async () => {
  globalThis.fetch = async () => ({ ok: false });
  setScanState(refScans, extractExclusionContext(report()));
  const history = [{ role: 'user', content: 'why is MS.AAD.3.1v1 failing' }, { role: 'assistant', content: 'because of an exclusion' }];
  assert.match(await buildPrefetch('how do I fix it?', history), /### Decision/);
  assert.equal(await buildPrefetch('how do I fix it?', null), '');
});
