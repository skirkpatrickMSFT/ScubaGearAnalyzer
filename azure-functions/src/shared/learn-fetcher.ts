/**
 * Microsoft Learn Content Fetcher
 *
 * Searches Microsoft Learn and fetches article content to provide
 * supplementary implementation guidance for ScubaGear baseline controls.
 */

// ── Types ──────────────────────────────────────────────────

export interface LearnSearchResult {
  title: string;
  url: string;
  description: string;
  lastUpdated?: string;
}

export interface LearnArticle {
  title: string;
  url: string;
  content: string;
  lastUpdated?: string;
}

import { BASELINE_CHANGES } from './baseline-changes.generated.js';
import { getControlById } from './baseline-data.js';

// ── Control-to-Learn URL mapping ───────────────────────────
// Maps each ScubaGear control to its most relevant Learn documentation

export const CONTROL_LEARN_URLS: Record<string, string[]> = {
  "MS.AAD.1.1v1": [
    "https://learn.microsoft.com/en-us/entra/identity/conditional-access/howto-conditional-access-policy-block-legacy",
    "https://learn.microsoft.com/en-us/azure/security/fundamentals/steps-secure-identity",
    "https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-conditional-access-conditions",
  ],
  "MS.AAD.2.1v1": [
    "https://learn.microsoft.com/en-us/entra/id-protection/concept-identity-protection-risks",
    "https://learn.microsoft.com/en-us/entra/id-protection/howto-identity-protection-configure-risk-policies",
  ],
  "MS.AAD.2.2v1": [
    "https://learn.microsoft.com/en-us/entra/id-protection/howto-identity-protection-configure-notifications",
  ],
  "MS.AAD.2.3v1": [
    "https://learn.microsoft.com/en-us/entra/id-protection/concept-identity-protection-risks",
    "https://learn.microsoft.com/en-us/entra/id-protection/howto-identity-protection-configure-risk-policies",
  ],
  "MS.AAD.3.1v1": [
    "https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-methods",
    "https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-enable-passkey-fido2",
    "https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-strengths",
  ],
  "MS.AAD.3.2v1": [
    "https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-methods",
    "https://learn.microsoft.com/en-us/entra/identity/authentication/concept-mfa-howitworks",
  ],
  "MS.AAD.3.3v2": [
    "https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-mfa-additional-context",
  ],
  "MS.AAD.3.4v1": [
    "https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-authentication-methods-manage",
  ],
  "MS.AAD.3.5v1": [
    "https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-methods",
    "https://learn.microsoft.com/en-us/entra/identity/authentication/howto-authentication-sms-signin",
  ],
  "MS.AAD.3.6v1": [
    "https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-strengths",
    "https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-enable-passkey-fido2",
  ],
  "MS.AAD.3.7v1": [
    "https://learn.microsoft.com/en-us/entra/identity/devices/concept-directory-join",
    "https://learn.microsoft.com/en-us/entra/identity/devices/how-to-hybrid-join",
  ],
  "MS.AAD.3.8v1": [
    "https://learn.microsoft.com/en-us/mem/intune/enrollment/windows-enroll",
    "https://learn.microsoft.com/en-us/entra/identity/conditional-access/howto-conditional-access-policy-registration",
  ],
  "MS.AAD.3.9v1": [
    "https://learn.microsoft.com/en-us/entra/identity/conditional-access/managed-policies",
    "https://learn.microsoft.com/en-us/entra/identity/conditional-access/concept-conditional-access-grant",
  ],
  "MS.AAD.4.1v1": [
    "https://learn.microsoft.com/en-us/entra/identity/monitoring-health/concept-sign-ins",
    "https://learn.microsoft.com/en-us/entra/identity/monitoring-health/howto-integrate-activity-logs-with-azure-monitor-logs",
  ],
  "MS.AAD.5.1v1": [
    "https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-user-consent",
    "https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/delegate-app-roles",
  ],
  "MS.AAD.5.2v1": [
    "https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-user-consent",
    "https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/manage-consent-requests",
  ],
  "MS.AAD.5.3v1": [
    "https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-admin-consent-workflow",
  ],
  "MS.AAD.6.1v1": [
    "https://learn.microsoft.com/en-us/entra/identity/authentication/concept-password-ban-bad",
    "https://learn.microsoft.com/en-us/microsoft-365/admin/misc/password-policy-recommendations",
  ],
  "MS.AAD.7.1v1": [
    "https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/permissions-reference",
    "https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/best-practices",
  ],
  "MS.AAD.7.2v1": [
    "https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/best-practices",
    "https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/concept-delegation",
  ],
  "MS.AAD.7.3v1": [
    "https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/security-planning",
    "https://learn.microsoft.com/en-us/entra/architecture/protect-m365-from-on-premises-attacks",
  ],
  "MS.AAD.7.4v1": [
    "https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure",
    "https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-how-to-add-role-to-user",
  ],
  "MS.AAD.7.5v1": [
    "https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure",
  ],
  "MS.AAD.7.6v1": [
    "https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-how-to-require-approval",
  ],
  "MS.AAD.7.7v1": [
    "https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-how-to-configure-security-alerts",
  ],
  "MS.AAD.7.8v1": [
    "https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-email-notifications",
  ],
  "MS.AAD.7.9v1": [
    "https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-email-notifications",
    "https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-how-to-configure-security-alerts",
  ],
  "MS.AAD.8.1v1": [
    "https://learn.microsoft.com/en-us/entra/external-id/what-is-b2b",
    "https://learn.microsoft.com/en-us/entra/identity/users/users-restrict-guest-permissions",
  ],
  "MS.AAD.8.2v1": [
    "https://learn.microsoft.com/en-us/entra/external-id/external-collaboration-settings-configure",
  ],
  "MS.AAD.8.3v1": [
    "https://learn.microsoft.com/en-us/entra/external-id/allow-deny-list",
  ],

  // ── Exchange Online (EXO) ──
  "MS.EXO.1.1v1": [
    "https://learn.microsoft.com/en-us/exchange/policy-and-compliance/mail-flow-rules/mail-flow-rule-procedures",
    "https://learn.microsoft.com/en-us/exchange/mail-flow-best-practices/remote-domains/remote-domains",
  ],
  "MS.EXO.2.1v1": [
    "https://learn.microsoft.com/en-us/exchange/sharing/organization-relationships/organization-relationships",
  ],
  "MS.EXO.2.2v1": [
    "https://learn.microsoft.com/en-us/exchange/sharing/sharing-policies/sharing-policies",
  ],
  "MS.EXO.3.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/email-authentication-dkim-configure",
  ],
  "MS.EXO.4.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/email-authentication-dmarc-configure",
  ],
  "MS.EXO.4.2v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/email-authentication-dmarc-configure",
  ],
  "MS.EXO.4.3v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/email-authentication-dmarc-configure",
  ],
  "MS.EXO.5.1v1": [
    "https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/authenticated-client-smtp-submission",
  ],
  "MS.EXO.6.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/email-authentication-spf-configure",
  ],
  "MS.EXO.6.2v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/email-authentication-spf-configure",
  ],
  "MS.EXO.7.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-protection-about",
  ],
  "MS.EXO.8.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-phishing-policies-about",
  ],
  "MS.EXO.8.2v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-phishing-policies-about",
  ],
  "MS.EXO.9.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/connection-filter-policies-configure",
  ],
  "MS.EXO.9.2v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/connection-filter-policies-configure",
  ],
  "MS.EXO.10.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-malware-policies-configure",
  ],
  "MS.EXO.10.2v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-malware-policies-configure",
  ],
  "MS.EXO.12.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/alert-policies-defender-portal",
  ],
  "MS.EXO.13.1v1": [
    "https://learn.microsoft.com/en-us/purview/audit-mailboxes",
  ],
  "MS.EXO.14.1v1": [
    "https://learn.microsoft.com/en-us/purview/audit-log-enable-disable",
  ],
  "MS.EXO.4.4v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/email-authentication-dmarc-configure",
  ],
  "MS.EXO.8.3v1": [
    "https://learn.microsoft.com/en-us/purview/dlp-learn-about-dlp",
  ],
  "MS.EXO.8.4v1": [
    "https://learn.microsoft.com/en-us/purview/dlp-learn-about-dlp",
  ],
  "MS.EXO.9.3v2": [
    "https://learn.microsoft.com/en-us/defender-office-365/anti-malware-protection-about",
  ],
  "MS.EXO.9.4v1": [
    "https://learn.microsoft.com/en-us/defender-office-365/anti-malware-protection-about",
  ],
  "MS.EXO.9.5v1": [
    "https://learn.microsoft.com/en-us/defender-office-365/anti-malware-protection-about",
  ],
  "MS.EXO.10.3v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-malware-policies-configure",
  ],
  "MS.EXO.11.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-phishing-policies-about",
  ],
  "MS.EXO.11.2v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-phishing-policies-about",
  ],
  "MS.EXO.11.3v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-phishing-policies-about",
  ],
  "MS.EXO.12.2v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/connection-filter-policies-configure",
  ],
  "MS.EXO.14.2v1": [
    "https://learn.microsoft.com/en-us/defender-office-365/anti-spam-policies-configure",
  ],
  "MS.EXO.14.3v1": [
    "https://learn.microsoft.com/en-us/defender-office-365/anti-spam-policies-configure",
  ],
  "MS.EXO.14.4v1": [
    "https://learn.microsoft.com/en-us/defender-office-365/anti-spam-policies-configure",
  ],
  "MS.EXO.15.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about",
  ],
  "MS.EXO.15.2v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about",
  ],
  "MS.EXO.15.3v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about",
  ],
  "MS.EXO.16.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/alert-policies-defender-portal",
  ],
  "MS.EXO.16.2v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/alert-policies-defender-portal",
  ],
  "MS.EXO.17.1v1": [
    "https://learn.microsoft.com/en-us/purview/audit-log-enable-disable",
  ],
  "MS.EXO.17.3v1": [
    "https://learn.microsoft.com/en-us/purview/audit-log-retention-policies",
    "https://learn.microsoft.com/en-us/purview/audit-log-export-records",
  ],

  // ── Microsoft Defender ──
  "MS.DEFENDER.1.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/preset-security-policies",
  ],
  "MS.DEFENDER.1.2v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/preset-security-policies",
  ],
  "MS.DEFENDER.1.3v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/preset-security-policies",
  ],
  "MS.DEFENDER.1.4v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/preset-security-policies",
  ],
  "MS.DEFENDER.1.5v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/preset-security-policies",
  ],
  "MS.DEFENDER.2.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about",
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-policies-configure",
  ],
  "MS.DEFENDER.2.2v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about",
  ],
  "MS.DEFENDER.2.3v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about",
  ],
  "MS.DEFENDER.3.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-attachments-about",
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-attachments-policies-configure",
  ],
  "MS.DEFENDER.3.2v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-attachments-for-spo-odfb-teams-about",
  ],
  "MS.DEFENDER.4.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-phishing-policies-about",
  ],
  "MS.DEFENDER.4.2v1": [
    "https://learn.microsoft.com/en-us/purview/dlp-create-deploy-policy",
    "https://learn.microsoft.com/en-us/purview/dlp-policy-reference",
  ],
  "MS.DEFENDER.4.3v1": [
    "https://learn.microsoft.com/en-us/purview/dlp-create-deploy-policy",
  ],
  "MS.DEFENDER.4.4v1": [
    "https://learn.microsoft.com/en-us/purview/dlp-policy-tips-reference",
  ],
  "MS.DEFENDER.4.5v1": [
    "https://learn.microsoft.com/en-us/purview/dlp-configure-endpoint-settings",
  ],
  "MS.DEFENDER.4.6v1": [
    "https://learn.microsoft.com/en-us/purview/dlp-configure-endpoint-settings",
    "https://learn.microsoft.com/en-us/purview/dlp-create-deploy-policy",
  ],
  "MS.DEFENDER.5.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-protection-about",
  ],
  "MS.DEFENDER.5.2v1": [
    "https://learn.microsoft.com/en-us/purview/alert-policies",
  ],
  "MS.DEFENDER.6.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/zero-hour-auto-purge",
  ],
  "MS.DEFENDER.6.3v1": [
    "https://learn.microsoft.com/en-us/purview/audit-log-retention-policies",
    "https://learn.microsoft.com/en-us/purview/audit-premium-setup",
  ],

  // ── Power Platform ──
  "MS.POWERPLATFORM.1.1v1": [
    "https://learn.microsoft.com/en-us/power-platform/admin/control-environment-creation",
  ],
  "MS.POWERPLATFORM.1.2v1": [
    "https://learn.microsoft.com/en-us/power-platform/admin/control-environment-creation",
  ],
  "MS.POWERPLATFORM.2.1v1": [
    "https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention",
  ],
  "MS.POWERPLATFORM.2.2v1": [
    "https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention",
  ],
  "MS.POWERPLATFORM.2.3v1": [
    "https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention",
  ],
  "MS.POWERPLATFORM.3.1v1": [
    "https://learn.microsoft.com/en-us/power-platform/admin/cross-tenant-restrictions",
  ],
  "MS.POWERPLATFORM.3.2v1": [
    "https://learn.microsoft.com/en-us/power-platform/admin/cross-tenant-restrictions",
  ],
  "MS.POWERPLATFORM.4.1v1": [
    "https://learn.microsoft.com/en-us/power-platform/admin/content-security-policy",
  ],
  "MS.POWERPLATFORM.5.1v1": [
    "https://learn.microsoft.com/en-us/power-pages/admin/admin-roles",
  ],
  "MS.POWERPLATFORM.6.1v1": [
    "https://learn.microsoft.com/en-us/power-platform/admin/settings-privacy-security",
  ],

  // ── SharePoint Online ──
  "MS.SHAREPOINT.1.1v1": [
    "https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off",
  ],
  "MS.SHAREPOINT.1.2v1": [
    "https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off",
  ],
  "MS.SHAREPOINT.1.3v1": [
    "https://learn.microsoft.com/en-us/sharepoint/change-external-sharing-site",
  ],
  "MS.SHAREPOINT.2.1v1": [
    "https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off",
  ],
  "MS.SHAREPOINT.2.2v1": [
    "https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off",
  ],
  "MS.SHAREPOINT.3.1v1": [
    "https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off",
  ],
  "MS.SHAREPOINT.3.2v1": [
    "https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off",
  ],
  "MS.SHAREPOINT.3.3v1": [
    "https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off",
  ],
  "MS.SHAREPOINT.4.1v1": [
    "https://learn.microsoft.com/en-us/sharepoint/allow-or-prevent-custom-script",
  ],

  // ── Microsoft Teams ──
  "MS.TEAMS.1.1v1": [
    "https://learn.microsoft.com/en-us/microsoftteams/manage-external-access",
  ],
  "MS.TEAMS.1.2v1": [
    "https://learn.microsoft.com/en-us/microsoftteams/manage-external-access",
  ],
  "MS.TEAMS.1.3v1": [
    "https://learn.microsoft.com/en-us/microsoftteams/manage-external-access",
  ],
  "MS.TEAMS.1.4v1": [
    "https://learn.microsoft.com/en-us/microsoftteams/meeting-settings-in-teams",
  ],
  "MS.TEAMS.1.5v1": [
    "https://learn.microsoft.com/en-us/microsoftteams/meeting-settings-in-teams",
  ],
  "MS.TEAMS.1.6v1": [
    "https://learn.microsoft.com/en-us/microsoftteams/meeting-settings-in-teams",
  ],
  "MS.TEAMS.1.7v2": [
    "https://learn.microsoft.com/en-us/microsoftteams/who-can-bypass-meeting-lobby",
  ],
  "MS.TEAMS.2.1v1": [
    "https://learn.microsoft.com/en-us/microsoftteams/guest-access",
  ],
  "MS.TEAMS.2.2v2": [
    "https://learn.microsoft.com/en-us/microsoftteams/manage-external-access",
  ],
  "MS.TEAMS.2.3v2": [
    "https://learn.microsoft.com/en-us/microsoftteams/manage-external-access",
  ],
  "MS.TEAMS.3.1v1": [
    "https://learn.microsoft.com/en-us/microsoftteams/meeting-settings-in-teams",
  ],
  "MS.TEAMS.3.2v1": [
    "https://learn.microsoft.com/en-us/microsoftteams/meeting-settings-in-teams",
  ],
  "MS.TEAMS.4.1v1": [
    "https://learn.microsoft.com/en-us/microsoftteams/messaging-policies-in-teams",
  ],
  "MS.TEAMS.5.1v1": [
    "https://learn.microsoft.com/en-us/microsoftteams/manage-apps",
  ],
  "MS.TEAMS.5.2v1": [
    "https://learn.microsoft.com/en-us/microsoftteams/manage-apps",
  ],
  "MS.TEAMS.5.3v2": [
    "https://learn.microsoft.com/en-us/microsoftteams/manage-apps",
  ],
  "MS.TEAMS.6.1v1": [
    "https://learn.microsoft.com/en-us/purview/dlp-microsoft-teams",
  ],
  "MS.TEAMS.6.2v1": [
    "https://learn.microsoft.com/en-us/purview/dlp-microsoft-teams",
  ],
  "MS.TEAMS.7.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-attachments-for-spo-odfb-teams-about",
  ],
  "MS.TEAMS.7.2v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-attachments-for-spo-odfb-teams-configure",
  ],
  "MS.TEAMS.8.1v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about",
  ],
  "MS.TEAMS.8.2v1": [
    "https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about",
  ],
};

