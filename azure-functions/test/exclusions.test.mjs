import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  extractExclusionContext,
  getControlExclusionNote,
  buildExclusionSummary,
  computeSummary,
  detectAndParse,
} from '../dist/src/shared/scubagear-parser.js';

// Mirrors the v1.8.0 full_config.yaml structure as it appears in ScubaResults Raw.
const raw = {
  Raw: {
    scuba_config: {
      OrgName: 'Department of Example',
      ProductNames: ['aad', 'exo', 'defender'],
      Aad: {
        'MS.AAD.1.1v1': {
          CapExclusions: {
            Users: ['9d9ac7b2-5aa6-4830-a17a-6557e52140b0'],
            Groups: ['1a0161f4-318c-4415-b2a0-862bde2c9cde'],
            Applications: ['49b4dcdf-1f90-41a7-9b42-5cfe9dd7e3b4', 'Office365'],
            GuestUserTypes: ['b2bCollaborationGuest', 'internalGuest'],
          },
        },
        'MS.AAD.7.4v1': {
          RoleExclusions: {
            Users: ['2a8adc58-b7c5-4086-a5cc-244b8df40ce8'],
            Groups: ['4a471183-d934-4fb4-b1b3-d9525e0e1b45'],
          },
        },
      },
      Exo: {
        'MS.EXO.1.1v2': {
          AllowedForwardingDomains: ['example1.com', 'example2.com'],
        },
      },
      Defender: {
        'MS.DEFENDER.1.4v1': {
          SensitiveAccounts: {
            IncludedUsers: ['johndoe@example.com'],
            IncludedGroups: ['SG-MDE-Users@example.com'],
            IncludedDomains: ['random.mail.example.com'],
            ExcludedUsers: ['janedoe-ga@example.com'],
            ExcludedGroups: [],
            ExcludedDomains: [],
          },
        },
        'MS.DEFENDER.2.1v1': {
          SensitiveUsers: ['John Doe;jdoe@someemail.com'],
        },
      },
      AnnotatePolicy: {
        'MS.AAD.3.1v1': {
          Comment: 'Implementation in progress.',
          RemediationDate: '2025-12-01',
        },
        'MS.EXO.2.2v2': {
          IncorrectResult: true,
          Comment: 'Known incorrect result; split-horizon DNS.',
        },
      },
      OmitPolicy: {
        'MS.AAD.7.6v1': { Rationale: 'Approval process not acceptable to org.' },
        'MS.EXO.5.1v1': { Rationale: 'SMTP AUTH still needed.', Expiration: '2026-12-31' },
      },
    },
    conditional_access_policies: [],
    privileged_users: {
      '2a8adc58-b7c5-4086-a5cc-244b8df40ce8': {
        DisplayName: 'Break Glass Admin',
        roles: ['Global Administrator'],
      },
    },
  },
};

test('CapExclusions captures all four v1.8.0 fields', () => {
  const ctx = extractExclusionContext(raw);
  const aad11 = ctx.approvedExclusions.find((e) => e.controlId === 'MS.AAD.1.1v1');

  assert.deepEqual(aad11.capExclusions.users, ['9d9ac7b2-5aa6-4830-a17a-6557e52140b0']);
  assert.deepEqual(aad11.capExclusions.groups, ['1a0161f4-318c-4415-b2a0-862bde2c9cde']);
  assert.deepEqual(aad11.capExclusions.applications, [
    '49b4dcdf-1f90-41a7-9b42-5cfe9dd7e3b4',
    'Office365',
  ]);
  assert.deepEqual(aad11.capExclusions.guestUserTypes, [
    'b2bCollaborationGuest',
    'internalGuest',
  ]);
});

test('RoleExclusions are parsed for privileged-role policies', () => {
  const ctx = extractExclusionContext(raw);
  const aad74 = ctx.approvedExclusions.find((e) => e.controlId === 'MS.AAD.7.4v1');

  assert.ok(aad74, 'MS.AAD.7.4v1 should be present');
  assert.deepEqual(aad74.roleExclusions.users, ['2a8adc58-b7c5-4086-a5cc-244b8df40ce8']);
  assert.deepEqual(aad74.roleExclusions.groups, ['4a471183-d934-4fb4-b1b3-d9525e0e1b45']);
});

test('policy variables are captured generically', () => {
  const ctx = extractExclusionContext(raw);

  const exo = ctx.policyVariables.find((v) => v.controlId === 'MS.EXO.1.1v2');
  assert.deepEqual(exo.variables.AllowedForwardingDomains, ['example1.com', 'example2.com']);
  assert.equal(exo.product, 'EXO');

  // Nested filter objects are preserved as named lists.
  const def = ctx.policyVariables.find((v) => v.controlId === 'MS.DEFENDER.1.4v1');
  assert.deepEqual(def.variables.SensitiveAccounts.IncludedUsers, ['johndoe@example.com']);
  assert.deepEqual(def.variables.SensitiveAccounts.ExcludedDomains, []);

  const imp = ctx.policyVariables.find((v) => v.controlId === 'MS.DEFENDER.2.1v1');
  assert.deepEqual(imp.variables.SensitiveUsers, ['John Doe;jdoe@someemail.com']);
});

