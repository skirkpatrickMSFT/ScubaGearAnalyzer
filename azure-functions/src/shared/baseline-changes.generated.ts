/* eslint-disable */
// AUTO-GENERATED FILE — DO NOT EDIT BY HAND.
// Source: cisagov/ScubaGear release history up to v2.0.0
// Regenerate with: npm run baselines:generate

import type { BaselineRelease, BaselineChange, LegacyControl, RemovedPolicy } from './baseline-types.js';

export const BASELINE_HISTORY_TARGET_TAG = "v2.0.0";

export const BASELINE_RELEASES: BaselineRelease[] = [
  {
    "tag": "v1.5.0",
    "version": "1.5.0",
    "publishedAt": "2025-02-28T20:01:12Z",
    "url": "https://github.com/cisagov/ScubaGear/releases/tag/v1.5.0",
    "baselineNotes": "* Update Front Matter across SCBs and specific language in the Defender SCB https://github.com/cisagov/ScubaGear/pull/1398\r\n* Adding Conditional Access Policy Implementation Instructions to MS.AAD.1.1 https://github.com/cisagov/ScubaGear/pull/1312\r\n* Update incorrect hyperlinks in SCB markdown https://github.com/cisagov/ScubaGear/pull/1413\r\n* Remove extraneous SHALL from MS.DEFENDER.4.1 https://github.com/cisagov/ScubaGear/pull/1408\r\n* Remove MS.SHAREPOINT4.2v1 due to Microsoft update to custom scripting settings https://github.com/cisagov/ScubaGear/pull/1447\r\n* Update AAD.3.1v1 to include device-bound passkeys language and resource to MS.AAD.3.1  https://github.com/cisagov/ScubaGear/pull/1431\r\n* Update MS.AAD.5.4v1 checks for teams group consent for deprecated setting https://github.com/cisagov/ScubaGear/pull/1460\r\n* See full list of baseline updates [here](https://github.com/cisagov/ScubaGear/issues?q=is%3Aissue+is%3Aclosed+label%3Abaseline-document+-label%3ATesting+-label%3Adocumentation+-label%3Aepic+milestone%3AKraken)"
  },
  {
    "tag": "v1.6.0",
    "version": "1.6.0",
    "publishedAt": "2025-07-09T00:48:11Z",
    "url": "https://github.com/cisagov/ScubaGear/releases/tag/v1.6.0",
    "baselineNotes": "### BOD 25-01 required configuration policy changes\r\nThis section lists baseline policy changes that affect current [BOD 25-01 Required Configurations](https://www.cisa.gov/resources-tools/services/bod-25-01-implementing-secure-practices-cloud-services-required-configurations).\r\n\r\n#### Additions\r\nNo new required configuration policies added in this release.\r\n\r\n#### Removals\r\n* MS.AAD.5.4v1 - Removed as Microsoft deprecated feature that allows group owners to consent to applications https://github.com/cisagov/ScubaGear/pull/1623\r\n* MS.DEFENDER.6.2v1 / MS.EXO.17.2v1 - Removed due to Microsoft service updates for auditing that allow remaining Defender and Exchange Online auditing policy group baseline items to adequately cover the auditing requirements that previously required Purview Audit (Premium) https://github.com/cisagov/ScubaGear/pull/1625\r\n\r\n#### Updates\r\n* MS.AAD.3.3v2 - Updated version only checks for login context information if Microsoft Authenticator is enabled, phishing-resistant MFA not being enforced is no longer a condition for making the policy applicable/not applicable https://github.com/cisagov/ScubaGear/pull/1588\r\n* MS.DEFENDER.6.1v1 / MS.EXO.17.1v1 - Updated audit logging language to better reflect ScubaGear check https://github.com/cisagov/ScubaGear/pull/1611\r\n* MS.EXO.1.1v2 - Updated version allows automatic forwarding for specific, agency-approved domains https://github.com/cisagov/ScubaGear/pull/1615\r\n\r\n### Other baseline changes\r\n* Add new SHOULD policy MS.AAD.3.9v1 to block device code authentication https://github.com/cisagov/ScubaGear/pull/1627\r\n* Add note to MS.POWERPLATFORM.4.1v1 to highlight dataverse dependency  https://github.com/cisagov/ScubaGear/pull/1608\r\n* Update MS.TEAMS.1.6v1 and MS.TEAMS.1.7v2 to clarify restrictions on event and meeting recording https://github.com/cisagov/ScubaGear/pull/1626\r\n* Update SharePoint policy notes to provide clarity on N/A cases https://github.com/cisagov/ScubaGear/pull/1616\r\n* Remove MS.SHAREPOINT.1.4v1 from baseline due to setting deprecation https://github.com/cisagov/ScubaGear/pull/1593\r\n* See full list of baseline updates [here](https://github.com/cisagov/ScubaGear/issues?q=is%3Aissue+is%3Aclosed+label%3Abaseline-document+-label%3ATesting+-label%3Adocumentation+-label%3Aepic+milestone%3AMarlin)"
  },
  {
    "tag": "v1.7.0",
    "version": "1.7.0",
    "publishedAt": "2026-02-11T19:56:12Z",
    "url": "https://github.com/cisagov/ScubaGear/releases/tag/v1.7.0",
    "baselineNotes": "### BOD 25-01 required configuration policy changes\r\nThis section lists baseline policy changes that affect current [BOD 25-01 Required Configurations](https://www.cisa.gov/resources-tools/services/bod-25-01-implementing-secure-practices-cloud-services-required-configurations).\r\n\r\n#### Additions\r\nNo new required configuration policies added in this release.\r\n\r\n#### Removals\r\n* MS.TEAMS.3.1v1 (SHALL) - The option to restrict contact with Skype users found in policy MS.TEAMS.3.1v1 has been deprecated by Microsoft. All references, including the policy and its implementation steps, have been removed since the setting is no longer present.\r\n\r\n#### Updates\r\n* MS.TEAMS.1.2v2 (SHALL) - policy version bumped to v2 due to changes where the configuration settings are located.\r\n* MS.TEAMS.2.1v2 (SHALL) - policy version bumped to v2 due to changes where the configuration settings are located.\r\n* MS.TEAMS.2.2v2 (SHALL) - policy version bumped to v2 due to changes where the configuration settings are located.\r\n\r\n### Other baseline changes\r\n* Update AAD baseline to reflect new Microsoft Entra ID portal changes by @Michael-Dahlke in https://github.com/cisagov/ScubaGear/pull/1744\r\n* Microsoft Defender baseline UI updates by @Jeremye22 in https://github.com/cisagov/ScubaGear/pull/1764\r\n* Update Teams baseline information with UI changes by @skirkpatrickMSFT in https://github.com/cisagov/ScubaGear/pull/1777\r\n* See full list of baseline updates [here](https://github.com/cisagov/ScubaGear/issues?q=is%3Aissue%20is%3Aclosed%20label%3Abaseline-document%20-label%3ATesting%20-label%3Adocumentation%20-label%3Aepic%20(milestone%3ANemo%20OR%20milestone%3AOrca%20OR%20milestone%3APlankton))"
  },
  {
    "tag": "v1.7.1",
    "version": "1.7.1",
    "publishedAt": "2026-02-20T21:11:36Z",
    "url": "https://github.com/cisagov/ScubaGear/releases/tag/v1.7.1",
    "baselineNotes": ""
  },
  {
    "tag": "v1.8.0",
    "version": "1.8.0",
    "publishedAt": "2026-05-07T21:44:29Z",
    "url": "https://github.com/cisagov/ScubaGear/releases/tag/v1.8.0",
    "baselineNotes": "### BOD 25-01 required configuration policy changes\r\n\r\nNo baseline updates included in this release."
  },
  {
    "tag": "v2.0.0",
    "version": "2.0.0",
    "publishedAt": "2026-10-22T21:22:11Z",
    "url": "https://github.com/cisagov/ScubaGear/releases/tag/v2.0.0",
    "baselineNotes": "### BOD 25-01 required configuration policy changes\r\n\r\nThis section lists baseline policy changes that affect current [BOD 25-01 Required Configurations](https://www.cisa.gov/resources-tools/services/bod-25-01-implementing-secure-practices-cloud-services-required-configurations).\r\n\r\n#### Additions\r\n\r\n* MS.AAD.3.5v2 (SHALL) - Requires the SMS, voice call, and email one-time passcode (OTP) authentication methods to be disabled, since they are the weakest authenticators. This version removes the prior dependency on the Authentication Methods Manage Migration feature being set to Migration Complete (MS.AAD.3.4v1), so the policy is now evaluated independently.\r\n* MS.AAD.9.1v1 (SHALL) - New policy requiring risky AI agents to be blocked. AI agents can access tenant resources and act autonomously, so blocking agents that exhibit risky behavior reduces the risk of unauthorized access and automated misuse. Requires a Microsoft Entra ID P2 license and either Microsoft Agent 365 or Microsoft 365 E7. Not applicable to GCC High and DoD tenants.\r\n* MS.SHAREPOINT.1.3v1 (SHALL) - Requires external sharing to be restricted to approved external domains and/or users in approved security groups, preventing sharing with unknown organizations and individuals. Only applies when the external sharing slider is not set to Only people in your organization or Existing guests.\r\n* MS.SHAREPOINT.3.1v1 (SHALL) - Requires expiration for \"Anyone\" links to be set to 30 days or less, preventing indefinite access through shared links. Only applies when the external sharing slider is set to Anyone.\r\n* MS.SHAREPOINT.3.2v1 (SHALL) - Requires file and folder permissions for links to be set to view only, preventing anonymous file changes. Only applies when the external sharing slider is set to Anyone.\r\n* MS.SHAREPOINT.3.3v2 (SHALL) - Requires reauthentication for people who use a verification code to be set to 30 days or less, preventing sustained access to documents. Policy version bumped to v2 because the setting can now also be configured when the external sharing slider is set to Existing guests.\r\n* MS.SECURITYSUITE.1.1v1 (SHALL) - Requires emails with click-to-run file attachments to be blocked, including at a minimum .exe, .cmd, and .vbe files. Replaces the preset security policy requirements formerly in MS.DEFENDER.1.1v1 - MS.DEFENDER.1.5v1.\r\n* MS.SECURITYSUITE.1.2v1 (SHALL) - Requires email scanning to be capable of reviewing emails after delivery, so messages retroactively identified as malware can be removed from mailboxes. Replaces the preset security policy requirements formerly in MS.DEFENDER.1.1v1 - MS.DEFENDER.1.5v1.\r\n* MS.SECURITYSUITE.1.3v1 (SHALL) - Requires emails identified as containing malware to be quarantined or dropped. Replaces the preset security policy requirements formerly in MS.DEFENDER.1.1v1 - MS.DEFENDER.1.5v1.\r\n* MS.SECURITYSUITE.3.1v1 (SHALL) - Requires a DLP policy that protects PII and sensitive information as defined by the agency, blocking at a minimum credit card numbers, U.S. ITINs, and U.S. SSNs. Replaces MS.DEFENDER.4.1v2.\r\n* MS.SECURITYSUITE.4.1v1 (SHALL) - Requires a minimum set of alerts to be enabled so potentially malicious or service-impacting events are brought to administrators' attention. Replaces MS.DEFENDER.5.1v1.\r\n* MS.SECURITYSUITE.5.1v1 (SHALL) - Requires unified audit logging to be enabled so agencies have visibility into user actions during incident response. Replaces MS.DEFENDER.6.1v1.\r\n* MS.SECURITYSUITE.6.1v1 (SHALL) - Requires emails detected as spam and phishing to not be delivered to the user's inbox, reducing exposure to malicious links and attachments.\r\n* MS.SECURITYSUITE.6.2v1 (SHALL) - Requires that allowed domains not be added to inbound anti-spam protection policies. Allowed senders may still be added.\r\n\r\n#### Removals\r\n\r\n* MS.DEFENDER.1.1v1, MS.DEFENDER.1.2v1, MS.DEFENDER.1.3v1, MS.DEFENDER.1.4v1, MS.DEFENDER.1.5v1, MS.DEFENDER.4.1v2, MS.DEFENDER.5.1v1, MS.DEFENDER.6.1v1 (SHALL) - The Microsoft Defender baseline has been retired and its policies reworked into the new Security Suite baseline (see Additions above). See the [policy migration mapping](https://github.com/cisagov/ScubaGear/blob/v2.0.0/PowerShell/ScubaGear/mappings/scuba-baseline-policy-migrations.csv) for where each policy moved, and [removedpolicies.md](https://github.com/cisagov/ScubaGear/blob/v2.0.0/PowerShell/ScubaGear/baselines/removedpolicies.md) for removal rationale.\r\n\r\n#### Updates\r\n\r\n* MS.AAD.3.2v2 (SHALL) - Policy version bumped to v2 because the policy was decoupled from MS.AAD.3.1v1. It previously applied only \"if phishing-resistant MFA has not been enforced\"; it now requires that MFA be enforced for all users, independent of MS.AAD.3.1v1.\r\n* MS.EXO.2.2v3 (SHALL) - Policy version bumped to v3 to allow SPF soft fail. Either hardfail (`-all`) or softfail (`~all`) may now be used to comply; previously only hardfail was accepted.\r\n\r\n### Other baseline changes\r\n\r\n* Update removedpolicies.md for the all security suite baseline updates by @ahuynhECS in #2134\r\n* Update MS.SHAREPOINT.3.3v1 since it can be configured when sharing is set to existing guests by @ahuynhECS in #2125\r\n* Add application management baseline policies (MS.AAD.5.5v1, MS.AAD.5.6v1, MS.AAD.5.7v1)  by @DickTracyII in #2111\r\n* Update MS.SECURITYSUITE.5.2v1 to a manual check by @ahuynhECS in #2425\r\n* Update ScubaGear baselines to match v2.0.0 CB Publications comments by @ahuynhECS in #2450\r\n*  Fix stale Microsoft Entra Portal references in the AAD baseline by @nward626 in #2325\r\n* Review MS Teams baseline for implementation differences by @RM-MITRE in #2344\r\n* Adding additional language to the CAP section to address conditions gap by @ahuynhECS in #1898\r\n* Update ScubaGear implementation for teams 5x policy new by @skirkpatrickMSFT in #1894\r\n* Add Indicators to Baselines by @dagarwal-ecs in #1884\r\n* Redefine sensitive accounts for more clarity and update \"important partners\" in DEFENDDER2.3v1 to \"Key suppliers and Partners\" as stated in the portal by @ahuynhECS in #1852\r\n* Allow SPF soft fail by @adhilto in #1851\r\n* Power Bi UI Updates by @JeremyEckert-MSFT in #1824\r\n* Update securitysuite5.2 to match new omb-26-14 requirements and automate the policy by @ahuynhECS in #2244\r\n* Add note to 6.1 for \"Delete message\" action not being available for high confidence phishing classification by @ahuynhECS in #2241\r\n* Updating Power Platform Baseline to reflect current UI changes  by @JeremyEckert-MSFT in #1803\r\n* Security suite baseline updates by @adhilto in #2210\r\n* Clarify MS.SHAREPOINT.1.3v1 note: domain/security-group restriction applies to new external users, not existing guests by @RYadav182 in #2383\r\n* See full list of baseline updates [here](https://github.com/cisagov/ScubaGear/issues?q=is%3Aissue%20is%3Aclosed%20label%3Abaseline-document%20-label%3ATesting%20-label%3Adocumentation%20-label%3Aepic)"
  }
];