// ── Topic search mappings ──────────────────────────────────
// Maps common topics to relevant Learn search queries

const TOPIC_SEARCH_QUERIES: Record<string, string> = {
  "conditional access": "conditional access policy entra",
  "legacy authentication": "block legacy authentication entra",
  "identity protection": "identity protection risk policies entra",
  "mfa": "multi-factor authentication entra methods",
  "phishing resistant": "phishing resistant mfa fido2 passkey entra",
  "authentication methods": "authentication methods policy entra",
  "privileged access": "privileged identity management pim entra",
  "global admin": "global administrator role best practices entra",
  "guest access": "guest user external collaboration entra",
  "app registration": "application registration consent entra",
  "password policy": "password policy protection entra",
  "audit logs": "sign-in audit logs monitoring entra",
  "security defaults": "security defaults entra conditional access",
  "zero trust": "zero trust identity entra",
  "device compliance": "device compliance conditional access intune",
};

// ── Content Fetching ───────────────────────────────────────

/**
 * Search Microsoft Learn for articles matching a query.
 * Uses the Microsoft Learn Search API.
 */
export async function searchLearn(
  query: string,
  top: number = 5,
  scope: string = "Entra"
): Promise<LearnSearchResult[]> {
  const searchQuery = scope ? `${query} ${scope}` : query;
  const url = new URL("https://learn.microsoft.com/api/search");
  url.searchParams.set("search", searchQuery);
  url.searchParams.set("locale", "en-us");
  url.searchParams.set("$top", String(top));
  url.searchParams.set("facet", "category");
  url.searchParams.set("expandScope", "true");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "EntraCL-MCP/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Learn API returned ${response.status}`);
    }

    const data = await response.json();
    const results: LearnSearchResult[] = [];

    if (data.results) {
      for (const result of data.results.slice(0, top)) {
        results.push({
          title: result.title || "Untitled",
          url: result.url || "",
          description: result.description || "",
          lastUpdated: result.lastUpdatedDate || undefined,
        });
      }
    }

    return results;
  } catch (error: any) {
    console.error("[LearnFetcher] Search error:", error.message);
    return [];
  }
}