test('AnnotatePolicy and OmitPolicy are not mistaken for product config', () => {
  const ctx = extractExclusionContext(raw);

  // Their MS.* keys must not leak into exclusions or policy variables.
  assert.ok(!ctx.approvedExclusions.some((e) => e.controlId === 'MS.AAD.7.6v1'));
  assert.ok(!ctx.policyVariables.some((v) => v.controlId === 'MS.AAD.7.6v1'));
  assert.ok(!ctx.policyVariables.some((v) => v.controlId === 'MS.EXO.2.2v2'));
});

test('annotations capture RemediationDate and IncorrectResult', () => {
  const ctx = extractExclusionContext(raw);

  const scheduled = ctx.annotatedPolicies.find((a) => a.controlId === 'MS.AAD.3.1v1');
  assert.equal(scheduled.remediationDate, '2025-12-01');
  assert.equal(scheduled.incorrectResult, false);

  const incorrect = ctx.annotatedPolicies.find((a) => a.controlId === 'MS.EXO.2.2v2');
  assert.equal(incorrect.incorrectResult, true);
  assert.equal(incorrect.remediationDate, undefined);
});

test('omissions without an expiration are handled', () => {
  const ctx = extractExclusionContext(raw);
  const noExpiry = ctx.omittedPolicies.find((o) => o.controlId === 'MS.AAD.7.6v1');
  assert.equal(noExpiry.expiration, '');

  const note = getControlExclusionNote('MS.AAD.7.6v1', ctx);
  assert.match(note, /Omitted/);
  assert.doesNotMatch(note, /until\s*$/, 'must not render a dangling "until"');
});

test('control notes describe the new exclusion kinds', () => {
  const ctx = extractExclusionContext(raw);

  const capNote = getControlExclusionNote('MS.AAD.1.1v1', ctx);
  assert.match(capNote, /1 user\(s\)/);
  assert.match(capNote, /2 app\(s\)/);
  assert.match(capNote, /2 guest type\(s\)/);

  const roleNote = getControlExclusionNote('MS.AAD.7.4v1', ctx);
  assert.match(roleNote, /role user\(s\)/);

  const varNote = getControlExclusionNote('MS.EXO.1.1v2', ctx);
  assert.match(varNote, /AllowedForwardingDomains/);

  const annotatedNote = getControlExclusionNote('MS.AAD.3.1v1', ctx);
  assert.match(annotatedNote, /Remediation due 2025-12-01/);
});

test('role exclusions count as approved in CAP analysis', () => {
  const ctx = extractExclusionContext({
    Raw: {
      ...raw.Raw,
      conditional_access_policies: [
        {
          Id: 'cap-1',
          DisplayName: 'Require MFA',
          State: 'enabled',
          Conditions: {
            Users: {
              IncludeUsers: ['All'],
              ExcludeUsers: ['2a8adc58-b7c5-4086-a5cc-244b8df40ce8'],
              ExcludeGroups: [],
            },
            ClientAppTypes: ['all'],
          },
          GrantControls: { BuiltInControls: ['mfa'] },
        },
      ],
    },
  });

  const analysis = ctx.exclusionAnalysis.find((a) => a.policyName === 'Require MFA');
  assert.ok(analysis, 'policy should be analyzed');
  assert.equal(analysis.unapprovedUserCount, 0, 'RoleExclusions user must count as approved');
  assert.equal(analysis.excludedUsers[0].displayName, 'Break Glass Admin');
});

test('exclusion summary renders the new sections', () => {
  const summary = buildExclusionSummary(extractExclusionContext(raw));

  assert.match(summary, /Approved excluded applications/);
  assert.match(summary, /Approved excluded guest user types/);
  assert.match(summary, /Role-excluded users/);
  assert.match(summary, /Policy Configuration Variables/);
  assert.match(summary, /AllowedForwardingDomains/);
  assert.match(summary, /IncludedUsers/);
  assert.match(summary, /marked incorrect result/);
});

test('conditional policies that now return Pass are not treated as manual', () => {
  // v1.8.0 converted several conditional checks from manual to pass/fail.
  const results = {
    Results: {
      Aad: [
        {
          Controls: [
            { 'Control ID': 'MS.AAD.3.1v1', Result: 'Pass', Criticality: 'SHALL', Details: 'ok' },
            { 'Control ID': 'MS.AAD.3.2v1', Result: 'Fail', Criticality: 'SHALL', Details: 'no' },
            {
              'Control ID': 'MS.AAD.3.3v2',
              Result: 'N/A',
              Criticality: 'SHALL/3rd Party',
              Details: 'Third party',
            },
          ],
        },
      ],
    },
  };

  const { controls } = detectAndParse(results);
  const byId = Object.fromEntries(controls.map((c) => [c.controlId, c.status]));

  assert.equal(byId['MS.AAD.3.1v1'], 'Pass');
  assert.equal(byId['MS.AAD.3.2v1'], 'Fail');
  assert.equal(byId['MS.AAD.3.3v2'], '3rd Party');

  const summary = computeSummary(controls);
  assert.equal(summary.pass, 1);
  assert.equal(summary.fail, 1);
  assert.equal(summary.thirdParty, 1);
  assert.equal(summary.byProduct.AAD.total, 3);
});

test('missing or empty scuba_config degrades gracefully', () => {
  assert.equal(extractExclusionContext({}), null);
  assert.equal(extractExclusionContext({ Raw: {} }).approvedExclusions.length, 0);
  assert.equal(extractExclusionContext({ Raw: {} }).policyVariables.length, 0);
});