export const BASELINE_CHANGES: BaselineChange[] = [
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "versioned",
    "controlId": "MS.AAD.3.3v2",
    "fromId": "MS.AAD.3.3v1",
    "toId": "MS.AAD.3.3v2",
    "product": "AAD",
    "fields": [
      "requirement",
      "rationale",
      "implementation"
    ],
    "title": {
      "from": "If phishing-resistant MFA has not been enforced and Microsoft Authenticator is enabled, it SHALL be configured to show login context information.",
      "to": "If Microsoft Authenticator is enabled, it SHALL be configured to show login context information."
    }
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "added",
    "controlId": "MS.AAD.3.9v1",
    "toId": "MS.AAD.3.9v1",
    "product": "AAD",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "Device code authentication SHOULD be blocked."
    }
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "revised",
    "controlId": "MS.DEFENDER.6.1v1",
    "fromId": "MS.DEFENDER.6.1v1",
    "toId": "MS.DEFENDER.6.1v1",
    "product": "DEFENDER",
    "fields": [
      "requirement",
      "rationale"
    ],
    "title": {
      "from": "Microsoft Purview Audit (Standard) logging SHALL be enabled.",
      "to": "Unified Audit logging SHALL be enabled."
    }
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "versioned",
    "controlId": "MS.EXO.1.1v2",
    "fromId": "MS.EXO.1.1v1",
    "toId": "MS.EXO.1.1v2",
    "product": "EXO",
    "fields": [
      "implementation",
      "notes"
    ]
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "revised",
    "controlId": "MS.EXO.17.1v1",
    "fromId": "MS.EXO.17.1v1",
    "toId": "MS.EXO.17.1v1",
    "product": "EXO",
    "fields": [
      "requirement",
      "rationale",
      "implementation"
    ],
    "title": {
      "from": "Microsoft Purview Audit (Standard) logging SHALL be enabled.",
      "to": "Unified Audit logging SHALL be enabled."
    }
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "revised",
    "controlId": "MS.EXO.17.3v1",
    "fromId": "MS.EXO.17.3v1",
    "toId": "MS.EXO.17.3v1",
    "product": "EXO",
    "fields": [
      "implementation",
      "notes",
      "mitre"
    ]
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "revised",
    "controlId": "MS.POWERPLATFORM.4.1v1",
    "fromId": "MS.POWERPLATFORM.4.1v1",
    "toId": "MS.POWERPLATFORM.4.1v1",
    "product": "POWERPLATFORM",
    "fields": [
      "notes"
    ]
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.1.2v1",
    "fromId": "MS.SHAREPOINT.1.2v1",
    "toId": "MS.SHAREPOINT.1.2v1",
    "product": "SHAREPOINT",
    "fields": [
      "rationale"
    ]
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.1.3v1",
    "fromId": "MS.SHAREPOINT.1.3v1",
    "toId": "MS.SHAREPOINT.1.3v1",
    "product": "SHAREPOINT",
    "fields": [
      "rationale",
      "notes"
    ]
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.3.1v1",
    "fromId": "MS.SHAREPOINT.3.1v1",
    "toId": "MS.SHAREPOINT.3.1v1",
    "product": "SHAREPOINT",
    "fields": [
      "rationale",
      "notes"
    ]
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.3.2v1",
    "fromId": "MS.SHAREPOINT.3.2v1",
    "toId": "MS.SHAREPOINT.3.2v1",
    "product": "SHAREPOINT",
    "fields": [
      "notes"
    ]
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.3.3v1",
    "fromId": "MS.SHAREPOINT.3.3v1",
    "toId": "MS.SHAREPOINT.3.3v1",
    "product": "SHAREPOINT",
    "fields": [
      "rationale",
      "notes"
    ]
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "revised",
    "controlId": "MS.TEAMS.1.6v1",
    "fromId": "MS.TEAMS.1.6v1",
    "toId": "MS.TEAMS.1.6v1",
    "product": "TEAMS",
    "fields": [
      "notes"
    ]
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "versioned",
    "controlId": "MS.TEAMS.1.7v2",
    "fromId": "MS.TEAMS.1.7v1",
    "toId": "MS.TEAMS.1.7v2",
    "product": "TEAMS",
    "fields": [
      "requirement",
      "criticality",
      "rationale",
      "implementation",
      "notes"
    ],
    "title": {
      "from": "Record an event SHOULD be set to Organizer can record.",
      "to": "Record an event SHOULD NOT be set to Always record."
    },
    "criticality": {
      "from": "SHOULD",
      "to": "SHOULD NOT"
    }
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "removed",
    "controlId": "MS.AAD.5.4v1",
    "fromId": "MS.AAD.5.4v1",
    "product": "AAD",
    "criticality": {
      "from": "SHALL NOT"
    },
    "title": {
      "from": "Group owners SHALL NOT be allowed to consent to applications."
    },
    "note": "Microsoft announced via MC712143 that it will no longer be possible for group owners to consent to applications. All references including the policy, implementation steps, and section have been removed as the setting is no longer present."
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.6.2v1",
    "fromId": "MS.DEFENDER.6.2v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "Microsoft Purview Audit (Premium) logging SHALL be enabled for ALL users."
    },
    "note": "MS.DEFENDER.6.2v1 was originally included in order to enable auditing of additional user actions not captured under Purview Audit (Standard). In October 2023, Microsoft announced changes to its Purview Audit service that included making audit events in Purview Audit (Premium) available to Purview Audit (Standard) subscribers. Now that the rollout of changes is completed, Purview (Standard) includes the necessary auditing that is addressed by MS.DEFENDER.6.1v1."
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "removed",
    "controlId": "MS.EXO.17.2v1",
    "fromId": "MS.EXO.17.2v1",
    "product": "EXO",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "Microsoft Purview Audit (Premium) logging SHALL be enabled."
    },
    "note": "MS.EXO.17.2v1 was originally included in order to enable auditing of additional user actions not captured under Purview Audit (Standard). In October 2023, Microsoft announced changes to its Purview Audit service that included making audit events in Purview Audit (Premium) available to Purview Audit (Standard) subscribers. Now that the rollout of changes has been completed, Purview (Standard) includes the necessary auditing which is addressed by MS.EXO.17.2v1"
  },
  {
    "fromVersion": "1.5.0",
    "toVersion": "1.6.0",
    "type": "removed",
    "controlId": "MS.SHAREPOINT.1.4v1",
    "fromId": "MS.SHAREPOINT.1.4v1",
    "product": "SHAREPOINT",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "Guest access SHALL be limited to the email the invitation was sent to."
    },
    "note": "The option to limit guest access to the email the invitation was sent to found in policy MS.SHAREPOINT.1.4v1 has been deprecated by Microsoft. All references, including the policy and its implementation steps, have been removed since the setting is no longer present."
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.1.1v1",
    "fromId": "MS.AAD.1.1v1",
    "toId": "MS.AAD.1.1v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.2.1v1",
    "fromId": "MS.AAD.2.1v1",
    "toId": "MS.AAD.2.1v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.2.3v1",
    "fromId": "MS.AAD.2.3v1",
    "toId": "MS.AAD.2.3v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.3.1v1",
    "fromId": "MS.AAD.3.1v1",
    "toId": "MS.AAD.3.1v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.3.2v1",
    "fromId": "MS.AAD.3.2v1",
    "toId": "MS.AAD.3.2v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "notes",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.3.3v2",
    "fromId": "MS.AAD.3.3v2",
    "toId": "MS.AAD.3.3v2",
    "product": "AAD",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.3.5v1",
    "fromId": "MS.AAD.3.5v1",
    "toId": "MS.AAD.3.5v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.3.6v1",
    "fromId": "MS.AAD.3.6v1",
    "toId": "MS.AAD.3.6v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.3.7v1",
    "fromId": "MS.AAD.3.7v1",
    "toId": "MS.AAD.3.7v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.3.9v1",
    "fromId": "MS.AAD.3.9v1",
    "toId": "MS.AAD.3.9v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.5.1v1",
    "fromId": "MS.AAD.5.1v1",
    "toId": "MS.AAD.5.1v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.5.2v1",
    "fromId": "MS.AAD.5.2v1",
    "toId": "MS.AAD.5.2v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.5.3v1",
    "fromId": "MS.AAD.5.3v1",
    "toId": "MS.AAD.5.3v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.7.4v1",
    "fromId": "MS.AAD.7.4v1",
    "toId": "MS.AAD.7.4v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.7.5v1",
    "fromId": "MS.AAD.7.5v1",
    "toId": "MS.AAD.7.5v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.7.6v1",
    "fromId": "MS.AAD.7.6v1",
    "toId": "MS.AAD.7.6v1",
    "product": "AAD",
    "fields": [
      "rationale",
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.7.7v1",
    "fromId": "MS.AAD.7.7v1",
    "toId": "MS.AAD.7.7v1",
    "product": "AAD",
    "fields": [
      "requirement",
      "implementation",
      "nist"
    ],
    "title": {
      "from": "Eligible and Active highly privileged role assignments SHALL trigger an alert.",
      "to": "Eligible and active highly privileged role assignments SHALL trigger an alert."
    }
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.7.8v1",
    "fromId": "MS.AAD.7.8v1",
    "toId": "MS.AAD.7.8v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.AAD.8.1v1",
    "fromId": "MS.AAD.8.1v1",
    "toId": "MS.AAD.8.1v1",
    "product": "AAD",
    "fields": [
      "rationale",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.DEFENDER.4.1v2",
    "fromId": "MS.DEFENDER.4.1v2",
    "toId": "MS.DEFENDER.4.1v2",
    "product": "DEFENDER",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.DEFENDER.4.5v1",
    "fromId": "MS.DEFENDER.4.5v1",
    "toId": "MS.DEFENDER.4.5v1",
    "product": "DEFENDER",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.DEFENDER.4.6v1",
    "fromId": "MS.DEFENDER.4.6v1",
    "toId": "MS.DEFENDER.4.6v1",
    "product": "DEFENDER",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.DEFENDER.5.1v1",
    "fromId": "MS.DEFENDER.5.1v1",
    "toId": "MS.DEFENDER.5.1v1",
    "product": "DEFENDER",
    "fields": [
      "rationale",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.DEFENDER.6.1v1",
    "fromId": "MS.DEFENDER.6.1v1",
    "toId": "MS.DEFENDER.6.1v1",
    "product": "DEFENDER",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.EXO.7.1v1",
    "fromId": "MS.EXO.7.1v1",
    "toId": "MS.EXO.7.1v1",
    "product": "EXO",
    "fields": [
      "rationale",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.EXO.8.2v2",
    "fromId": "MS.EXO.8.2v2",
    "toId": "MS.EXO.8.2v2",
    "product": "EXO",
    "fields": [
      "rationale",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.EXO.8.4v1",
    "fromId": "MS.EXO.8.4v1",
    "toId": "MS.EXO.8.4v1",
    "product": "EXO",
    "fields": [
      "rationale",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.EXO.9.4v1",
    "fromId": "MS.EXO.9.4v1",
    "toId": "MS.EXO.9.4v1",
    "product": "EXO",
    "fields": [
      "requirement",
      "nist"
    ],
    "title": {
      "from": "Alternatively chosen filtering solutions SHOULD offer services comparable to Microsoft Defender's Common Attachment Filter.",
      "to": "If a third-party filtering solution is used, it SHOULD offer services comparable to Microsoft Defender's Common Attachment Filter."
    }
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.EXO.10.1v1",
    "fromId": "MS.EXO.10.1v1",
    "toId": "MS.EXO.10.1v1",
    "product": "EXO",
    "fields": [
      "rationale",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.EXO.10.3v1",
    "fromId": "MS.EXO.10.3v1",
    "toId": "MS.EXO.10.3v1",
    "product": "EXO",
    "fields": [
      "rationale",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.EXO.14.1v2",
    "fromId": "MS.EXO.14.1v2",
    "toId": "MS.EXO.14.1v2",
    "product": "EXO",
    "fields": [
      "rationale",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.EXO.14.2v1",
    "fromId": "MS.EXO.14.2v1",
    "toId": "MS.EXO.14.2v1",
    "product": "EXO",
    "fields": [
      "rationale",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.EXO.14.3v1",
    "fromId": "MS.EXO.14.3v1",
    "toId": "MS.EXO.14.3v1",
    "product": "EXO",
    "fields": [
      "rationale",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.EXO.14.4v1",
    "fromId": "MS.EXO.14.4v1",
    "toId": "MS.EXO.14.4v1",
    "product": "EXO",
    "fields": [
      "rationale",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.EXO.17.3v1",
    "fromId": "MS.EXO.17.3v1",
    "toId": "MS.EXO.17.3v1",
    "product": "EXO",
    "fields": [
      "rationale",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.POWERBI.3.1v1",
    "fromId": "MS.POWERBI.3.1v1",
    "toId": "MS.POWERBI.3.1v1",
    "product": "POWERBI",
    "fields": [
      "rationale",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.POWERBI.6.1v1",
    "fromId": "MS.POWERBI.6.1v1",
    "toId": "MS.POWERBI.6.1v1",
    "product": "POWERBI",
    "fields": [
      "rationale",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.1.1v1",
    "fromId": "MS.SHAREPOINT.1.1v1",
    "toId": "MS.SHAREPOINT.1.1v1",
    "product": "SHAREPOINT",
    "fields": [
      "requirement",
      "nist"
    ],
    "title": {
      "from": "External sharing for SharePoint SHALL be limited to Existing guests or Only people in your organization.",
      "to": "External sharing for SharePoint SHALL be limited to \"Existing guests\" or \"Only people in your organization\"."
    }
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.1.2v1",
    "fromId": "MS.SHAREPOINT.1.2v1",
    "toId": "MS.SHAREPOINT.1.2v1",
    "product": "SHAREPOINT",
    "fields": [
      "requirement",
      "nist"
    ],
    "title": {
      "from": "External sharing for OneDrive SHALL be limited to Existing guests or Only people in your organization.",
      "to": "External sharing for OneDrive SHALL be limited to \"Existing guests\" or \"Only people in your organization\"."
    }
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.2.1v1",
    "fromId": "MS.SHAREPOINT.2.1v1",
    "toId": "MS.SHAREPOINT.2.1v1",
    "product": "SHAREPOINT",
    "fields": [
      "requirement",
      "nist"
    ],
    "title": {
      "from": "File and folder default sharing scope SHALL be set to Specific people (only the people the user specifies).",
      "to": "File and folder default sharing scope SHALL be set to \"Specific people (only the people the user specifies)\"."
    }
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.2.2v1",
    "fromId": "MS.SHAREPOINT.2.2v1",
    "toId": "MS.SHAREPOINT.2.2v1",
    "product": "SHAREPOINT",
    "fields": [
      "requirement",
      "rationale",
      "nist"
    ],
    "title": {
      "from": "File and folder default sharing permissions SHALL be set to View.",
      "to": "File and folder default sharing permissions SHALL be set to view only."
    }
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.3.2v1",
    "fromId": "MS.SHAREPOINT.3.2v1",
    "toId": "MS.SHAREPOINT.3.2v1",
    "product": "SHAREPOINT",
    "fields": [
      "requirement",
      "nist"
    ],
    "title": {
      "from": "The allowable file and folder permissions for links SHALL be set to View only.",
      "to": "The allowable file and folder permissions for links SHALL be set to view only."
    }
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.3.3v1",
    "fromId": "MS.SHAREPOINT.3.3v1",
    "toId": "MS.SHAREPOINT.3.3v1",
    "product": "SHAREPOINT",
    "fields": [
      "rationale",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "versioned",
    "controlId": "MS.TEAMS.1.2v2",
    "fromId": "MS.TEAMS.1.2v1",
    "toId": "MS.TEAMS.1.2v2",
    "product": "TEAMS",
    "fields": [
      "rationale",
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.TEAMS.1.7v2",
    "fromId": "MS.TEAMS.1.7v2",
    "toId": "MS.TEAMS.1.7v2",
    "product": "TEAMS",
    "fields": [
      "rationale",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "versioned",
    "controlId": "MS.TEAMS.2.1v2",
    "fromId": "MS.TEAMS.2.1v1",
    "toId": "MS.TEAMS.2.1v2",
    "product": "TEAMS",
    "fields": [
      "rationale",
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "versioned",
    "controlId": "MS.TEAMS.2.2v2",
    "fromId": "MS.TEAMS.2.2v1",
    "toId": "MS.TEAMS.2.2v2",
    "product": "TEAMS",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "versioned",
    "controlId": "MS.TEAMS.2.3v2",
    "fromId": "MS.TEAMS.2.3v1",
    "toId": "MS.TEAMS.2.3v2",
    "product": "TEAMS",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "versioned",
    "controlId": "MS.TEAMS.5.1v2",
    "fromId": "MS.TEAMS.5.1v1",
    "toId": "MS.TEAMS.5.1v2",
    "product": "TEAMS",
    "fields": [
      "rationale",
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "versioned",
    "controlId": "MS.TEAMS.5.2v2",
    "fromId": "MS.TEAMS.5.2v1",
    "toId": "MS.TEAMS.5.2v2",
    "product": "TEAMS",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "versioned",
    "controlId": "MS.TEAMS.5.3v2",
    "fromId": "MS.TEAMS.5.3v1",
    "toId": "MS.TEAMS.5.3v2",
    "product": "TEAMS",
    "fields": [
      "implementation",
      "nist"
    ]
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.TEAMS.6.1v1",
    "fromId": "MS.TEAMS.6.1v1",
    "toId": "MS.TEAMS.6.1v1",
    "product": "TEAMS",
    "fields": [
      "requirement",
      "rationale",
      "nist"
    ],
    "title": {
      "from": "A DLP solution SHALL be enabled. The selected DLP solution SHOULD offer services comparable to the native DLP solution offered by Microsoft.",
      "to": "A DLP solution SHALL be enabled and SHOULD offer services comparable to the native DLP solution offered by Microsoft."
    }
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "revised",
    "controlId": "MS.TEAMS.6.2v1",
    "fromId": "MS.TEAMS.6.2v1",
    "toId": "MS.TEAMS.6.2v1",
    "product": "TEAMS",
    "fields": [
      "requirement",
      "rationale",
      "nist"
    ],
    "title": {
      "from": "The DLP solution SHALL protect personally identifiable information (PII) and sensitive information, as defined by the agency. At a minimum, sharing of credit card numbers, taxpayer identification numbers (TINs), and Social Security numbers (SSNs) via email SHALL be restricted.",
      "to": "The DLP solution SHALL protect personally identifiable information (PII) and sensitive information, as defined by the agency. At a minimum, sharing credit card numbers, taxpayer identification numbers (TINs), and Social Security numbers (SSNs) via email SHALL be restricted."
    }
  },
  {
    "fromVersion": "1.6.0",
    "toVersion": "1.7.0",
    "type": "removed",
    "controlId": "MS.TEAMS.3.1v1",
    "fromId": "MS.TEAMS.3.1v1",
    "product": "TEAMS",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "Contact with Skype users SHALL be blocked."
    },
    "note": "The option to restrict contact with Skype users found in policy MS.TEAMS.3.1v1 has been deprecated by Microsoft. All references, including the policy and its implementation steps, have been removed since the setting is no longer present."
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.AAD.1.1v1",
    "fromId": "MS.AAD.1.1v1",
    "toId": "MS.AAD.1.1v1",
    "product": "AAD",
    "fields": [
      "exclusionType"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.AAD.2.1v1",
    "fromId": "MS.AAD.2.1v1",
    "toId": "MS.AAD.2.1v1",
    "product": "AAD",
    "fields": [
      "exclusionType"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.AAD.2.3v1",
    "fromId": "MS.AAD.2.3v1",
    "toId": "MS.AAD.2.3v1",
    "product": "AAD",
    "fields": [
      "exclusionType"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.AAD.3.1v1",
    "fromId": "MS.AAD.3.1v1",
    "toId": "MS.AAD.3.1v1",
    "product": "AAD",
    "fields": [
      "exclusionType"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.AAD.3.2v1",
    "fromId": "MS.AAD.3.2v1",
    "toId": "MS.AAD.3.2v1",
    "product": "AAD",
    "fields": [
      "exclusionType"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.AAD.3.6v1",
    "fromId": "MS.AAD.3.6v1",
    "toId": "MS.AAD.3.6v1",
    "product": "AAD",
    "fields": [
      "exclusionType"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.AAD.3.7v1",
    "fromId": "MS.AAD.3.7v1",
    "toId": "MS.AAD.3.7v1",
    "product": "AAD",
    "fields": [
      "exclusionType"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.AAD.3.8v1",
    "fromId": "MS.AAD.3.8v1",
    "toId": "MS.AAD.3.8v1",
    "product": "AAD",
    "fields": [
      "exclusionType"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.AAD.3.9v1",
    "fromId": "MS.AAD.3.9v1",
    "toId": "MS.AAD.3.9v1",
    "product": "AAD",
    "fields": [
      "exclusionType"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.AAD.7.4v1",
    "fromId": "MS.AAD.7.4v1",
    "toId": "MS.AAD.7.4v1",
    "product": "AAD",
    "fields": [
      "exclusionType"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.DEFENDER.1.4v1",
    "fromId": "MS.DEFENDER.1.4v1",
    "toId": "MS.DEFENDER.1.4v1",
    "product": "DEFENDER",
    "fields": [
      "exclusionType"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.DEFENDER.1.5v1",
    "fromId": "MS.DEFENDER.1.5v1",
    "toId": "MS.DEFENDER.1.5v1",
    "product": "DEFENDER",
    "fields": [
      "exclusionType"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.DEFENDER.2.1v1",
    "fromId": "MS.DEFENDER.2.1v1",
    "toId": "MS.DEFENDER.2.1v1",
    "product": "DEFENDER",
    "fields": [
      "exclusionType"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.DEFENDER.2.2v1",
    "fromId": "MS.DEFENDER.2.2v1",
    "toId": "MS.DEFENDER.2.2v1",
    "product": "DEFENDER",
    "fields": [
      "exclusionType"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.DEFENDER.2.3v1",
    "fromId": "MS.DEFENDER.2.3v1",
    "toId": "MS.DEFENDER.2.3v1",
    "product": "DEFENDER",
    "fields": [
      "exclusionType"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.EXO.1.1v2",
    "fromId": "MS.EXO.1.1v2",
    "toId": "MS.EXO.1.1v2",
    "product": "EXO",
    "fields": [
      "exclusionType"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.POWERPLATFORM.2.1v1",
    "fromId": "MS.POWERPLATFORM.2.1v1",
    "toId": "MS.POWERPLATFORM.2.1v1",
    "product": "POWERPLATFORM",
    "fields": [
      "notes"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.POWERPLATFORM.5.1v1",
    "fromId": "MS.POWERPLATFORM.5.1v1",
    "toId": "MS.POWERPLATFORM.5.1v1",
    "product": "POWERPLATFORM",
    "fields": [
      "implementation"
    ]
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "added",
    "controlId": "MS.POWERPLATFORM.6.1v1",
    "toId": "MS.POWERPLATFORM.6.1v1",
    "product": "POWERPLATFORM",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "The Share with Everyone feature SHOULD be disabled."
    }
  },
  {
    "fromVersion": "1.7.1",
    "toVersion": "1.8.0",
    "type": "revised",
    "controlId": "MS.TEAMS.4.1v1",
    "fromId": "MS.TEAMS.4.1v1",
    "toId": "MS.TEAMS.4.1v1",
    "product": "TEAMS",
    "fields": [
      "notes"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.1.1v1",
    "fromId": "MS.AAD.1.1v1",
    "toId": "MS.AAD.1.1v1",
    "product": "AAD",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.2.1v1",
    "fromId": "MS.AAD.2.1v1",
    "toId": "MS.AAD.2.1v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "notes",
      "section"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.2.2v1",
    "fromId": "MS.AAD.2.2v1",
    "toId": "MS.AAD.2.2v1",
    "product": "AAD",
    "fields": [
      "rationale",
      "implementation",
      "section"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.2.3v1",
    "fromId": "MS.AAD.2.3v1",
    "toId": "MS.AAD.2.3v1",
    "product": "AAD",
    "fields": [
      "requirement",
      "rationale",
      "implementation",
      "section"
    ],
    "title": {
      "from": "Sign-ins detected as high risk SHALL be blocked.",
      "to": "Sign-ins detected as high-risk SHALL be blocked."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.3.1v1",
    "fromId": "MS.AAD.3.1v1",
    "toId": "MS.AAD.3.1v1",
    "product": "AAD",
    "fields": [
      "requirement",
      "rationale"
    ],
    "title": {
      "from": "Phishing-resistant MFA SHALL be enforced for all users. The phishing-resistant methods Microsoft Entra ID certificate-based authentication (CBA), FIDO2 Security Key, Windows Hello for Business, and device-bound passkeys (in the authenticator app of choice) are the recommended authentication options since they offer forms of MFA with the least weaknesses. For federal agencies, Microsoft Entra ID CBA supports federal PIV card authentication directly to Microsoft Entra ID. If on-premises PIV authentication and federation to Microsoft Entra ID is used, enforce PIV logon via Microsoft Active Directory group policy.",
      "to": "Phishing-resistant MFA SHALL be enforced for all users. The phishing-resistant methods of Microsoft Entra ID certificate-based authentication (CBA), FIDO2 Security Key, Windows Hello for Business, and device-bound passkeys (in the authenticator application of choice) are the recommended authentication options since they offer forms of MFA with the fewest weaknesses. For federal agencies, Microsoft Entra ID CBA supports federal PIV card authentication directly to Microsoft Entra ID. If on-premises PIV authentication and federation to Microsoft Entra ID is used, enforce PIV logon via the Microsoft Active Directory group policy."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "versioned",
    "controlId": "MS.AAD.3.2v2",
    "fromId": "MS.AAD.3.2v1",
    "toId": "MS.AAD.3.2v2",
    "product": "AAD",
    "fields": [
      "requirement",
      "rationale",
      "implementation",
      "notes"
    ],
    "title": {
      "from": "If phishing-resistant MFA has not been enforced, an alternative MFA method SHALL be enforced for all users.",
      "to": "MFA SHALL be enforced for all users."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.3.3v2",
    "fromId": "MS.AAD.3.3v2",
    "toId": "MS.AAD.3.3v2",
    "product": "AAD",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.3.4v1",
    "fromId": "MS.AAD.3.4v1",
    "toId": "MS.AAD.3.4v1",
    "product": "AAD",
    "fields": [
      "requirement",
      "rationale",
      "implementation"
    ],
    "title": {
      "from": "The Authentication Methods Manage Migration feature SHALL be set to Migration Complete.",
      "to": "The \"Authentication methods manage migration\" feature SHALL be set to \"Migration complete.\""
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "versioned",
    "controlId": "MS.AAD.3.5v2",
    "fromId": "MS.AAD.3.5v1",
    "toId": "MS.AAD.3.5v2",
    "product": "AAD",
    "fields": [
      "requirement",
      "implementation",
      "notes",
      "mitre"
    ],
    "title": {
      "from": "The authentication methods SMS, Voice Call, and Email One-Time Passcode (OTP) SHALL be disabled.",
      "to": "The authentication methods of short message service (SMS), voice call, and email one-time passcode (OTP) SHALL be disabled."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.3.6v1",
    "fromId": "MS.AAD.3.6v1",
    "toId": "MS.AAD.3.6v1",
    "product": "AAD",
    "fields": [
      "implementation",
      "notes"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.3.7v1",
    "fromId": "MS.AAD.3.7v1",
    "toId": "MS.AAD.3.7v1",
    "product": "AAD",
    "fields": [
      "rationale"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.3.8v1",
    "fromId": "MS.AAD.3.8v1",
    "toId": "MS.AAD.3.8v1",
    "product": "AAD",
    "fields": [
      "requirement",
      "rationale"
    ],
    "title": {
      "from": "Managed Devices SHOULD be required to register MFA.",
      "to": "Managed devices SHOULD be required to register MFA."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.3.9v1",
    "fromId": "MS.AAD.3.9v1",
    "toId": "MS.AAD.3.9v1",
    "product": "AAD",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.4.1v1",
    "fromId": "MS.AAD.4.1v1",
    "toId": "MS.AAD.4.1v1",
    "product": "AAD",
    "fields": [
      "rationale",
      "notes"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.5.1v1",
    "fromId": "MS.AAD.5.1v1",
    "toId": "MS.AAD.5.1v1",
    "product": "AAD",
    "fields": [
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.5.2v1",
    "fromId": "MS.AAD.5.2v1",
    "toId": "MS.AAD.5.2v1",
    "product": "AAD",
    "fields": [
      "requirement",
      "rationale",
      "implementation"
    ],
    "title": {
      "from": "Only administrators SHALL be allowed to consent to applications.",
      "to": "User consent to applications SHALL be restricted."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.5.3v1",
    "fromId": "MS.AAD.5.3v1",
    "toId": "MS.AAD.5.3v1",
    "product": "AAD",
    "fields": [
      "requirement",
      "rationale",
      "implementation"
    ],
    "title": {
      "from": "An admin consent workflow SHALL be configured for applications.",
      "to": "An administrative consent workflow SHALL be configured for applications."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.AAD.5.5v1",
    "toId": "MS.AAD.5.5v1",
    "product": "AAD",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "Application password addition SHOULD be blocked."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.AAD.5.6v1",
    "toId": "MS.AAD.5.6v1",
    "product": "AAD",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "Application password lifetime SHOULD be restricted to 180 days or less."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.AAD.5.7v1",
    "toId": "MS.AAD.5.7v1",
    "product": "AAD",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "Application certificate lifetime SHOULD be restricted to 365 days or less."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.6.1v1",
    "fromId": "MS.AAD.6.1v1",
    "toId": "MS.AAD.6.1v1",
    "product": "AAD",
    "fields": [
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.7.1v1",
    "fromId": "MS.AAD.7.1v1",
    "toId": "MS.AAD.7.1v1",
    "product": "AAD",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.7.2v1",
    "fromId": "MS.AAD.7.2v1",
    "toId": "MS.AAD.7.2v1",
    "product": "AAD",
    "fields": [
      "requirement",
      "rationale",
      "implementation"
    ],
    "title": {
      "from": "Privileged users SHALL be provisioned with finer-grained roles instead of Global Administrator.",
      "to": "Privileged users SHALL be provisioned with finer-grained roles instead of the Global Administrator role."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.7.3v1",
    "fromId": "MS.AAD.7.3v1",
    "toId": "MS.AAD.7.3v1",
    "product": "AAD",
    "fields": [
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.7.4v1",
    "fromId": "MS.AAD.7.4v1",
    "toId": "MS.AAD.7.4v1",
    "product": "AAD",
    "fields": [
      "rationale",
      "implementation",
      "notes"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.7.5v1",
    "fromId": "MS.AAD.7.5v1",
    "toId": "MS.AAD.7.5v1",
    "product": "AAD",
    "fields": [
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.7.6v1",
    "fromId": "MS.AAD.7.6v1",
    "toId": "MS.AAD.7.6v1",
    "product": "AAD",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.7.7v1",
    "fromId": "MS.AAD.7.7v1",
    "toId": "MS.AAD.7.7v1",
    "product": "AAD",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.7.8v1",
    "fromId": "MS.AAD.7.8v1",
    "toId": "MS.AAD.7.8v1",
    "product": "AAD",
    "fields": [
      "rationale",
      "implementation",
      "notes"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.7.9v1",
    "fromId": "MS.AAD.7.9v1",
    "toId": "MS.AAD.7.9v1",
    "product": "AAD",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.8.1v1",
    "fromId": "MS.AAD.8.1v1",
    "toId": "MS.AAD.8.1v1",
    "product": "AAD",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.8.2v1",
    "fromId": "MS.AAD.8.2v1",
    "toId": "MS.AAD.8.2v1",
    "product": "AAD",
    "fields": [
      "requirement",
      "rationale",
      "implementation"
    ],
    "title": {
      "from": "Only users with the Guest Inviter role SHOULD be able to invite guest users.",
      "to": "Only users with the \"Guest Inviter\" role SHOULD be able to invite guest users."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.AAD.8.3v1",
    "fromId": "MS.AAD.8.3v1",
    "toId": "MS.AAD.8.3v1",
    "product": "AAD",
    "fields": [
      "requirement",
      "rationale",
      "implementation"
    ],
    "title": {
      "from": "Guest invites SHOULD only be allowed to specific external domains that have been authorized by the agency for legitimate business purposes.",
      "to": "Guest invites SHOULD only be allowed to be sent to specific external domains that have been authorized by the agency for legitimate business purposes."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.AAD.9.1v1",
    "toId": "MS.AAD.9.1v1",
    "product": "AAD",
    "criticality": {
      "to": "SHALL"
    },
    "title": {
      "to": "Risky AI agents SHALL be blocked."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.EXO.1.1v2",
    "fromId": "MS.EXO.1.1v2",
    "toId": "MS.EXO.1.1v2",
    "product": "EXO",
    "fields": [
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "versioned",
    "controlId": "MS.EXO.2.2v3",
    "fromId": "MS.EXO.2.2v2",
    "toId": "MS.EXO.2.2v3",
    "product": "EXO",
    "fields": [
      "rationale",
      "implementation",
      "notes"
    ],
    "note": "Currently requires SPF policies to include a hard fail -all not a soft fail ~all. Relax that requirement to accept both hard and soft fails. Bumped to v3"
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.EXO.3.1v1",
    "fromId": "MS.EXO.3.1v1",
    "toId": "MS.EXO.3.1v1",
    "product": "EXO",
    "fields": [
      "rationale"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.EXO.4.1v1",
    "fromId": "MS.EXO.4.1v1",
    "toId": "MS.EXO.4.1v1",
    "product": "EXO",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.EXO.4.2v1",
    "fromId": "MS.EXO.4.2v1",
    "toId": "MS.EXO.4.2v1",
    "product": "EXO",
    "fields": [
      "rationale"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.EXO.4.3v1",
    "fromId": "MS.EXO.4.3v1",
    "toId": "MS.EXO.4.3v1",
    "product": "EXO",
    "fields": [
      "rationale",
      "notes"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.EXO.5.1v1",
    "fromId": "MS.EXO.5.1v1",
    "toId": "MS.EXO.5.1v1",
    "product": "EXO",
    "fields": [
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.EXO.6.1v1",
    "fromId": "MS.EXO.6.1v1",
    "toId": "MS.EXO.6.1v1",
    "product": "EXO",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.EXO.6.2v1",
    "fromId": "MS.EXO.6.2v1",
    "toId": "MS.EXO.6.2v1",
    "product": "EXO",
    "fields": [
      "rationale"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.EXO.7.1v1",
    "fromId": "MS.EXO.7.1v1",
    "toId": "MS.EXO.7.1v1",
    "product": "EXO",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.EXO.13.1v1",
    "fromId": "MS.EXO.13.1v1",
    "toId": "MS.EXO.13.1v1",
    "product": "EXO",
    "fields": [
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERBI.1.1v1",
    "fromId": "MS.POWERBI.1.1v1",
    "toId": "MS.POWERBI.1.1v1",
    "product": "POWERBI",
    "fields": [
      "requirement",
      "implementation"
    ],
    "title": {
      "from": "The Publish to Web feature SHOULD be disabled unless the agency mission requires the capability.",
      "to": "The \"Publish to Web\" feature SHOULD be disabled unless the agency mission requires the capability."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERBI.2.1v1",
    "fromId": "MS.POWERBI.2.1v1",
    "toId": "MS.POWERBI.2.1v1",
    "product": "POWERBI",
    "fields": [
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERBI.3.1v1",
    "fromId": "MS.POWERBI.3.1v1",
    "toId": "MS.POWERBI.3.1v1",
    "product": "POWERBI",
    "fields": [
      "requirement",
      "rationale",
      "implementation"
    ],
    "title": {
      "from": "The Invite external users to your organization feature SHOULD be disabled unless agency mission requires the capability.",
      "to": "The \"Invite external users to your organization\" feature SHOULD be disabled unless agency mission requires the capability."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERBI.4.1v1",
    "fromId": "MS.POWERBI.4.1v1",
    "toId": "MS.POWERBI.4.1v1",
    "product": "POWERBI",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERBI.4.2v1",
    "fromId": "MS.POWERBI.4.2v1",
    "toId": "MS.POWERBI.4.2v1",
    "product": "POWERBI",
    "fields": [
      "requirement",
      "rationale",
      "implementation"
    ],
    "title": {
      "from": "Service principals creating and using profiles SHOULD be restricted to specific security groups.",
      "to": "Service principals' ability to create and use profiles SHOULD be restricted to specific security groups."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERBI.5.1v1",
    "fromId": "MS.POWERBI.5.1v1",
    "toId": "MS.POWERBI.5.1v1",
    "product": "POWERBI",
    "fields": [
      "requirement",
      "rationale",
      "implementation",
      "section"
    ],
    "title": {
      "from": "ResourceKey-based authentication SHOULD be blocked unless a specific use case (e.g., streaming and/or PUSH datasets) merits its use.",
      "to": "ResourceKey-based authentication SHOULD be blocked unless a specific use case (e.g., streaming and/or \"push\" datasets) merits its use."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERBI.6.1v1",
    "fromId": "MS.POWERBI.6.1v1",
    "toId": "MS.POWERBI.6.1v1",
    "product": "POWERBI",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERBI.7.1v1",
    "fromId": "MS.POWERBI.7.1v1",
    "toId": "MS.POWERBI.7.1v1",
    "product": "POWERBI",
    "fields": [
      "rationale",
      "implementation",
      "mitre"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERPLATFORM.1.1v1",
    "fromId": "MS.POWERPLATFORM.1.1v1",
    "toId": "MS.POWERPLATFORM.1.1v1",
    "product": "POWERPLATFORM",
    "fields": [
      "requirement",
      "rationale",
      "implementation",
      "notes"
    ],
    "title": {
      "from": "The ability to create production and sandbox environments SHALL be restricted to admins.",
      "to": "The ability to create production and sandbox environments SHALL be restricted to administrators."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERPLATFORM.1.2v1",
    "fromId": "MS.POWERPLATFORM.1.2v1",
    "toId": "MS.POWERPLATFORM.1.2v1",
    "product": "POWERPLATFORM",
    "fields": [
      "requirement",
      "rationale",
      "implementation",
      "notes"
    ],
    "title": {
      "from": "The ability to create trial environments SHALL be restricted to admins.",
      "to": "The ability to create trial environments SHALL be restricted to administrators."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERPLATFORM.2.1v1",
    "fromId": "MS.POWERPLATFORM.2.1v1",
    "toId": "MS.POWERPLATFORM.2.1v1",
    "product": "POWERPLATFORM",
    "fields": [
      "rationale",
      "implementation",
      "notes"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERPLATFORM.2.2v1",
    "fromId": "MS.POWERPLATFORM.2.2v1",
    "toId": "MS.POWERPLATFORM.2.2v1",
    "product": "POWERPLATFORM",
    "fields": [
      "requirement",
      "rationale",
      "implementation"
    ],
    "title": {
      "from": "Non-default environments SHOULD have at least one DLP policy affecting them.",
      "to": "Non-default environments SHOULD have at least one DLP policy."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERPLATFORM.3.1v1",
    "fromId": "MS.POWERPLATFORM.3.1v1",
    "toId": "MS.POWERPLATFORM.3.1v1",
    "product": "POWERPLATFORM",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERPLATFORM.3.2v1",
    "fromId": "MS.POWERPLATFORM.3.2v1",
    "toId": "MS.POWERPLATFORM.3.2v1",
    "product": "POWERPLATFORM",
    "fields": [
      "rationale",
      "implementation",
      "notes"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERPLATFORM.4.1v1",
    "fromId": "MS.POWERPLATFORM.4.1v1",
    "toId": "MS.POWERPLATFORM.4.1v1",
    "product": "POWERPLATFORM",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERPLATFORM.5.1v1",
    "fromId": "MS.POWERPLATFORM.5.1v1",
    "toId": "MS.POWERPLATFORM.5.1v1",
    "product": "POWERPLATFORM",
    "fields": [
      "requirement",
      "rationale",
      "implementation"
    ],
    "title": {
      "from": "The ability to create Power Pages sites SHOULD be restricted to admins.",
      "to": "The ability to create Power Pages sites SHOULD be restricted to administrators."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.POWERPLATFORM.6.1v1",
    "fromId": "MS.POWERPLATFORM.6.1v1",
    "toId": "MS.POWERPLATFORM.6.1v1",
    "product": "POWERPLATFORM",
    "fields": [
      "requirement",
      "rationale",
      "implementation"
    ],
    "title": {
      "from": "The Share with Everyone feature SHOULD be disabled.",
      "to": "The \"Share with everyone\" feature SHOULD be disabled."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.1.1v1",
    "toId": "MS.SECURITYSUITE.1.1v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHALL"
    },
    "title": {
      "to": "Emails with click-to-run file attachments SHALL be blocked including, at a minimum, .exe, .cmd, and .vbe files."
    },
    "replaces": [
      "MS.EXO.9.1v2",
      "MS.EXO.9.3v2",
      "MS.EXO.9.5v1",
      "MS.DEFENDER.1.1v1",
      "MS.DEFENDER.1.2v1",
      "MS.DEFENDER.1.3v1",
      "MS.DEFENDER.1.4v1",
      "MS.DEFENDER.1.5v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.1.2v1",
    "toId": "MS.SECURITYSUITE.1.2v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHALL"
    },
    "title": {
      "to": "Email scanning SHALL be capable of reviewing emails after delivery."
    },
    "replaces": [
      "MS.EXO.10.3v1",
      "MS.DEFENDER.1.1v1",
      "MS.DEFENDER.1.2v1",
      "MS.DEFENDER.1.3v1",
      "MS.DEFENDER.1.4v1",
      "MS.DEFENDER.1.5v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.1.3v1",
    "toId": "MS.SECURITYSUITE.1.3v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHALL"
    },
    "title": {
      "to": "Emails identified as containing malware SHALL be quarantined or dropped."
    },
    "replaces": [
      "MS.EXO.10.1v1",
      "MS.EXO.10.2v1",
      "MS.DEFENDER.1.1v1",
      "MS.DEFENDER.1.2v1",
      "MS.DEFENDER.1.3v1",
      "MS.DEFENDER.1.4v1",
      "MS.DEFENDER.1.5v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.1.4v1",
    "toId": "MS.SECURITYSUITE.1.4v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "SharePoint, OneDrive, and Teams message attachments SHOULD be scanned for malware."
    },
    "replaces": [
      "MS.TEAMS.7.1v1",
      "MS.TEAMS.7.2v1",
      "MS.DEFENDER.1.1v1",
      "MS.DEFENDER.1.2v1",
      "MS.DEFENDER.1.3v1",
      "MS.DEFENDER.1.4v1",
      "MS.DEFENDER.1.5v1",
      "MS.DEFENDER.3.1v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.2.1v1",
    "toId": "MS.SECURITYSUITE.2.1v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "User impersonation protection SHOULD be enabled for sensitive accounts."
    },
    "replaces": [
      "MS.EXO.11.1v1",
      "MS.DEFENDER.2.1v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.2.2v1",
    "toId": "MS.SECURITYSUITE.2.2v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "Domain impersonation protection SHOULD be enabled for domains owned by the agency."
    },
    "replaces": [
      "MS.DEFENDER.2.2v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.2.3v1",
    "toId": "MS.SECURITYSUITE.2.3v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "Domain impersonation protection SHOULD be added for key suppliers and partners."
    },
    "replaces": [
      "MS.DEFENDER.2.3v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.2.4v1",
    "toId": "MS.SECURITYSUITE.2.4v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "User warnings, comparable to the user safety tips included with EOP, SHOULD be displayed."
    },
    "replaces": [
      "MS.EXO.11.2v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.3.1v1",
    "toId": "MS.SECURITYSUITE.3.1v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHALL"
    },
    "title": {
      "to": "A DLP policy SHALL be configured to protect PII and sensitive information, as defined by the agency, blocking at a minimum: credit card numbers, U.S. Individual Taxpayer Identification Numbers (ITIN), and U.S. Social Security numbers (SSN)."
    },
    "replaces": [
      "MS.EXO.8.1v2",
      "MS.EXO.8.2v2",
      "MS.EXO.8.4v1",
      "MS.TEAMS.6.2v1",
      "MS.DEFENDER.4.1v2"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.3.2v1",
    "toId": "MS.SECURITYSUITE.3.2v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "The DLP policy SHOULD be applied to Exchange, OneDrive, SharePoint, Teams chat, and Devices."
    },
    "replaces": [
      "MS.TEAMS.6.1v1",
      "MS.DEFENDER.4.2v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.3.3v1",
    "toId": "MS.SECURITYSUITE.3.3v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "The action for the DLP policy SHOULD be set to block sharing sensitive information with everyone."
    },
    "replaces": [
      "MS.DEFENDER.4.3v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.3.4v1",
    "toId": "MS.SECURITYSUITE.3.4v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "Notifications to inform users and help educate them on the proper use of sensitive information SHOULD be enabled in the DLP policy."
    },
    "replaces": [
      "MS.DEFENDER.4.4v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.3.5v1",
    "toId": "MS.SECURITYSUITE.3.5v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "The DLP policy SHOULD include an action to block access to sensitive information by restricted applications and unwanted Bluetooth applications."
    },
    "replaces": [
      "MS.DEFENDER.4.6v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.4.1v1",
    "toId": "MS.SECURITYSUITE.4.1v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHALL"
    },
    "title": {
      "to": "At a minimum, the following alerts SHALL be enabled: a. Suspicious email sending patterns detected. b. Suspicious Connector Activity. c. Suspicious Email Forwarding Activity. d. Messages have been delayed. e. Tenant restricted from sending unprovisioned email. f. Tenant restricted from sending email. g. A potentially malicious URL click was detected."
    },
    "replaces": [
      "MS.EXO.16.1v1",
      "MS.DEFENDER.5.1v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.4.2v1",
    "toId": "MS.SECURITYSUITE.4.2v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "The alerts SHOULD be sent to a monitored address or incorporated into a Security Information and Event Management (SIEM)."
    },
    "replaces": [
      "MS.EXO.16.2v1",
      "MS.DEFENDER.5.2v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.5.1v1",
    "toId": "MS.SECURITYSUITE.5.1v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHALL"
    },
    "title": {
      "to": "Unified audit logging SHALL be enabled."
    },
    "replaces": [
      "MS.EXO.17.1v1",
      "MS.DEFENDER.6.1v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.5.2v1",
    "toId": "MS.SECURITYSUITE.5.2v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHALL"
    },
    "title": {
      "to": "Audit logs SHALL be retained and searchable for a minimum of 3 months and retrievable for a minimum of 12 months."
    },
    "replaces": [
      "MS.EXO.17.3v1",
      "MS.DEFENDER.6.3v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.6.1v1",
    "toId": "MS.SECURITYSUITE.6.1v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHALL NOT"
    },
    "title": {
      "to": "Emails detected as spam and phishing SHALL NOT be delivered to the user's inbox."
    },
    "replaces": [
      "MS.EXO.14.1v2",
      "MS.EXO.14.2v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.6.2v1",
    "toId": "MS.SECURITYSUITE.6.2v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHALL NOT"
    },
    "title": {
      "to": "Allowed domains SHALL NOT be added to inbound anti-spam protection policies."
    },
    "replaces": [
      "MS.EXO.14.3v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.7.1v1",
    "toId": "MS.SECURITYSUITE.7.1v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "URL comparison with a block-list SHOULD be enabled for URLs in emails, Teams messages, and Office documents."
    },
    "replaces": [
      "MS.EXO.15.1v1",
      "MS.TEAMS.8.1v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.7.2v1",
    "toId": "MS.SECURITYSUITE.7.2v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "Direct download links SHOULD be scanned for malware."
    },
    "replaces": [
      "MS.EXO.15.2v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.7.3v1",
    "toId": "MS.SECURITYSUITE.7.3v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHOULD"
    },
    "title": {
      "to": "User click tracking SHOULD be enabled."
    },
    "replaces": [
      "MS.EXO.15.3v1",
      "MS.TEAMS.8.2v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.8.1v1",
    "toId": "MS.SECURITYSUITE.8.1v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHOULD NOT"
    },
    "title": {
      "to": "IP allow lists SHOULD NOT be created."
    },
    "replaces": [
      "MS.EXO.12.1v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "added",
    "controlId": "MS.SECURITYSUITE.8.2v1",
    "toId": "MS.SECURITYSUITE.8.2v1",
    "product": "SECURITYSUITE",
    "criticality": {
      "to": "SHOULD NOT"
    },
    "title": {
      "to": "Safe lists SHOULD NOT be enabled."
    },
    "replaces": [
      "MS.EXO.12.2v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.1.1v1",
    "fromId": "MS.SHAREPOINT.1.1v1",
    "toId": "MS.SHAREPOINT.1.1v1",
    "product": "SHAREPOINT",
    "fields": [
      "requirement",
      "rationale",
      "mitre"
    ],
    "title": {
      "from": "External sharing for SharePoint SHALL be limited to \"Existing guests\" or \"Only people in your organization\".",
      "to": "External sharing for SharePoint SHALL be limited to \"Existing guests\" or \"Only people in your organization.\""
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.1.2v1",
    "fromId": "MS.SHAREPOINT.1.2v1",
    "toId": "MS.SHAREPOINT.1.2v1",
    "product": "SHAREPOINT",
    "fields": [
      "requirement",
      "rationale",
      "mitre"
    ],
    "title": {
      "from": "External sharing for OneDrive SHALL be limited to \"Existing guests\" or \"Only people in your organization\".",
      "to": "External sharing for OneDrive SHALL be limited to \"Existing guests\" or \"Only people in your organization.\""
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.1.3v1",
    "fromId": "MS.SHAREPOINT.1.3v1",
    "toId": "MS.SHAREPOINT.1.3v1",
    "product": "SHAREPOINT",
    "fields": [
      "implementation",
      "notes",
      "mitre"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.2.1v1",
    "fromId": "MS.SHAREPOINT.2.1v1",
    "toId": "MS.SHAREPOINT.2.1v1",
    "product": "SHAREPOINT",
    "fields": [
      "requirement",
      "implementation",
      "mitre"
    ],
    "title": {
      "from": "File and folder default sharing scope SHALL be set to \"Specific people (only the people the user specifies)\".",
      "to": "File and folder default sharing scope SHALL be set to \"Specific people (only the people the user specifies).\""
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.2.2v1",
    "fromId": "MS.SHAREPOINT.2.2v1",
    "toId": "MS.SHAREPOINT.2.2v1",
    "product": "SHAREPOINT",
    "fields": [
      "rationale"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.3.1v1",
    "fromId": "MS.SHAREPOINT.3.1v1",
    "toId": "MS.SHAREPOINT.3.1v1",
    "product": "SHAREPOINT",
    "fields": [
      "requirement",
      "implementation",
      "section"
    ],
    "title": {
      "from": "Expiration days for Anyone links SHALL be set to 30 days or less.",
      "to": "Expiration days for \"Anyone\" links SHALL be set to 30 days or less."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.SHAREPOINT.3.2v1",
    "fromId": "MS.SHAREPOINT.3.2v1",
    "toId": "MS.SHAREPOINT.3.2v1",
    "product": "SHAREPOINT",
    "fields": [
      "rationale",
      "implementation",
      "section"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "versioned",
    "controlId": "MS.SHAREPOINT.3.3v2",
    "fromId": "MS.SHAREPOINT.3.3v1",
    "toId": "MS.SHAREPOINT.3.3v2",
    "product": "SHAREPOINT",
    "fields": [
      "notes",
      "section"
    ],
    "note": "Policy now also applies when the external sharing slider is set to Existing guests. Bumped to v2"
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.TEAMS.1.1v1",
    "fromId": "MS.TEAMS.1.1v1",
    "toId": "MS.TEAMS.1.1v1",
    "product": "TEAMS",
    "fields": [
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.TEAMS.1.2v2",
    "fromId": "MS.TEAMS.1.2v2",
    "toId": "MS.TEAMS.1.2v2",
    "product": "TEAMS",
    "fields": [
      "requirement",
      "rationale",
      "implementation"
    ],
    "title": {
      "from": "Anonymous users SHALL NOT be enabled to start meetings.",
      "to": "Anonymous users SHALL NOT be enabled to start Microsoft Teams meetings."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.TEAMS.1.3v1",
    "fromId": "MS.TEAMS.1.3v1",
    "toId": "MS.TEAMS.1.3v1",
    "product": "TEAMS",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.TEAMS.1.4v1",
    "fromId": "MS.TEAMS.1.4v1",
    "toId": "MS.TEAMS.1.4v1",
    "product": "TEAMS",
    "fields": [
      "requirement",
      "implementation"
    ],
    "title": {
      "from": "Internal users SHOULD be admitted automatically.",
      "to": "Internal users SHOULD be admitted to Microsoft Teams meetings automatically."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.TEAMS.1.5v1",
    "fromId": "MS.TEAMS.1.5v1",
    "toId": "MS.TEAMS.1.5v1",
    "product": "TEAMS",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.TEAMS.1.6v1",
    "fromId": "MS.TEAMS.1.6v1",
    "toId": "MS.TEAMS.1.6v1",
    "product": "TEAMS",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.TEAMS.1.7v2",
    "fromId": "MS.TEAMS.1.7v2",
    "toId": "MS.TEAMS.1.7v2",
    "product": "TEAMS",
    "fields": [
      "requirement",
      "rationale",
      "implementation"
    ],
    "title": {
      "from": "Record an event SHOULD NOT be set to Always record.",
      "to": "\"Record an event\" SHOULD NOT be set to \"Always record.\""
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.TEAMS.2.1v2",
    "fromId": "MS.TEAMS.2.1v2",
    "toId": "MS.TEAMS.2.1v2",
    "product": "TEAMS",
    "fields": [
      "rationale",
      "implementation"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.TEAMS.2.2v2",
    "fromId": "MS.TEAMS.2.2v2",
    "toId": "MS.TEAMS.2.2v2",
    "product": "TEAMS",
    "fields": [
      "rationale",
      "implementation",
      "notes"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.TEAMS.2.3v2",
    "fromId": "MS.TEAMS.2.3v2",
    "toId": "MS.TEAMS.2.3v2",
    "product": "TEAMS",
    "fields": [
      "implementation",
      "notes"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.TEAMS.4.1v1",
    "fromId": "MS.TEAMS.4.1v1",
    "toId": "MS.TEAMS.4.1v1",
    "product": "TEAMS",
    "fields": [
      "requirement",
      "rationale",
      "implementation",
      "notes"
    ],
    "title": {
      "from": "Teams email integration SHALL be disabled.",
      "to": "Microsoft Teams email integration SHALL be disabled."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.TEAMS.5.1v2",
    "fromId": "MS.TEAMS.5.1v2",
    "toId": "MS.TEAMS.5.1v2",
    "product": "TEAMS",
    "fields": [
      "requirement",
      "rationale",
      "implementation"
    ],
    "title": {
      "from": "Agencies SHOULD only allow installation of Microsoft apps approved by the agency.",
      "to": "Agencies SHOULD only allow installation of Microsoft applications approved by the agency."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.TEAMS.5.2v2",
    "fromId": "MS.TEAMS.5.2v2",
    "toId": "MS.TEAMS.5.2v2",
    "product": "TEAMS",
    "fields": [
      "requirement",
      "rationale",
      "implementation",
      "notes"
    ],
    "title": {
      "from": "Agencies SHOULD only allow installation of third-party apps approved by the agency.",
      "to": "Agencies SHOULD only allow installation of third-party applications approved by the agency."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "revised",
    "controlId": "MS.TEAMS.5.3v2",
    "fromId": "MS.TEAMS.5.3v2",
    "toId": "MS.TEAMS.5.3v2",
    "product": "TEAMS",
    "fields": [
      "requirement",
      "rationale",
      "implementation",
      "notes"
    ],
    "title": {
      "from": "Agencies SHOULD only allow installation of custom apps approved by the agency.",
      "to": "Agencies SHOULD only allow installation of custom applications approved by the agency."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.1.1v1",
    "fromId": "MS.DEFENDER.1.1v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "The standard and strict preset security policies SHALL be enabled."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.1.1v1",
      "MS.SECURITYSUITE.1.2v1",
      "MS.SECURITYSUITE.1.3v1",
      "MS.SECURITYSUITE.1.4v1"
    ],
    "note": "Reworked into the new security suite baseline policy group 1 (MS.SECURITYSUITE.1.1v1 - MS.SECURITYSUITE.1.4v1)."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.1.2v1",
    "fromId": "MS.DEFENDER.1.2v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "All users SHALL be added to Exchange Online Protection (EOP) in either the standard or strict preset security policy."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.1.1v1",
      "MS.SECURITYSUITE.1.2v1",
      "MS.SECURITYSUITE.1.3v1",
      "MS.SECURITYSUITE.1.4v1"
    ],
    "note": "Reworked into the new security suite baseline policy group 1 (MS.SECURITYSUITE.1.1v1 - MS.SECURITYSUITE.1.4v1)."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.1.3v1",
    "fromId": "MS.DEFENDER.1.3v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "All users SHALL be added to Defender for Office 365 protection in either the standard or strict preset security policy."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.1.1v1",
      "MS.SECURITYSUITE.1.2v1",
      "MS.SECURITYSUITE.1.3v1",
      "MS.SECURITYSUITE.1.4v1"
    ],
    "note": "Reworked into the new security suite baseline policy group 1 (MS.SECURITYSUITE.1.1v1 - MS.SECURITYSUITE.1.4v1)."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.1.4v1",
    "fromId": "MS.DEFENDER.1.4v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "Sensitive accounts SHALL be added to Exchange Online Protection in the strict preset security policy."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.1.1v1",
      "MS.SECURITYSUITE.1.2v1",
      "MS.SECURITYSUITE.1.3v1",
      "MS.SECURITYSUITE.1.4v1"
    ],
    "note": "Reworked into the new security suite baseline policy group 1 (MS.SECURITYSUITE.1.1v1 - MS.SECURITYSUITE.1.4v1)."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.1.5v1",
    "fromId": "MS.DEFENDER.1.5v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "Sensitive accounts SHALL be added to Defender for Office 365 protection in the strict preset security policy."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.1.1v1",
      "MS.SECURITYSUITE.1.2v1",
      "MS.SECURITYSUITE.1.3v1",
      "MS.SECURITYSUITE.1.4v1"
    ],
    "note": "Reworked into the new security suite baseline policy group 1 (MS.SECURITYSUITE.1.1v1 - MS.SECURITYSUITE.1.4v1)."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.2.1v1",
    "fromId": "MS.DEFENDER.2.1v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "User impersonation protection SHOULD be enabled for sensitive accounts in both the standard and strict preset policies."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.2.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.2.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.2.2v1",
    "fromId": "MS.DEFENDER.2.2v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "Domain impersonation protection SHOULD be enabled for domains owned by the agency in both the standard and strict preset policies."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.2.2v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.2.2v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.2.3v1",
    "fromId": "MS.DEFENDER.2.3v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "Domain impersonation protection SHOULD be added for important partners in both the standard and strict preset policies."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.2.3v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.2.3v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.3.1v1",
    "fromId": "MS.DEFENDER.3.1v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "Safe attachments SHOULD be enabled for SharePoint, OneDrive, and Microsoft Teams."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.1.4v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.4v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.4.1v2",
    "fromId": "MS.DEFENDER.4.1v2",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "A custom policy SHALL be configured to protect PII and sensitive information, as defined by the agency, blocking at a minimum: credit card numbers, U.S. Individual Taxpayer Identification Numbers (ITIN), and U.S. Social Security numbers (SSN)."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.3.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.4.2v1",
    "fromId": "MS.DEFENDER.4.2v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "The custom policy SHOULD be applied to Exchange, OneDrive, SharePoint, Teams chat, and Devices."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.3.2v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.2v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.4.3v1",
    "fromId": "MS.DEFENDER.4.3v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "The action for the custom policy SHOULD be set to block sharing sensitive information with everyone."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.3.3v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.3v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.4.4v1",
    "fromId": "MS.DEFENDER.4.4v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "Notifications to inform users and help educate them on the proper use of sensitive information SHOULD be enabled in the custom policy."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.3.4v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.4v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.4.5v1",
    "fromId": "MS.DEFENDER.4.5v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "A list of apps that are restricted from accessing files protected by DLP policy SHOULD be defined."
    },
    "replacedBy": [],
    "note": "Removed the policy because it could not be automatically evaluated by the ScubaGear tool. It defined a best practice requiring agencies to create a list of applications restricted from accessing files protected by the DLP policy."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.4.6v1",
    "fromId": "MS.DEFENDER.4.6v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "The custom policy SHOULD include an action to block access to sensitive information by restricted apps and unwanted Bluetooth applications."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.3.5v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.5v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.5.1v1",
    "fromId": "MS.DEFENDER.5.1v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "At a minimum, the alerts required by the CISA M365 Secure Configuration Baseline for Exchange Online SHALL be enabled."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.4.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.4.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.5.2v1",
    "fromId": "MS.DEFENDER.5.2v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "The alerts SHOULD be sent to a monitored address or incorporated into a Security Information and Event Management (SIEM)."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.4.2v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.4.2v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.6.1v1",
    "fromId": "MS.DEFENDER.6.1v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "Unified Audit logging SHALL be enabled."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.5.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.5.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.DEFENDER.6.3v1",
    "fromId": "MS.DEFENDER.6.3v1",
    "product": "DEFENDER",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "Audit logs SHALL be maintained for at least the minimum duration dictated by OMB M-21-31."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.5.2v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.5.2v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.8.1v2",
    "fromId": "MS.EXO.8.1v2",
    "product": "EXO",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "A DLP solution SHALL be used."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.3.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.8.2v2",
    "fromId": "MS.EXO.8.2v2",
    "product": "EXO",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "The DLP solution SHALL protect personally identifiable information (PII) and sensitive information, as defined by the agency."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.3.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.8.3v1",
    "fromId": "MS.EXO.8.3v1",
    "product": "EXO",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "The selected DLP solution SHOULD offer services comparable to the native DLP solution offered by Microsoft."
    },
    "replacedBy": [],
    "note": "Removed \"comparable to solution offered by Microsoft policies\""
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.8.4v1",
    "fromId": "MS.EXO.8.4v1",
    "product": "EXO",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "At a minimum, the DLP solution SHALL restrict sharing credit card numbers, U.S. Individual Taxpayer Identification Numbers (ITIN), and U.S. Social Security numbers (SSN) via email."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.3.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.9.1v2",
    "fromId": "MS.EXO.9.1v2",
    "product": "EXO",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "Emails SHALL be filtered by attachment file types."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.1.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.9.2v1",
    "fromId": "MS.EXO.9.2v1",
    "product": "EXO",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "The attachment filter SHOULD attempt to determine the true file type and assess the file extension."
    },
    "replacedBy": [],
    "note": "Removed the policy because it could not be configured via Defender and assessed by ScubaGear."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.9.3v2",
    "fromId": "MS.EXO.9.3v2",
    "product": "EXO",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "Disallowed file types SHALL be determined and enforced."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.1.1v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.9.4v1",
    "fromId": "MS.EXO.9.4v1",
    "product": "EXO",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "If a third-party filtering solution is used, it SHOULD offer services comparable to Microsoft Defender's Common Attachment Filter."
    },
    "replacedBy": [],
    "note": "Removed \"comparable to solution offered by Microsoft policies\""
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.9.5v1",
    "fromId": "MS.EXO.9.5v1",
    "product": "EXO",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "At a minimum, click-to-run files SHOULD be blocked (e.g., .exe, .cmd, and .vbe)."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.1.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.10.1v1",
    "fromId": "MS.EXO.10.1v1",
    "product": "EXO",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "Emails SHALL be scanned for malware."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.1.3v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.3v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.10.2v1",
    "fromId": "MS.EXO.10.2v1",
    "product": "EXO",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "Emails identified as containing malware SHALL be quarantined or dropped."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.1.3v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.3v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.10.3v1",
    "fromId": "MS.EXO.10.3v1",
    "product": "EXO",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "Email scanning SHALL be capable of reviewing emails after delivery."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.1.2v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.2v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.11.1v1",
    "fromId": "MS.EXO.11.1v1",
    "product": "EXO",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "Impersonation protection checks SHOULD be used."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.2.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.2.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.11.2v1",
    "fromId": "MS.EXO.11.2v1",
    "product": "EXO",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "User warnings, comparable to the user safety tips included with EOP, SHOULD be displayed."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.2.4v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.2.4v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.11.3v1",
    "fromId": "MS.EXO.11.3v1",
    "product": "EXO",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "The phishing protection solution SHOULD include an AI-based phishing detection tool comparable to EOP Mailbox Intelligence."
    },
    "replacedBy": [],
    "note": "Removed \"comparable to solution offered by Microsoft policies\""
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.12.1v1",
    "fromId": "MS.EXO.12.1v1",
    "product": "EXO",
    "criticality": {
      "from": "SHOULD NOT"
    },
    "title": {
      "from": "IP allow lists SHOULD NOT be created."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.8.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.8.1v1"
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.12.2v1",
    "fromId": "MS.EXO.12.2v1",
    "product": "EXO",
    "criticality": {
      "from": "SHOULD NOT"
    },
    "title": {
      "from": "Safe lists SHOULD NOT be enabled."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.8.2v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.8.2v1"
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.14.1v2",
    "fromId": "MS.EXO.14.1v2",
    "product": "EXO",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "A spam filter SHALL be enabled."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.6.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.6.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.14.2v1",
    "fromId": "MS.EXO.14.2v1",
    "product": "EXO",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "Spam and high confidence spam SHALL be moved to either the junk email folder or the quarantine folder."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.6.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.6.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.14.3v1",
    "fromId": "MS.EXO.14.3v1",
    "product": "EXO",
    "criticality": {
      "from": "SHALL NOT"
    },
    "title": {
      "from": "Allowed domains SHALL NOT be added to inbound anti-spam protection policies."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.6.2v1"
    ]
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.14.4v1",
    "fromId": "MS.EXO.14.4v1",
    "product": "EXO",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "If a third-party party filtering solution is used, the solution SHOULD offer services comparable to the native spam filtering offered by Microsoft."
    }
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.15.1v1",
    "fromId": "MS.EXO.15.1v1",
    "product": "EXO",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "URL comparison with a block-list SHOULD be enabled."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.7.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.7.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.15.2v1",
    "fromId": "MS.EXO.15.2v1",
    "product": "EXO",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "Direct download links SHOULD be scanned for malware."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.7.2v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.7.2v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.15.3v1",
    "fromId": "MS.EXO.15.3v1",
    "product": "EXO",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "User click tracking SHOULD be enabled."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.7.3v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.7.3v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.16.1v1",
    "fromId": "MS.EXO.16.1v1",
    "product": "EXO",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "At a minimum, the following alerts SHALL be enabled: a. Suspicious email sending patterns detected. b. Suspicious Connector Activity. c. Suspicious Email Forwarding Activity. d. Messages have been delayed. e. Tenant restricted from sending unprovisioned email. f. Tenant restricted from sending email. g. A potentially malicious URL click was detected."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.4.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.4.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.16.2v1",
    "fromId": "MS.EXO.16.2v1",
    "product": "EXO",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "The alerts SHOULD be sent to a monitored address or incorporated into a security information and event management (SIEM) system."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.4.2v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.4.2v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.17.1v1",
    "fromId": "MS.EXO.17.1v1",
    "product": "EXO",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "Unified Audit logging SHALL be enabled."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.5.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.5.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.EXO.17.3v1",
    "fromId": "MS.EXO.17.3v1",
    "product": "EXO",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "Audit logs SHALL be maintained for at least the minimum duration dictated by OMB M-21-31 (Appendix C)."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.5.2v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.5.2v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.TEAMS.6.1v1",
    "fromId": "MS.TEAMS.6.1v1",
    "product": "TEAMS",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "A DLP solution SHALL be enabled and SHOULD offer services comparable to the native DLP solution offered by Microsoft."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.3.2v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.2v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.TEAMS.6.2v1",
    "fromId": "MS.TEAMS.6.2v1",
    "product": "TEAMS",
    "criticality": {
      "from": "SHALL"
    },
    "title": {
      "from": "The DLP solution SHALL protect personally identifiable information (PII) and sensitive information, as defined by the agency. At a minimum, sharing credit card numbers, taxpayer identification numbers (TINs), and Social Security numbers (SSNs) via email SHALL be restricted."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.3.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.TEAMS.7.1v1",
    "fromId": "MS.TEAMS.7.1v1",
    "product": "TEAMS",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "Attachments included with Teams messages SHOULD be scanned for malware."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.1.4v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.4v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.TEAMS.7.2v1",
    "fromId": "MS.TEAMS.7.2v1",
    "product": "TEAMS",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "Users SHOULD be prevented from opening or downloading files detected as malware."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.1.4v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.4v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.TEAMS.8.1v1",
    "fromId": "MS.TEAMS.8.1v1",
    "product": "TEAMS",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "URL comparison with a blocklist SHOULD be enabled."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.7.1v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.7.1v1."
  },
  {
    "fromVersion": "1.8.0",
    "toVersion": "2.0.0",
    "type": "removed",
    "controlId": "MS.TEAMS.8.2v1",
    "fromId": "MS.TEAMS.8.2v1",
    "product": "TEAMS",
    "criticality": {
      "from": "SHOULD"
    },
    "title": {
      "from": "User click tracking SHOULD be enabled."
    },
    "replacedBy": [
      "MS.SECURITYSUITE.7.3v1"
    ],
    "note": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.7.3v1."
  }
];

export const LEGACY_CONTROLS: LegacyControl[] = [
  {
    "id": "MS.AAD.5.4v1",
    "product": "AAD",
    "section": "Application Registration and Consent",
    "sectionNumber": 5,
    "title": "Group owners SHALL NOT be allowed to consent to applications.",
    "criticality": "SHALL NOT",
    "rationale": "In M365, group owners and team owners can consent to applications accessing data in the tenant. By requiring consent requests to go through an approval workflow, risk of exposure to malicious applications is reduced.",
    "lastVersion": "1.5.0",
    "removedIn": "1.6.0",
    "replacedBy": [],
    "removalRationale": "Microsoft announced via MC712143 that it will no longer be possible for group owners to consent to applications. All references including the policy, implementation steps, and section have been removed as the setting is no longer present."
  },
  {
    "id": "MS.DEFENDER.1.1v1",
    "product": "DEFENDER",
    "section": "Preset Security Profiles",
    "sectionNumber": 1,
    "title": "The standard and strict preset security policies SHALL be enabled.",
    "criticality": "SHALL",
    "rationale": "Defender includes a large number of features and settings to protect users against threats. Using the preset security policies, administrators can help ensure all new and existing users automatically have secure defaults applied.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.1.1v1",
      "MS.SECURITYSUITE.1.2v1",
      "MS.SECURITYSUITE.1.3v1",
      "MS.SECURITYSUITE.1.4v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy group 1 (MS.SECURITYSUITE.1.1v1 - MS.SECURITYSUITE.1.4v1)."
  },
  {
    "id": "MS.DEFENDER.1.2v1",
    "product": "DEFENDER",
    "section": "Preset Security Profiles",
    "sectionNumber": 1,
    "title": "All users SHALL be added to Exchange Online Protection (EOP) in either the standard or strict preset security policy.",
    "criticality": "SHALL",
    "rationale": "Important user protections are provided by EOP, including anti-spam, anti-malware, and anti-phishing protections. By using the preset policies, administrators can help ensure all new and existing users have secure defaults applied automatically.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.1.1v1",
      "MS.SECURITYSUITE.1.2v1",
      "MS.SECURITYSUITE.1.3v1",
      "MS.SECURITYSUITE.1.4v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy group 1 (MS.SECURITYSUITE.1.1v1 - MS.SECURITYSUITE.1.4v1)."
  },
  {
    "id": "MS.DEFENDER.1.3v1",
    "product": "DEFENDER",
    "section": "Preset Security Profiles",
    "sectionNumber": 1,
    "title": "All users SHALL be added to Defender for Office 365 protection in either the standard or strict preset security policy.",
    "criticality": "SHALL",
    "rationale": "Important user protections are provided by Defender for Office 365 protection, including safe attachments and safe links. By using the preset policies, administrators can help ensure all new and existing users have secure defaults applied automatically.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.1.1v1",
      "MS.SECURITYSUITE.1.2v1",
      "MS.SECURITYSUITE.1.3v1",
      "MS.SECURITYSUITE.1.4v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy group 1 (MS.SECURITYSUITE.1.1v1 - MS.SECURITYSUITE.1.4v1)."
  },
  {
    "id": "MS.DEFENDER.1.4v1",
    "product": "DEFENDER",
    "section": "Preset Security Profiles",
    "sectionNumber": 1,
    "title": "Sensitive accounts SHALL be added to Exchange Online Protection in the strict preset security policy.",
    "criticality": "SHALL",
    "rationale": "Unauthorized access to a sensitive account may result in greater harm than a standard user account. Adding sensitive accounts to the strict preset security policy, with its increased protections, better mitigates their elevated risk to email threats.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.1.1v1",
      "MS.SECURITYSUITE.1.2v1",
      "MS.SECURITYSUITE.1.3v1",
      "MS.SECURITYSUITE.1.4v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy group 1 (MS.SECURITYSUITE.1.1v1 - MS.SECURITYSUITE.1.4v1)."
  },
  {
    "id": "MS.DEFENDER.1.5v1",
    "product": "DEFENDER",
    "section": "Preset Security Profiles",
    "sectionNumber": 1,
    "title": "Sensitive accounts SHALL be added to Defender for Office 365 protection in the strict preset security policy.",
    "criticality": "SHALL",
    "rationale": "Unauthorized access to a sensitive account may result in greater harm than to a standard user account. Adding sensitive accounts to the strict preset security policy, with its increased protections, better mitigates their elevated risk.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.1.1v1",
      "MS.SECURITYSUITE.1.2v1",
      "MS.SECURITYSUITE.1.3v1",
      "MS.SECURITYSUITE.1.4v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy group 1 (MS.SECURITYSUITE.1.1v1 - MS.SECURITYSUITE.1.4v1)."
  },
  {
    "id": "MS.DEFENDER.2.1v1",
    "product": "DEFENDER",
    "section": "Impersonation Protection",
    "sectionNumber": 2,
    "title": "User impersonation protection SHOULD be enabled for sensitive accounts in both the standard and strict preset policies.",
    "criticality": "SHOULD",
    "rationale": "User impersonation, especially of users with access to sensitive or high-value information and resources, has the potential to result in serious harm. Impersonation protection mitigates this risk. By configuring impersonation protection in both preset policies, administrators can help protect email recipients from impersonated emails, regardless of whether they are added to the standard or strict policy.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.2.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.2.1v1."
  },
  {
    "id": "MS.DEFENDER.2.2v1",
    "product": "DEFENDER",
    "section": "Impersonation Protection",
    "sectionNumber": 2,
    "title": "Domain impersonation protection SHOULD be enabled for domains owned by the agency in both the standard and strict preset policies.",
    "criticality": "SHOULD",
    "rationale": "Configuring domain impersonation protection for all agency domains reduces the risk of a user being deceived by a look-alike domain. By configuring impersonation protection in both preset policies, administrators can help protect email recipients from impersonated emails, regardless of whether they are added to the standard or strict policy.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.2.2v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.2.2v1."
  },
  {
    "id": "MS.DEFENDER.2.3v1",
    "product": "DEFENDER",
    "section": "Impersonation Protection",
    "sectionNumber": 2,
    "title": "Domain impersonation protection SHOULD be added for important partners in both the standard and strict preset policies.",
    "criticality": "SHOULD",
    "rationale": "Configuring domain impersonation protection for domains owned by important partners reduces the risk of a user being deceived by a look-alike domain. By configuring impersonation protection in both preset policies, administrators can help protect email recipients from impersonated emails, regardless of whether they are added to the standard or strict policy.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.2.3v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.2.3v1."
  },
  {
    "id": "MS.DEFENDER.3.1v1",
    "product": "DEFENDER",
    "section": "Safe Attachments",
    "sectionNumber": 3,
    "title": "Safe attachments SHOULD be enabled for SharePoint, OneDrive, and Microsoft Teams.",
    "criticality": "SHOULD",
    "rationale": "Clicking malicious links makes users vulnerable to attacks, and this danger is not limited to links in emails. Other Microsoft products, such as Microsoft Teams, can be used to present users with malicious links. As such, it is important to protect users on these other Microsoft products as well.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.1.4v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.4v1."
  },
  {
    "id": "MS.DEFENDER.4.1v2",
    "product": "DEFENDER",
    "section": "Data Loss Prevention",
    "sectionNumber": 4,
    "title": "A custom policy SHALL be configured to protect PII and sensitive information, as defined by the agency, blocking at a minimum: credit card numbers, U.S. Individual Taxpayer Identification Numbers (ITIN), and U.S. Social Security numbers (SSN).",
    "criticality": "SHALL",
    "rationale": "Users may inadvertently share sensitive information with others who should not have access to it. DLP policies provide a way for agencies to detect and prevent unauthorized disclosures.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.3.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.1v1."
  },
  {
    "id": "MS.DEFENDER.4.2v1",
    "product": "DEFENDER",
    "section": "Data Loss Prevention",
    "sectionNumber": 4,
    "title": "The custom policy SHOULD be applied to Exchange, OneDrive, SharePoint, Teams chat, and Devices.",
    "criticality": "SHOULD",
    "rationale": "Unauthorized disclosures may happen through M365 services or endpoint devices. DLP policies should cover all affected locations to be effective.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.3.2v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.2v1."
  },
  {
    "id": "MS.DEFENDER.4.3v1",
    "product": "DEFENDER",
    "section": "Data Loss Prevention",
    "sectionNumber": 4,
    "title": "The action for the custom policy SHOULD be set to block sharing sensitive information with everyone.",
    "criticality": "SHOULD",
    "rationale": "Access to sensitive information should be prohibited unless explicitly allowed. Specific exemptions can be made based on agency policies and valid business justifications.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.3.3v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.3v1."
  },
  {
    "id": "MS.DEFENDER.4.4v1",
    "product": "DEFENDER",
    "section": "Data Loss Prevention",
    "sectionNumber": 4,
    "title": "Notifications to inform users and help educate them on the proper use of sensitive information SHOULD be enabled in the custom policy.",
    "criticality": "SHOULD",
    "rationale": "Some users may not be aware of agency policies on proper use of sensitive information. Enabling notifications provides positive feedback to users when accessing sensitive information.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.3.4v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.4v1."
  },
  {
    "id": "MS.DEFENDER.4.5v1",
    "product": "DEFENDER",
    "section": "Data Loss Prevention",
    "sectionNumber": 4,
    "title": "A list of apps that are restricted from accessing files protected by DLP policy SHOULD be defined.",
    "criticality": "SHOULD",
    "rationale": "Some apps may inappropriately share accessed files or not conform to agency policies for access to sensitive information. Defining a list of those apps makes it possible to use DLP policies to restrict those apps' access to sensitive information on endpoints using Defender.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [],
    "removalRationale": "Removed the policy because it could not be automatically evaluated by the ScubaGear tool. It defined a best practice requiring agencies to create a list of applications restricted from accessing files protected by the DLP policy."
  },
  {
    "id": "MS.DEFENDER.4.6v1",
    "product": "DEFENDER",
    "section": "Data Loss Prevention",
    "sectionNumber": 4,
    "title": "The custom policy SHOULD include an action to block access to sensitive information by restricted apps and unwanted Bluetooth applications.",
    "criticality": "SHOULD",
    "rationale": "Some apps may inappropriately share accessed files or not conform to agency policies for access to sensitive information. Defining a DLP policy with an action to block access from restricted apps and unwanted Bluetooth applications prevents unauthorized disclosure by those programs.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.3.5v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.5v1."
  },
  {
    "id": "MS.DEFENDER.5.1v1",
    "product": "DEFENDER",
    "section": "Alerts",
    "sectionNumber": 5,
    "title": "At a minimum, the alerts required by the CISA M365 Secure Configuration Baseline for Exchange Online SHALL be enabled.",
    "criticality": "SHALL",
    "rationale": "Potentially malicious or service-impacting events may go undetected without a means of detecting these events. Administrators are alerted to these events when they occur, minimizing potential user or agency impact.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.4.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.4.1v1."
  },
  {
    "id": "MS.DEFENDER.5.2v1",
    "product": "DEFENDER",
    "section": "Alerts",
    "sectionNumber": 5,
    "title": "The alerts SHOULD be sent to a monitored address or incorporated into a Security Information and Event Management (SIEM).",
    "criticality": "SHOULD",
    "rationale": "Suspicious or malicious events, if not resolved promptly, may have a greater impact to users and the agency. Sending alerts to a monitored email address or SIEM system helps ensure events are acted upon in a timely manner to limit overall impact.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.4.2v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.4.2v1."
  },
  {
    "id": "MS.DEFENDER.6.1v1",
    "product": "DEFENDER",
    "section": "Audit Logging",
    "sectionNumber": 6,
    "title": "Unified Audit logging SHALL be enabled.",
    "criticality": "SHALL",
    "rationale": "Responding to incidents without detailed information about activities that took place slows response actions. Enabling Unified Audit logging helps ensure agencies have visibility into user actions. Furthermore, enabling the Unified Audit log is required for government agencies by OMB M-21-31.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.5.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.5.1v1."
  },
  {
    "id": "MS.DEFENDER.6.2v1",
    "product": "DEFENDER",
    "section": "Audit Logging",
    "sectionNumber": 6,
    "title": "Microsoft Purview Audit (Premium) logging SHALL be enabled for ALL users.",
    "criticality": "SHALL",
    "rationale": "Standard logging may not include relevant details necessary for visibility into user actions during an incident. Enabling Microsoft Purview Audit (Premium) captures additional event types not included with Standard. Furthermore, it is required for government agencies by OMB M-21-31 (referred to therein as by its former name, Unified Audit Logs w/Advanced Features).",
    "lastVersion": "1.5.0",
    "removedIn": "1.6.0",
    "replacedBy": [],
    "removalRationale": "MS.DEFENDER.6.2v1 was originally included in order to enable auditing of additional user actions not captured under Purview Audit (Standard). In October 2023, Microsoft announced changes to its Purview Audit service that included making audit events in Purview Audit (Premium) available to Purview Audit (Standard) subscribers. Now that the rollout of changes is completed, Purview (Standard) includes the necessary auditing that is addressed by MS.DEFENDER.6.1v1."
  },
  {
    "id": "MS.DEFENDER.6.3v1",
    "product": "DEFENDER",
    "section": "Audit Logging",
    "sectionNumber": 6,
    "title": "Audit logs SHALL be maintained for at least the minimum duration dictated by OMB M-21-31.",
    "criticality": "SHALL",
    "rationale": "Audit logs may no longer be available when needed if they are not retained for a sufficient time. Increased log retention time gives an agency the necessary visibility to investigate incidents that occurred some time ago.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.5.2v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.5.2v1."
  },
  {
    "id": "MS.EXO.8.1v2",
    "product": "EXO",
    "section": "Data Loss Prevention Solutions",
    "sectionNumber": 8,
    "title": "A DLP solution SHALL be used.",
    "criticality": "SHALL",
    "rationale": "Users may inadvertently disclose sensitive information to unauthorized individuals. A DLP solution may detect the presence of sensitive information in Exchange Online and block access to unauthorized entities.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.3.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.1v1."
  },
  {
    "id": "MS.EXO.8.2v2",
    "product": "EXO",
    "section": "Data Loss Prevention Solutions",
    "sectionNumber": 8,
    "title": "The DLP solution SHALL protect personally identifiable information (PII) and sensitive information, as defined by the agency.",
    "criticality": "SHALL",
    "rationale": "Users may inadvertently share sensitive information with others who should not have access to it. Data loss prevention (DLP) policies provide a way for agencies to detect and prevent unauthorized disclosures.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.3.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.1v1."
  },
  {
    "id": "MS.EXO.8.3v1",
    "product": "EXO",
    "section": "Data Loss Prevention Solutions",
    "sectionNumber": 8,
    "title": "The selected DLP solution SHOULD offer services comparable to the native DLP solution offered by Microsoft.",
    "criticality": "SHOULD",
    "rationale": "Any alternative DLP solution should be able to detect sensitive information in Exchange Online and block access to unauthorized entities.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [],
    "removalRationale": "Removed \"comparable to solution offered by Microsoft policies\""
  },
  {
    "id": "MS.EXO.8.4v1",
    "product": "EXO",
    "section": "Data Loss Prevention Solutions",
    "sectionNumber": 8,
    "title": "At a minimum, the DLP solution SHALL restrict sharing credit card numbers, U.S. Individual Taxpayer Identification Numbers (ITIN), and U.S. Social Security numbers (SSN) via email.",
    "criticality": "SHALL",
    "rationale": "Users may inadvertently share sensitive information with others who should not have access to it. Data loss prevention (DLP) policies provide a way for agencies to detect and prevent unauthorized disclosures.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.3.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.1v1."
  },
  {
    "id": "MS.EXO.9.1v2",
    "product": "EXO",
    "section": "Attachment File Type",
    "sectionNumber": 9,
    "title": "Emails SHALL be filtered by attachment file types.",
    "criticality": "SHALL",
    "rationale": "Malicious attachments often take the form of click-to-run files. Sharing high risk file types, when necessary, is better left to a means other than email; the dangers of allowing them to be sent over email outweigh any potential benefits. Filtering email attachments based on file types can prevent spread of malware distributed via click-to-run email attachments.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.1.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.1v1."
  },
  {
    "id": "MS.EXO.9.2v1",
    "product": "EXO",
    "section": "Attachment File Type",
    "sectionNumber": 9,
    "title": "The attachment filter SHOULD attempt to determine the true file type and assess the file extension.",
    "criticality": "SHOULD",
    "rationale": "Users can change a file extension at the end of a file name (e.g., notepad.exe to notepad.txt) to obscure the actual file type. Verifying the file type and checking that this matches the designated file extension can help detect instances where the file extension was changed.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [],
    "removalRationale": "Removed the policy because it could not be configured via Defender and assessed by ScubaGear."
  },
  {
    "id": "MS.EXO.9.3v2",
    "product": "EXO",
    "section": "Attachment File Type",
    "sectionNumber": 9,
    "title": "Disallowed file types SHALL be determined and enforced.",
    "criticality": "SHALL",
    "rationale": "Malicious attachments often take the form of click-to-run files, though other file types can contain malicious content as well. As such, determining the full list of file types to block is left to each organization, to be made in accordance with their risk tolerance.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.1.1v1"
    ],
    "removalRationale": ""
  },
  {
    "id": "MS.EXO.9.4v1",
    "product": "EXO",
    "section": "Attachment File Type",
    "sectionNumber": 9,
    "title": "If a third-party filtering solution is used, it SHOULD offer services comparable to Microsoft Defender's Common Attachment Filter.",
    "criticality": "SHOULD",
    "rationale": "Malicious attachments often take the form of click-to-run files. Sharing high risk file types, when necessary, is better left to a means other than email; the dangers of allowing them to be sent over email outweigh any potential benefits. Filtering email attachments based on file types can prevent spread of malware distributed via click-to-run email attachments.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [],
    "removalRationale": "Removed \"comparable to solution offered by Microsoft policies\""
  },
  {
    "id": "MS.EXO.9.5v1",
    "product": "EXO",
    "section": "Attachment File Type",
    "sectionNumber": 9,
    "title": "At a minimum, click-to-run files SHOULD be blocked (e.g., .exe, .cmd, and .vbe).",
    "criticality": "SHOULD",
    "rationale": "Malicious attachments often take the form of click-to-run files. Blocking a list of common executable files helps mitigate the risk of adversarial exploitation.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.1.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.1v1."
  },
  {
    "id": "MS.EXO.10.1v1",
    "product": "EXO",
    "section": "Malware Scanning",
    "sectionNumber": 10,
    "title": "Emails SHALL be scanned for malware.",
    "criticality": "SHALL",
    "rationale": "Threat actors can use email as a mechanism for delivering malware. In many cases, scanning can detect malware, reducing the risk for end users.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.1.3v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.3v1."
  },
  {
    "id": "MS.EXO.10.2v1",
    "product": "EXO",
    "section": "Malware Scanning",
    "sectionNumber": 10,
    "title": "Emails identified as containing malware SHALL be quarantined or dropped.",
    "criticality": "SHALL",
    "rationale": "Email can be used as a mechanism for delivering malware. Preventing emails with known malware from reaching user mailboxes helps ensure users cannot interact with those emails.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.1.3v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.3v1."
  },
  {
    "id": "MS.EXO.10.3v1",
    "product": "EXO",
    "section": "Malware Scanning",
    "sectionNumber": 10,
    "title": "Email scanning SHALL be capable of reviewing emails after delivery.",
    "criticality": "SHALL",
    "rationale": "As known malware signatures are updated, it is possible for an email to be retroactively identified as containing malware after delivery. Scanning emails can reduce the number of malware-infected emails in users' mailboxes.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.1.2v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.2v1."
  },
  {
    "id": "MS.EXO.11.1v1",
    "product": "EXO",
    "section": "Phishing Protections",
    "sectionNumber": 11,
    "title": "Impersonation protection checks SHOULD be used.",
    "criticality": "SHOULD",
    "rationale": "Users might not be able to reliably identify phishing emails, especially if the FROM address is nearly indistinguishable from that of a known entity. By automatically identifying senders who appear to be impersonating known senders, the risk of a successful phishing attempt can be reduced.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.2.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.2.1v1."
  },
  {
    "id": "MS.EXO.11.2v1",
    "product": "EXO",
    "section": "Phishing Protections",
    "sectionNumber": 11,
    "title": "User warnings, comparable to the user safety tips included with EOP, SHOULD be displayed.",
    "criticality": "SHOULD",
    "rationale": "Many tasks are better suited for automated processes, such as identifying unusual characters in the FROM address or identifying a first-time sender. User warnings can handle these tasks, reducing the burden on end users and the risk of successful phishing attempts.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.2.4v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.2.4v1."
  },
  {
    "id": "MS.EXO.11.3v1",
    "product": "EXO",
    "section": "Phishing Protections",
    "sectionNumber": 11,
    "title": "The phishing protection solution SHOULD include an AI-based phishing detection tool comparable to EOP Mailbox Intelligence.",
    "criticality": "SHOULD",
    "rationale": "Phishing attacks can result in unauthorized data disclosure and unauthorized access. Using AI-based phishing detection tools to improve the detection rate of phishing attempts helps reduce the risk of successful phishing attacks.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [],
    "removalRationale": "Removed \"comparable to solution offered by Microsoft policies\""
  },
  {
    "id": "MS.EXO.12.1v1",
    "product": "EXO",
    "section": "IP Allow Lists",
    "sectionNumber": 12,
    "title": "IP allow lists SHOULD NOT be created.",
    "criticality": "SHOULD NOT",
    "rationale": "Messages sent from IP addresses on an allow list bypass important security mechanisms, including spam filtering and sender authentication checks. Avoiding use of IP allow lists prevents potential threats from circumventing security mechanisms.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.8.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.8.1v1"
  },
  {
    "id": "MS.EXO.12.2v1",
    "product": "EXO",
    "section": "IP Allow Lists",
    "sectionNumber": 12,
    "title": "Safe lists SHOULD NOT be enabled.",
    "criticality": "SHOULD NOT",
    "rationale": "Messages sent from allowed safe list addresses bypass important security mechanisms, including spam filtering and sender authentication checks. Avoiding use of safe lists prevents potential threats from circumventing security mechanisms. While blocking all malicious senders is not feasible, blocking specific known, malicious IP addresses may reduce the threat from specific senders.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.8.2v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.8.2v1"
  },
  {
    "id": "MS.EXO.14.1v2",
    "product": "EXO",
    "section": "Inbound Anti-Spam Protections",
    "sectionNumber": 14,
    "title": "A spam filter SHALL be enabled.",
    "criticality": "SHALL",
    "rationale": "Filtering out spam reduces user workload burden, prevents junk mail congestion, and reduces potentially malicious content exposure.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.6.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.6.1v1."
  },
  {
    "id": "MS.EXO.14.2v1",
    "product": "EXO",
    "section": "Inbound Anti-Spam Protections",
    "sectionNumber": 14,
    "title": "Spam and high confidence spam SHALL be moved to either the junk email folder or the quarantine folder.",
    "criticality": "SHALL",
    "rationale": "Moving spam messages to a separate junk or quarantine folder helps users filter out spam while still giving them the ability to review messages, as needed, in case a message is filtered incorrectly.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.6.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.6.1v1."
  },
  {
    "id": "MS.EXO.14.3v1",
    "product": "EXO",
    "section": "Inbound Anti-Spam Protections",
    "sectionNumber": 14,
    "title": "Allowed domains SHALL NOT be added to inbound anti-spam protection policies.",
    "criticality": "SHALL NOT",
    "rationale": "Legitimate emails may be incorrectly filtered by spam protections. Adding allowed senders is an acceptable method of combating these false positives. However, allowing an entire domain, especially a common domain like office.com, provides for a large number of potentially unknown users to bypass spam protections.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.6.2v1"
    ],
    "removalRationale": ""
  },
  {
    "id": "MS.EXO.14.4v1",
    "product": "EXO",
    "section": "Inbound Anti-Spam Protections",
    "sectionNumber": 14,
    "title": "If a third-party party filtering solution is used, the solution SHOULD offer services comparable to the native spam filtering offered by Microsoft.",
    "criticality": "SHOULD",
    "rationale": "Filtering out spam reduces user workload burden, prevents junk mail congestion, and reduces potentially malicious content exposure.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [],
    "removalRationale": ""
  },
  {
    "id": "MS.EXO.15.1v1",
    "product": "EXO",
    "section": "Link Protection",
    "sectionNumber": 15,
    "title": "URL comparison with a block-list SHOULD be enabled.",
    "criticality": "SHOULD",
    "rationale": "Users may be directed to malicious websites via links in email. Blocking access to known, malicious URLs can prevent users from accessing known malicious websites.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.7.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.7.1v1."
  },
  {
    "id": "MS.EXO.15.2v1",
    "product": "EXO",
    "section": "Link Protection",
    "sectionNumber": 15,
    "title": "Direct download links SHOULD be scanned for malware.",
    "criticality": "SHOULD",
    "rationale": "URLs in emails may direct users to download and run malware. Scanning direct download links in real-time for known malware and blocking access can prevent users from infecting their devices.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.7.2v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.7.2v1."
  },
  {
    "id": "MS.EXO.15.3v1",
    "product": "EXO",
    "section": "Link Protection",
    "sectionNumber": 15,
    "title": "User click tracking SHOULD be enabled.",
    "criticality": "SHOULD",
    "rationale": "Users may click on malicious links in emails, leading to compromise or unauthorized data disclosure. Enabling user click tracking lets agencies know if a malicious link may have been visited after the fact to help tailor a response to a potential incident.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.7.3v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.7.3v1."
  },
  {
    "id": "MS.EXO.16.1v1",
    "product": "EXO",
    "section": "Alerts",
    "sectionNumber": 16,
    "title": "At a minimum, the following alerts SHALL be enabled: a. Suspicious email sending patterns detected. b. Suspicious Connector Activity. c. Suspicious Email Forwarding Activity. d. Messages have been delayed. e. Tenant restricted from sending unprovisioned email. f. Tenant restricted from sending email. g. A potentially malicious URL click was detected.",
    "criticality": "SHALL",
    "rationale": "Potentially malicious or service impacting events may go undetected without a means of detecting these events. Setting up a mechanism to alert administrators to events listed above draws attention to them to help minimize impact to users and the agency.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.4.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.4.1v1."
  },
  {
    "id": "MS.EXO.16.2v1",
    "product": "EXO",
    "section": "Alerts",
    "sectionNumber": 16,
    "title": "The alerts SHOULD be sent to a monitored address or incorporated into a security information and event management (SIEM) system.",
    "criticality": "SHOULD",
    "rationale": "Suspicious or malicious events, if not resolved promptly, may have a greater impact to users and the agency. Sending alerts to a monitored email address or SIEM system helps ensure these suspicious or malicious events are acted upon in a timely manner to limit overall impact.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.4.2v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.4.2v1."
  },
  {
    "id": "MS.EXO.17.1v1",
    "product": "EXO",
    "section": "Audit Logging",
    "sectionNumber": 17,
    "title": "Unified Audit logging SHALL be enabled.",
    "criticality": "SHALL",
    "rationale": "Responding to incidents without detailed information about activities that took place slows response actions. Enabling Unified Audit logging helps ensure agencies have visibility into user actions. Furthermore, enabling the Unified Audit log is required for government agencies by OMB M-21-31.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.5.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.5.1v1."
  },
  {
    "id": "MS.EXO.17.2v1",
    "product": "EXO",
    "section": "Audit Logging",
    "sectionNumber": 17,
    "title": "Microsoft Purview Audit (Premium) logging SHALL be enabled.",
    "criticality": "SHALL",
    "rationale": "Standard logging may not include relevant details necessary for visibility into user actions during an incident. Enabling Microsoft Purview Audit (Premium) captures additional event types not included with Standard. Furthermore, it is required for government agencies by OMB M-21-31 (referred to therein by its former name, Unified Audit Logs w/Advanced Features).",
    "lastVersion": "1.5.0",
    "removedIn": "1.6.0",
    "replacedBy": [],
    "removalRationale": "MS.EXO.17.2v1 was originally included in order to enable auditing of additional user actions not captured under Purview Audit (Standard). In October 2023, Microsoft announced changes to its Purview Audit service that included making audit events in Purview Audit (Premium) available to Purview Audit (Standard) subscribers. Now that the rollout of changes has been completed, Purview (Standard) includes the necessary auditing which is addressed by MS.EXO.17.2v1"
  },
  {
    "id": "MS.EXO.17.3v1",
    "product": "EXO",
    "section": "Audit Logging",
    "sectionNumber": 17,
    "title": "Audit logs SHALL be maintained for at least the minimum duration dictated by OMB M-21-31 (Appendix C).",
    "criticality": "SHALL",
    "rationale": "Increased log retention time gives an agency the necessary visibility to investigate incidents that occurred some time ago. OMB M-21-13, Appendix C, Table 5 specifically calls out Unified Audit Logs in the Cloud Azure log category.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.5.2v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.5.2v1."
  },
  {
    "id": "MS.SHAREPOINT.1.4v1",
    "product": "SHAREPOINT",
    "section": "External Sharing",
    "sectionNumber": 1,
    "title": "Guest access SHALL be limited to the email the invitation was sent to.",
    "criticality": "SHALL",
    "rationale": "Email invitations allow external guests to access shared information. By requiring guests to sign in using the same account where the invite was sent, administrators help ensure only the intended guest can use the invite.",
    "lastVersion": "1.5.0",
    "removedIn": "1.6.0",
    "replacedBy": [],
    "removalRationale": "The option to limit guest access to the email the invitation was sent to found in policy MS.SHAREPOINT.1.4v1 has been deprecated by Microsoft. All references, including the policy and its implementation steps, have been removed since the setting is no longer present."
  },
  {
    "id": "MS.TEAMS.3.1v1",
    "product": "TEAMS",
    "section": "Skype Users",
    "sectionNumber": 3,
    "title": "Contact with Skype users SHALL be blocked.",
    "criticality": "SHALL",
    "rationale": "Microsoft is officially retiring all forms of Skype as listed above. Allowing contact with Skype users puts agency users at additional security risk. By blocking contact with Skype users an agency limits access to security threats utilizing the vulnerabilities of the Skype product.",
    "lastVersion": "1.6.0",
    "removedIn": "1.7.0",
    "replacedBy": [],
    "removalRationale": "The option to restrict contact with Skype users found in policy MS.TEAMS.3.1v1 has been deprecated by Microsoft. All references, including the policy and its implementation steps, have been removed since the setting is no longer present."
  },
  {
    "id": "MS.TEAMS.6.1v1",
    "product": "TEAMS",
    "section": "Data Loss Prevention",
    "sectionNumber": 6,
    "title": "A DLP solution SHALL be enabled and SHOULD offer services comparable to the native DLP solution offered by Microsoft.",
    "criticality": "SHALL",
    "rationale": "Teams users may inadvertently disclose sensitive information to unauthorized individuals. DLP policies provide a way for agencies to detect and prevent unauthorized disclosures.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.3.2v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.2v1."
  },
  {
    "id": "MS.TEAMS.6.2v1",
    "product": "TEAMS",
    "section": "Data Loss Prevention",
    "sectionNumber": 6,
    "title": "The DLP solution SHALL protect personally identifiable information (PII) and sensitive information, as defined by the agency. At a minimum, sharing credit card numbers, taxpayer identification numbers (TINs), and Social Security numbers (SSNs) via email SHALL be restricted.",
    "criticality": "SHALL",
    "rationale": "Teams users may inadvertently share sensitive information with others who should not have access to it. DLP policies provide a way for agencies to detect and prevent unauthorized sharing of sensitive information.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.3.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.1v1."
  },
  {
    "id": "MS.TEAMS.7.1v1",
    "product": "TEAMS",
    "section": "Malware Scanning",
    "sectionNumber": 7,
    "title": "Attachments included with Teams messages SHOULD be scanned for malware.",
    "criticality": "SHOULD",
    "rationale": "Teams can be used as a mechanism for delivering malware. In many cases, malware can be detected through scanning, reducing the risk for end users.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.1.4v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.4v1."
  },
  {
    "id": "MS.TEAMS.7.2v1",
    "product": "TEAMS",
    "section": "Malware Scanning",
    "sectionNumber": 7,
    "title": "Users SHOULD be prevented from opening or downloading files detected as malware.",
    "criticality": "SHOULD",
    "rationale": "Teams can be used as a mechanism for delivering malware. In many cases, malware can be detected through scanning, reducing the risk for end users.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.1.4v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.4v1."
  },
  {
    "id": "MS.TEAMS.8.1v1",
    "product": "TEAMS",
    "section": "Link Protection",
    "sectionNumber": 8,
    "title": "URL comparison with a blocklist SHOULD be enabled.",
    "criticality": "SHOULD",
    "rationale": "Users may be directed to malicious websites via links in Teams. Blocking access to known malicious URLs can help prevent users from accessing known malicious websites.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.7.1v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.7.1v1."
  },
  {
    "id": "MS.TEAMS.8.2v1",
    "product": "TEAMS",
    "section": "Link Protection",
    "sectionNumber": 8,
    "title": "User click tracking SHOULD be enabled.",
    "criticality": "SHOULD",
    "rationale": "Users may click on malicious links in Teams, leading to compromise or authorized data disclosure. Enabling user click tracking lets agencies know if a malicious link may have been visited after the fact to help tailor a response to a potential incident.",
    "lastVersion": "1.8.0",
    "removedIn": "2.0.0",
    "replacedBy": [
      "MS.SECURITYSUITE.7.3v1"
    ],
    "removalRationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.7.3v1."
  }
];

export const REMOVED_POLICIES: RemovedPolicy[] = [
  {
    "id": "MS.AAD.5.4v1",
    "product": "AAD",
    "removalDate": "March 2025",
    "rationale": "Microsoft announced via MC712143 that it will no longer be possible for group owners to consent to applications. All references including the policy, implementation steps, and section have been removed as the setting is no longer present."
  },
  {
    "id": "MS.DEFENDER.1.1v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy group 1 (MS.SECURITYSUITE.1.1v1 - MS.SECURITYSUITE.1.4v1)."
  },
  {
    "id": "MS.DEFENDER.1.2v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy group 1 (MS.SECURITYSUITE.1.1v1 - MS.SECURITYSUITE.1.4v1)."
  },
  {
    "id": "MS.DEFENDER.1.3v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy group 1 (MS.SECURITYSUITE.1.1v1 - MS.SECURITYSUITE.1.4v1)."
  },
  {
    "id": "MS.DEFENDER.1.4v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy group 1 (MS.SECURITYSUITE.1.1v1 - MS.SECURITYSUITE.1.4v1)."
  },
  {
    "id": "MS.DEFENDER.1.5v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy group 1 (MS.SECURITYSUITE.1.1v1 - MS.SECURITYSUITE.1.4v1)."
  },
  {
    "id": "MS.DEFENDER.2.1v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.2.1v1."
  },
  {
    "id": "MS.DEFENDER.2.2v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.2.2v1."
  },
  {
    "id": "MS.DEFENDER.2.3v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.2.3v1."
  },
  {
    "id": "MS.DEFENDER.3.1v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.4v1."
  },
  {
    "id": "MS.DEFENDER.4.1v2",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.1v1."
  },
  {
    "id": "MS.DEFENDER.4.2v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.2v1."
  },
  {
    "id": "MS.DEFENDER.4.3v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.3v1."
  },
  {
    "id": "MS.DEFENDER.4.4v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.4v1."
  },
  {
    "id": "MS.DEFENDER.4.5v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Removed the policy because it could not be automatically evaluated by the ScubaGear tool. It defined a best practice requiring agencies to create a list of applications restricted from accessing files protected by the DLP policy, but this is open to interpretation and varies by agency, making it difficult for the SCuBA team to enforce."
  },
  {
    "id": "MS.DEFENDER.4.6v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.5v1."
  },
  {
    "id": "MS.DEFENDER.5.1v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.4.1v1."
  },
  {
    "id": "MS.DEFENDER.5.2v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.4.2v1."
  },
  {
    "id": "MS.DEFENDER.6.1v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.5.1v1."
  },
  {
    "id": "MS.DEFENDER.6.2v1",
    "product": "DEFENDER",
    "removalDate": "March 2025",
    "rationale": "MS.DEFENDER.6.2v1 was originally included in order to enable auditing of additional user actions not captured under Purview Audit (Standard). In October 2023, Microsoft announced changes to its Purview Audit service that included making audit events in Purview Audit (Premium) available to Purview Audit (Standard) subscribers. Now that the rollout of changes is completed, Purview (Standard) includes the necessary auditing that is addressed by MS.DEFENDER.6.1v1."
  },
  {
    "id": "MS.DEFENDER.6.3v1",
    "product": "DEFENDER",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.5.2v1."
  },
  {
    "id": "MS.EXO.2.1v1",
    "product": "EXO",
    "removalDate": "May 2024",
    "rationale": "MS.EXO.2.1v1 is not a security configuration that can be audited and acts as a step in implementation of policy MS.EXO.2.2. Having the list of approved IPs will be added as a part of implementation of policy MS.EXO.2.2 and removed as a policy in the baseline."
  },
  {
    "id": "MS.EXO.8.1v2",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.1v1."
  },
  {
    "id": "MS.EXO.8.2v2",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.1v1."
  },
  {
    "id": "MS.EXO.8.3v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Removed \"offer services comparable solution offered by Microsoft\" policies in Security Suite Baseline consolidation efforts."
  },
  {
    "id": "MS.EXO.8.4v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.1v1."
  },
  {
    "id": "MS.EXO.9.1v2",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.1v1."
  },
  {
    "id": "MS.EXO.9.2v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Removed the policy because it could not be configured via Microsoft Defender and assessed by ScubaGear."
  },
  {
    "id": "MS.EXO.9.3v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.1v1."
  },
  {
    "id": "MS.EXO.9.4v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Removed \"offer services comparable solution offered by Microsoft\" policies in Security Suite Baseline consolidation efforts."
  },
  {
    "id": "MS.EXO.9.5v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.1v1."
  },
  {
    "id": "MS.EXO.10.1v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.3v1."
  },
  {
    "id": "MS.EXO.10.2v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.3v1."
  },
  {
    "id": "MS.EXO.10.3v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.2v1."
  },
  {
    "id": "MS.EXO.11.1v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.2.1v1."
  },
  {
    "id": "MS.EXO.11.2v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.2.4v1."
  },
  {
    "id": "MS.EXO.11.3v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Removed \"offer services comparable solution offered by Microsoft\" policies in Security Suite Baseline consolidation efforts."
  },
  {
    "id": "MS.EXO.12.1v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.8.1v1"
  },
  {
    "id": "MS.EXO.12.2v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.8.2v1"
  },
  {
    "id": "MS.EXO.14.1v2",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.6.1v1."
  },
  {
    "id": "MS.EXO.14.2v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.6.1v1."
  },
  {
    "id": "MS.EXO.14.3v2",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.6.2v1."
  },
  {
    "id": "MS.EXO.15.1v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.7.1v1."
  },
  {
    "id": "MS.EXO.15.2v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.7.2v1."
  },
  {
    "id": "MS.EXO.15.3v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.7.3v1."
  },
  {
    "id": "MS.EXO.16.1v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.4.1v1."
  },
  {
    "id": "MS.EXO.16.2v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.4.2v1."
  },
  {
    "id": "MS.EXO.17.1v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.5.1v1."
  },
  {
    "id": "MS.EXO.17.2v1",
    "product": "EXO",
    "removalDate": "March 2025",
    "rationale": "MS.EXO.17.2v1 was originally included in order to enable auditing of additional user actions not captured under Purview Audit (Standard). In October 2023, Microsoft announced changes to its Purview Audit service that included making audit events in Purview Audit (Premium) available to Purview Audit (Standard) subscribers. Now that the rollout of changes has been completed, Purview (Standard) includes the necessary auditing which is addressed by MS.EXO.17.2v1"
  },
  {
    "id": "MS.EXO.17.3v1",
    "product": "EXO",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.5.2v1."
  },
  {
    "id": "MS.SHAREPOINT.1.4v1",
    "product": "SHAREPOINT",
    "removalDate": "February 2025",
    "rationale": "The option to limit guest access to the email the invitation was sent to found in policy MS.SHAREPOINT.1.4v1 has been deprecated by Microsoft. All references, including the policy and its implementation steps, have been removed since the setting is no longer present."
  },
  {
    "id": "MS.SHAREPOINT.4.1v1",
    "product": "SHAREPOINT",
    "removalDate": "July 2024",
    "rationale": "The option to enable and disable custom scripting on personal sites (aka OneDrive) found in policy MS.SHAREPOINT.4.1v1 has been deprecated by Microsoft. All references including the policy and its implementation steps have been removed as the setting is no longer present. Furthermore, it is no longer possible to allow custom scripts on personal sites."
  },
  {
    "id": "MS.SHAREPOINT.4.2v1",
    "product": "SHAREPOINT",
    "removalDate": "November 2024",
    "rationale": "Microsoft has noted that after November 2024 it will no longer be possible to prevent SharePoint in resetting custom script settings to its original value (disabled) for all sites. All references including the policy, implementation steps, and section, by direction of CISA and Microsoft, have been removed as the setting will be automatically reverted back to Blocked within 24 hours."
  },
  {
    "id": "MS.TEAMS.3.1v1",
    "product": "TEAMS",
    "removalDate": "August 2025",
    "rationale": "The option to restrict contact with Skype users found in policy MS.TEAMS.3.1v1 has been deprecated by Microsoft. All references, including the policy and its implementation steps, have been removed since the setting is no longer present."
  },
  {
    "id": "MS.TEAMS.6.1v1",
    "product": "TEAMS",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.2v1."
  },
  {
    "id": "MS.TEAMS.6.2v1",
    "product": "TEAMS",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.3.1v1."
  },
  {
    "id": "MS.TEAMS.7.1v1",
    "product": "TEAMS",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.4v1."
  },
  {
    "id": "MS.TEAMS.7.2v1",
    "product": "TEAMS",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.1.4v1."
  },
  {
    "id": "MS.TEAMS.8.1v1",
    "product": "TEAMS",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.7.1v1."
  },
  {
    "id": "MS.TEAMS.8.2v1",
    "product": "TEAMS",
    "removalDate": "April 2026",
    "rationale": "Reworked into the new security suite baseline policy MS.SECURITYSUITE.7.3v1."
  }
];