/**
 * Fetch the content of a Microsoft Learn article.
 * Extracts the main article text, stripping HTML.
 */
export async function fetchArticle(url: string): Promise<LearnArticle | null> {
  try {
    // Normalize the URL
    const articleUrl = url.startsWith("http")
      ? url
      : `https://learn.microsoft.com${url}`;

    const response = await fetch(articleUrl, {
      headers: {
        Accept: "text/html",
        "User-Agent": "EntraCL-MCP/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch
      ? titleMatch[1].replace(/\s*\|.*$/, "").trim()
      : "Untitled";

    // Extract the main content area — target the article body, not the full page
    let content = "";

    // Try to extract just the article content, progressively narrowing
    let contentHtml = html;
    
    // Best: look for the actual article content div used by Microsoft Learn
    const articleBodyMatch = html.match(
      /<div[^>]*(?:class|id)="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/div>\s*)*<\/main>/i
    );
    const articleMatch = html.match(
      /<article[^>]*>([\s\S]*?)<\/article>/i
    );
    const mainMatch = html.match(
      /<main[^>]*>([\s\S]*?)<\/main>/i
    );
    
    if (articleMatch) {
      contentHtml = articleMatch[1];
    } else if (articleBodyMatch) {
      contentHtml = articleBodyMatch[1];
    } else if (mainMatch) {
      contentHtml = mainMatch[1];
    }

    // Strip HTML tags but preserve structure
    content = stripHtmlToMarkdown(contentHtml);

    // Trim to reasonable length (articles can be very long)
    const maxLength = 8000;
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + "\n\n...(article truncated)";
    }

    // Extract last updated date
    const dateMatch = html.match(
      /datetime="(\d{4}-\d{2}-\d{2})/
    );
    const lastUpdated = dateMatch ? dateMatch[1] : undefined;

    return {
      title,
      url: articleUrl,
      content,
      lastUpdated,
    };
  } catch (error: any) {
    console.error("[LearnFetcher] Fetch error:", error.message);
    return null;
  }
}

/**
 * Get Learn documentation URLs for a specific control.
 *
 * Resolution order: the curated map (exact, then ignoring the version suffix), docs
 * inherited from controls this one replaced in a newer baseline, then the Microsoft Learn
 * links listed in the control's own baseline Resources section.
 */
export function getLearnUrlsForControl(controlId: string): string[] {
  const lookup = (id: string): string[] => {
    if (CONTROL_LEARN_URLS[id]) return CONTROL_LEARN_URLS[id];
    const wanted = id.toLowerCase();
    const stem = wanted.replace(/v\d+$/, '');
    const key =
      Object.keys(CONTROL_LEARN_URLS).find((k) => k.toLowerCase() === wanted) ??
      Object.keys(CONTROL_LEARN_URLS).find((k) => k.toLowerCase().replace(/v\d+$/, '') === stem);
    return key ? CONTROL_LEARN_URLS[key] : [];
  };

  const direct = lookup(controlId);
  if (direct.length > 0) return direct;

  const inherited = new Set<string>();
  const stem = controlId.toLowerCase().replace(/v\d+$/, '');
  for (const change of BASELINE_CHANGES) {
    if (change.type !== 'added' || change.toId?.toLowerCase().replace(/v\d+$/, '') !== stem) continue;
    for (const oldId of change.replaces ?? []) for (const url of lookup(oldId)) inherited.add(url);
  }
  if (inherited.size > 0) return [...inherited];

  const control = getControlById(controlId);
  return (control?.resources ?? []).filter((u) => /^https:\/\/learn\.microsoft\.com\//i.test(u));
}

/**
 * Get the best search query for a topic
 */
export function getSearchQueryForTopic(topic: string): string {
  const lower = topic.toLowerCase();
  for (const [key, query] of Object.entries(TOPIC_SEARCH_QUERIES)) {
    if (lower.includes(key)) return query;
  }
  return `${topic} entra id`;
}

// ── HTML to Markdown helpers ───────────────────────────────

function stripHtmlToMarkdown(html: string): string {
  let text = html;

  // Remove script, style, and structural chrome tags entirely
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  text = text.replace(/<aside[\s\S]*?<\/aside>/gi, "");
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, "");
  text = text.replace(/<header[\s\S]*?<\/header>/gi, "");
  text = text.replace(/<button[\s\S]*?<\/button>/gi, "");
  text = text.replace(/<!--[\s\S]*?-->/g, "");

  // Remove Learn page UI elements by common patterns
  text = text.replace(/<div[^>]*class="[^"]*(?:action-bar|feedback|share-via|breadcrumb|table-of-contents|toc|metadata|consent|cookie|banner|skipnav|skip-nav|toolbar|alert)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  text = text.replace(/<div[^>]*id="[^"]*(?:action-bar|feedback|share|breadcrumb|toc|cookie|consent|banner|skip)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");

  // Convert headers
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n");
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n");
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n");
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n");

  // Convert lists
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n");
  text = text.replace(/<\/?[ou]l[^>]*>/gi, "\n");

  // Convert paragraphs and breaks
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<hr\s*\/?>/gi, "\n---\n");

  // Convert bold and italic
  text = text.replace(/<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>/gi, "**$1**");
  text = text.replace(/<(?:i|em)[^>]*>([\s\S]*?)<\/(?:i|em)>/gi, "*$1*");
  text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");

  // Convert links
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, " ");

  // Remove Learn UI chrome phrases that leak through
  const uiPhrases = [
    /Table of contents/g,
    /Exit editor mode/g,
    /Ask Learn/g,
    /Focus mode/g,
    /Read in English/g,
    /Share via/g,
    /Add to plan/g,
    /Add to collection/g,
    /Copy Markdown/g,
    /Summarize this article for me/g,
    /Access to this page requires authorization[^\n]*/g,
    /You can try \[signing in\][^\n]*/g,
    /You can try changing directories[^\n]*/g,
    /Edit\s*$/gm,
    /Print\s*$/gm,
    /Feedback\s*$/gm,
    /x\.com\s*$/gm,
    /Facebook\s*$/gm,
    /LinkedIn\s*$/gm,
    /Email\s*$/gm,
  ];
  for (const phrase of uiPhrases) {
    text = text.replace(phrase, "");
  }

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/[ \t]+/g, " ");
  text = text
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
  text = text.trim();

  return text;
}
