/**
 * CISA ScubaGear M365 Secure Configuration Baseline for Microsoft Entra ID
 * Structured baseline data extracted from the official AAD baseline document.
 *
 * Source: https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/aad.md
 */

export interface BaselineControl {
  id: string;
  section: string;
  sectionNumber: number;
  title: string;
  description: string;
  criticality: "SHALL" | "SHALL NOT" | "SHOULD" | "SHOULD NOT";
  rationale: string;
  lastModified: string;
  checkType: "Automated" | "Manual";
  configurable: boolean;
  bod2501: boolean;
  notes: string[];
  nistMapping: string[];
  mitreMapping: string[];
  resources: string[];
  implementation: string;
  licenseRequirements: string;
}

export const HIGHLY_PRIVILEGED_ROLES = [
  "Global Administrator",
  "Privileged Role Administrator",
  "User Administrator",
  "SharePoint Administrator",
  "Exchange Administrator",
  "Hybrid Identity Administrator",
  "Application Administrator",
  "Cloud Application Administrator",
];

export const AAD_SECTIONS: Record<number, string> = {
  1: "Legacy Authentication",
  2: "Risk Based Policies",
  3: "Strong Authentication and a Secure Registration Process",
  4: "Centralized Log Collection",
  5: "Application Registration and Consent",
  6: "Passwords",
  7: "Highly Privileged User Access",
  8: "Guest User Access",
};

export const AAD_BASELINE_CONTROLS: BaselineControl[] = [
  // ── Section 1: Legacy Authentication ──
  {
    id: "MS.AAD.1.1v1",
    section: "Legacy Authentication",
    sectionNumber: 1,
    title: "Legacy authentication SHALL be blocked",
    description:
      "Legacy authentication protocols do not support MFA. A conditional access policy must be configured to block legacy authentication clients including Exchange ActiveSync clients and Other clients.",
    criticality: "SHALL",
    rationale:
      "The security risk of allowing legacy authentication protocols is they do not support MFA. Blocking legacy protocols reduces the impact of user credential theft.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [],
    nistMapping: ["CM-7"],
    mitreMapping: [
      "T1110: Brute Force",
      "T1110.001: Password Guessing",
      "T1110.002: Password Cracking",
      "T1110.003: Password Spraying",
      "T1078: Valid Accounts",
      "T1078.004: Cloud Accounts",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/identity/conditional-access/howto-conditional-access-policy-block-legacy",
      "https://learn.microsoft.com/en-us/azure/security/fundamentals/steps-secure-identity",
    ],
    implementation: `1. Determine if an agency's existing applications use legacy authentication before blocking legacy authentication across the entire application base.
2. Create a Conditional Access policy to block legacy authentication:
   - Users > Include > All users
   - Target resources > Include > All resources (formerly 'All cloud apps')
   - Conditions > Client apps > Configure > Yes > Legacy authentication clients > Select only Exchange ActiveSync clients and Other clients
   - Access controls > Grant > Block Access`,
    licenseRequirements: "N/A",
  },

  // ── Section 2: Risk Based Policies ──
  {
    id: "MS.AAD.2.1v1",
    section: "Risk Based Policies",
    sectionNumber: 2,
    title: "Users detected as high risk SHALL be blocked",
    description:
      "Users identified as high risk by Microsoft Entra ID Identity Protection must be blocked from accessing the system via a conditional access policy. A high-risk user will be blocked until an administrator remediates their account.",
    criticality: "SHALL",
    rationale:
      "Blocking high-risk users may prevent compromised accounts from accessing the tenant.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [
      "Users identified as high risk by Microsoft Entra ID Identity Protection can be blocked from accessing the system via a Microsoft Entra ID Conditional Access policy. A high-risk user will be blocked until an administrator remediates their account.",
    ],
    nistMapping: ["AC-2(12)", "AC-2(13)"],
    mitreMapping: ["T1078: Valid Accounts", "T1078.004: Cloud Accounts"],
    resources: [
      "https://learn.microsoft.com/en-us/entra/id-protection/concept-identity-protection-risks",
      "https://learn.microsoft.com/en-us/entra/id-protection/howto-identity-protection-simulate-risk",
      "https://learn.microsoft.com/en-us/entra/id-protection/concept-identity-protection-user-experience",
    ],
    implementation: `1. Create a conditional access policy blocking users categorized as high risk by the Identity Protection service:
   - Users > Include > All users
   - Target resources > Include > All resources (formerly 'All cloud apps')
   - Conditions > User risk > High
   - Access controls > Grant > Block Access`,
    licenseRequirements: "Requires a Microsoft Entra ID P2 license",
  },
  {
    id: "MS.AAD.2.2v1",
    section: "Risk Based Policies",
    sectionNumber: 2,
    title:
      "A notification SHOULD be sent to the administrator when high-risk users are detected",
    description:
      "Configure Microsoft Entra ID Protection to send email notifications when user accounts are determined to be high risk.",
    criticality: "SHOULD",
    rationale:
      "Notification enables the admin to monitor the event and remediate the risk. This helps the organization proactively respond to cyber intrusions as they occur.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-2(12)"],
    mitreMapping: ["T1078: Valid Accounts", "T1078.004: Cloud Accounts"],
    resources: [
      "https://learn.microsoft.com/en-us/entra/id-protection/howto-identity-protection-configure-notifications#configure-users-at-risk-detected-alerts",
    ],
    implementation: `1. Configure Microsoft Entra ID Protection to send a regularly monitored security mailbox email notification when user accounts are determined to be high risk.`,
    licenseRequirements: "Requires a Microsoft Entra ID P2 license",
  },
  {
    id: "MS.AAD.2.3v1",
    section: "Risk Based Policies",
    sectionNumber: 2,
    title: "Sign-ins detected as high risk SHALL be blocked",
    description:
      "A conditional access policy must block sign-ins determined to be high risk by the Identity Protection service.",
    criticality: "SHALL",
    rationale:
      "This prevents compromised accounts from accessing the tenant.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [],
    nistMapping: ["AC-2(12)", "AC-2(13)"],
    mitreMapping: ["T1078: Valid Accounts", "T1078.004: Cloud Accounts"],
    resources: [
      "https://learn.microsoft.com/en-us/entra/id-protection/concept-identity-protection-risks",
    ],
    implementation: `1. Create a Conditional Access policy blocking sign-ins determined high risk by the Identity Protection service:
   - Users > Include > All users
   - Target resources > Include > All resources (formerly 'All cloud apps')
   - Conditions > Sign-in risk > High
   - Access controls > Grant > Block Access`,
    licenseRequirements: "Requires a Microsoft Entra ID P2 license",
  },

  // ── Section 3: Strong Authentication ──
  {
    id: "MS.AAD.3.1v1",
    section: "Strong Authentication and a Secure Registration Process",
    sectionNumber: 3,
    title: "Phishing-resistant MFA SHALL be enforced for all users",
    description:
      "Enforce phishing-resistant MFA for all users. The recommended methods are Microsoft Entra ID certificate-based authentication (CBA), FIDO2 Security Key, Windows Hello for Business, and device-bound passkeys.",
    criticality: "SHALL",
    rationale:
      "Weaker forms of MFA do not protect against sophisticated phishing attacks. By enforcing methods resistant to phishing, those risks are minimized.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [
      "If on-premises PIV authentication and federation to Microsoft Entra ID is used, enforce PIV logon via Microsoft Active Directory group policy.",
    ],
    nistMapping: ["IA-2(1)", "IA-2(2)", "IA-5c", "IA-5g", "IA-2(8)"],
    mitreMapping: [
      "T1566: Phishing",
      "T1566.001: Spearphishing Attachment",
      "T1566.002: Spearphishing Link",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-methods",
      "https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-enable-passkey-fido2",
    ],
    implementation: `1. Create a conditional access policy enforcing phishing-resistant MFA for all users:
   - Users > Include > All users
   - Target resources > Include > All resources (formerly 'All cloud apps')
   - Access controls > Grant > Grant Access > Require authentication strength > Phishing-resistant MFA`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.AAD.3.2v1",
    section: "Strong Authentication and a Secure Registration Process",
    sectionNumber: 3,
    title:
      "If phishing-resistant MFA has not been enforced, an alternative MFA method SHALL be enforced for all users",
    description:
      "A stopgap security policy requiring MFA enforcement if phishing-resistant MFA is not yet in place. This policy requires MFA enforcement without dictating the specific method.",
    criticality: "SHALL",
    rationale:
      "This is a stopgap security policy to help protect the tenant if phishing-resistant MFA has not been enforced. This policy requires MFA enforcement, thus reducing single-form authentication risk.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [
      "If a conditional access policy enforces phishing-resistant MFA, then this policy is not necessary. This policy does not dictate the specific MFA method.",
    ],
    nistMapping: ["IA-2(1)", "IA-2(2)"],
    mitreMapping: [
      "T1110: Brute Force",
      "T1110.001: Password Guessing",
      "T1110.002: Password Cracking",
      "T1110.003: Password Spraying",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-methods",
    ],
    implementation: `1. If phishing-resistant MFA has not been enforced for all users yet, create a conditional access policy that enforces MFA but does not dictate MFA method:
   - Users > Include > All users
   - Target resources > Include > All resources (formerly 'All cloud apps')
   - Access controls > Grant > Grant Access > Require multifactor authentication`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.AAD.3.3v2",
    section: "Strong Authentication and a Secure Registration Process",
    sectionNumber: 3,
    title:
      "If Microsoft Authenticator is enabled, it SHALL be configured to show login context information",
    description:
      "When Microsoft Authenticator is in use, configure it to display context information (application name and geographic location) to users during login.",
    criticality: "SHALL",
    rationale:
      "This policy helps protect the tenant when Microsoft Authenticator is used by showing user context information, which helps reduce MFA phishing compromises.",
    lastModified: "March 2025",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [],
    nistMapping: [
      "IA-2(1)",
      "IA-2(2)",
      "IA-5c",
      "IA-5g",
      "IA-2(8)",
      "IA-2(13)",
    ],
    mitreMapping: [
      "T1110: Brute Force",
      "T1110.001: Password Guessing",
      "T1110.002: Password Cracking",
      "T1110.003: Password Spraying",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-mfa-additional-context#enable-additional-context-in-the-portal",
    ],
    implementation: `1. In Microsoft Entra admin center, click Protection > Authentication methods > Microsoft Authenticator.
2. Click the Configure tab.
3. For Allow use of Microsoft Authenticator OTP select No.
4. Under Show application name in push and passwordless notifications select Status > Enabled and Target > Include > All users.
5. Under Show geographic location in push and passwordless notifications select Status > Enabled and Target > Include > All users.
6. Select Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.AAD.3.4v1",
    section: "Strong Authentication and a Secure Registration Process",
    sectionNumber: 3,
    title:
      "The Authentication Methods Manage Migration feature SHALL be set to Migration Complete",
    description:
      "The Manage Migration feature must be set to Migration Complete to disable the legacy authentication methods screen. MFA and SSPR authentication methods are then both managed from a central admin page.",
    criticality: "SHALL",
    rationale:
      "To disable the legacy authentication methods screen for the tenant, configure the Manage Migration feature to Migration Complete. The MFA and Self-Service Password Reset (SSPR) authentication methods are both managed from a central admin page, thereby reducing administrative complexity and potential security misconfigurations.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [],
    nistMapping: ["CM-7"],
    mitreMapping: [],
    resources: [
      "https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-authentication-methods-manage",
    ],
    implementation: `1. Go through the process of migrating MFA and SSPR policy settings to the Authentication methods policy.
2. Once ready to finish the migration, set the Manage Migration option to Migration Complete.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.AAD.3.5v1",
    section: "Strong Authentication and a Secure Registration Process",
    sectionNumber: 3,
    title:
      "The authentication methods SMS, Voice Call, and Email One-Time Passcode (OTP) SHALL be disabled",
    description:
      "SMS, voice call, and email OTP authentication methods must be disabled as they are the weakest authenticators.",
    criticality: "SHALL",
    rationale:
      "SMS, voice call, and email OTP are the weakest authenticators. This policy forces users to use stronger MFA methods.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [
      "This policy is only applicable if the tenant has their Manage Migration feature set to Migration Complete.",
    ],
    nistMapping: ["CM-7b", "IA-5c"],
    mitreMapping: [],
    resources: [
      "https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-methods",
    ],
    implementation: `1. In Microsoft Entra admin center, click Protection > Authentication methods.
2. Click on the SMS, Voice Call, and Email OTP authentication methods and disable each of them.
3. Their statuses should be Enabled > No on the Authentication methods > Policies page.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.AAD.3.6v1",
    section: "Strong Authentication and a Secure Registration Process",
    sectionNumber: 3,
    title:
      "Phishing-resistant MFA SHALL be required for highly privileged roles",
    description:
      "A backup security policy to protect privileged access. Must enforce phishing-resistant MFA for all highly privileged roles (Global Administrator, Privileged Role Administrator, User Administrator, SharePoint Administrator, Exchange Administrator, Hybrid Identity Administrator, Application Administrator, Cloud Application Administrator).",
    criticality: "SHALL",
    rationale:
      "This is a backup security policy to help protect privileged access to the tenant if the conditional access policy, which requires MFA for all users, is disabled or misconfigured.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [
      "Refer to the Highly Privileged Roles section for a reference list of roles considered highly privileged.",
    ],
    nistMapping: ["IA-2(1)", "IA-5c", "IA-5g", "IA-2(8)"],
    mitreMapping: [
      "T1621: Multi-Factor Authentication Request Generation",
      "T1566: Phishing",
      "T1566.002: Spearphishing Link",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-methods",
    ],
    implementation: `1. Create a conditional access policy enforcing phishing-resistant MFA for highly privileged roles:
   - Users > Include > Select users and groups > Directory roles > select each of the roles listed in the Highly Privileged Roles section
   - Target resources > Include > All resources (formerly 'All cloud apps')
   - Access controls > Grant > Grant Access > Require authentication strength > Phishing-resistant MFA`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.AAD.3.7v1",
    section: "Strong Authentication and a Secure Registration Process",
    sectionNumber: 3,
    title: "Managed devices SHOULD be required for authentication",
    description:
      "A conditional access policy should require a user's device to be either Microsoft Entra ID hybrid joined or compliant during authentication.",
    criticality: "SHOULD",
    rationale:
      'The security risk of an adversary authenticating to the tenant from their own device is reduced by requiring a managed device to authenticate. Managed devices are under the provisioning and control of the agency. OMB-22-09 states, "When authorizing users to access resources, agencies must consider at least one device-level signal alongside identity information about the authenticated user."',
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-20b", "IA-3"],
    mitreMapping: ["T1078: Valid Accounts", "T1078.004: Cloud Accounts"],
    resources: [
      "https://learn.microsoft.com/en-us/entra/identity/devices/how-to-hybrid-join",
      "https://learn.microsoft.com/en-us/entra/identity/devices/concept-directory-join",
    ],
    implementation: `1. Create a conditional access policy requiring a user's device to be either Microsoft Entra ID hybrid joined or compliant:
   - Users > Include > All users
   - Target resources > Include > All resources (formerly 'All cloud apps')
   - Access controls > Grant > Grant Access > Require device to be marked as compliant and Require Microsoft Entra ID hybrid joined device > For multiple controls > Require one of the selected controls`,
    licenseRequirements:
      "Policies related to managed devices require Microsoft Intune.",
  },
  {
    id: "MS.AAD.3.8v1",
    section: "Strong Authentication and a Secure Registration Process",
    sectionNumber: 3,
    title: "Managed Devices SHOULD be required to register MFA",
    description:
      "A conditional access policy should require a managed device when registering for MFA to prevent adversaries from using stolen credentials and registering their own MFA device.",
    criticality: "SHOULD",
    rationale:
      "Reduce risk of an adversary using stolen user credentials and then registering their own MFA device to access the tenant by requiring a managed device provisioned and controlled by the agency to perform registration actions.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-20b", "IA-3"],
    mitreMapping: [
      "T1078: Valid Accounts",
      "T1078.004: Cloud Accounts",
      "T1098: Account Manipulation",
      "T1098.005: Device Registration",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/mem/intune/enrollment/windows-enroll",
    ],
    implementation: `1. Create a conditional access policy requiring a user to be on a managed device when registering for MFA:
   - Users > Include > All users
   - Target resources > User actions > Register security information
   - Access controls > Grant > Grant Access > Require device to be marked as compliant and Require Microsoft Entra ID hybrid joined device > For multiple controls > Require one of the selected controls`,
    licenseRequirements:
      "Policies related to managed devices require Microsoft Intune.",
  },
  {
    id: "MS.AAD.3.9v1",
    section: "Strong Authentication and a Secure Registration Process",
    sectionNumber: 3,
    title: "Device code authentication SHOULD be blocked",
    description:
      "The device code authentication flow should be blocked as it has been abused to compromise user accounts via phishing.",
    criticality: "SHOULD",
    rationale:
      "The device code authentication flow has been abused to compromise user accounts via phishing. Since most organizations using M365 don't need device code authentication, blocking it mitigates the risk.",
    lastModified: "February 2025",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["CM-7"],
    mitreMapping: [
      "T1528: Steal Application Access Token",
      "T1078: Valid Accounts",
      "T1078.004: Cloud Accounts",
    ],
    resources: [
      "https://www.microsoft.com/en-us/security/blog/2025/02/13/storm-2372-conducts-device-code-phishing-campaign/",
      "https://learn.microsoft.com/en-us/entra/identity/conditional-access/managed-policies#block-device-code-flow",
    ],
    implementation: `1. Create a Conditional Access policy to block device code flow:
   - Users > Include > All users
   - Target resources > Include > All resources (formerly 'All cloud apps')
   - Conditions > Authentication Flows > Configure > Yes > Select Device code flow
   - Access controls > Grant > Block Access`,
    licenseRequirements: "N/A",
  },

  // ── Section 4: Centralized Log Collection ──
  {
    id: "MS.AAD.4.1v1",
    section: "Centralized Log Collection",
    sectionNumber: 4,
    title:
      "Security logs SHALL be sent to the agency's security operations center for monitoring",
    description:
      "The following Microsoft Entra ID logs (configured in diagnostic settings), are required: AuditLogs, SignInLogs, RiskyUsers, UserRiskEvents, NonInteractiveUserSignInLogs, ServicePrincipalSignInLogs, ADFSSignInLogs, RiskyServicePrincipals, ServicePrincipalRiskEvents, EnrichedOffice365AuditLogs, MicrosoftGraphActivityLogs.",
    criticality: "SHALL",
    rationale:
      "The security risk of not having visibility into cyber attacks is reduced by collecting logs in the agency's centralized security detection infrastructure. This makes security events available for auditing, query, and incident response.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [
      "If managed identities are used for Azure resources, also send the ManagedIdentitySignInLogs log type.",
      "If the Microsoft Entra ID Provisioning Service is used to provision users to SaaS apps or other systems, also send the ProvisioningLogs log type.",
      "Agencies can benefit from security detection capabilities offered by the CISA Cloud Log Aggregation Warehouse (CLAW) system.",
    ],
    nistMapping: ["AU-4"],
    mitreMapping: [
      "T1562: Impair Defenses",
      "T1562.008: Disable or Modify Cloud Logs",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/identity/monitoring-health/concept-sign-ins",
      "https://www.cisa.gov/sites/default/files/publications/NCPS%20Cloud%20Interface%20RA%20Volume%20One%20%282021-05-14%29.pdf",
    ],
    implementation:
      "Follow the configuration instructions unique to the products and integration patterns at your organization to send the security logs to the security operations center for monitoring.",
    licenseRequirements:
      "An Azure subscription may be required to send logs to an external system, such as the agency's SIEM.",
  },

  // ── Section 5: Application Registration and Consent ──
  {
    id: "MS.AAD.5.1v1",
    section: "Application Registration and Consent",
    sectionNumber: 5,
    title: "Only administrators SHALL be allowed to register applications",
    description:
      "Reduce risk of unauthorized users installing malicious applications into the tenant by ensuring that only specific privileged users can register applications.",
    criticality: "SHALL",
    rationale:
      "Application access for the tenant presents a heightened security risk compared to interactive user access because applications are typically not subject to critical security protections, such as MFA policies. Reduce risk of unauthorized users installing malicious applications into the tenant by ensuring that only specific privileged users can register applications.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [],
    nistMapping: ["AC-6(10)", "CM-5"],
    mitreMapping: [
      "T1098: Account Manipulation",
      "T1098.001: Additional Cloud Credentials",
      "T1098.003: Additional Cloud Roles",
    ],
    resources: [
      "https://www.trendmicro.com/cloudoneconformity/knowledge-base/azure/ActiveDirectory/users-can-register-applications.html",
    ],
    implementation: `1. In Microsoft Entra admin center, select Users.
2. Select User settings.
3. For Users can register applications, select No.
4. Click Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.AAD.5.2v1",
    section: "Application Registration and Consent",
    sectionNumber: 5,
    title: "Only administrators SHALL be allowed to consent to applications",
    description:
      "Limiting application consent to only specific privileged users reduces the risk of consent grant attacks.",
    criticality: "SHALL",
    rationale:
      "Limiting applications consent to only specific privileged users reduces risk of users giving insecure applications access to their data via consent grant attacks.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [],
    nistMapping: ["AC-6(10)", "CM-5"],
    mitreMapping: [
      "T1098: Account Manipulation",
      "T1098.001: Additional Cloud Credentials",
      "T1098.003: Additional Cloud Roles",
    ],
    resources: [
      "https://www.trendmicro.com/cloudoneconformity/knowledge-base/azure/ActiveDirectory/users-can-consent-to-apps-accessing-company-data-on-their-behalf.html",
      "https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-admin-consent-workflow",
    ],
    implementation: `1. In Microsoft Entra admin center select Enterprise Applications.
2. Under Security, select Consent and permissions. Then select User Consent Settings.
3. Under User consent for applications, select Do not allow user consent.
4. Click Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.AAD.5.3v1",
    section: "Application Registration and Consent",
    sectionNumber: 5,
    title:
      "An admin consent workflow SHALL be configured for applications",
    description:
      "Configure an admin consent workflow to allow users to securely request access to applications necessary for business purposes, while administrators review and approve/deny based on risk assessment.",
    criticality: "SHALL",
    rationale:
      "Configuring an admin consent workflow reduces the risk of the previous policy by setting up a process for users to securely request access to applications necessary for business purposes. Administrators have the opportunity to review the permissions requested by new applications and approve or deny access based on a risk assessment.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [],
    nistMapping: ["CM-4"],
    mitreMapping: [
      "T1098: Account Manipulation",
      "T1098.001: Additional Cloud Credentials",
      "T1098.003: Additional Cloud Roles",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-admin-consent-workflow",
    ],
    implementation: `1. In Microsoft Entra admin center create a new Microsoft Entra ID Group that contains admin users responsible for reviewing and adjudicating application consent requests.
2. Under Applications, select Enterprise Applications.
3. Under Security, select Consent and permissions. Then select Admin consent settings.
4. Under Admin consent requests navigate to Users can request admin consent to apps they are unable to consent to and select Yes.
5. Under Who can review admin consent requests, select + Add groups and select the group responsible.
6. Click Save.`,
    licenseRequirements: "N/A",
  },

  // ── Section 6: Passwords ──
  {
    id: "MS.AAD.6.1v1",
    section: "Passwords",
    sectionNumber: 6,
    title: "User passwords SHALL NOT expire",
    description:
      "Password expiration policies must be configured so passwords do not expire. NIST, OMB, and Microsoft guidance indicates mandated periodic password changes make user accounts less secure.",
    criticality: "SHALL NOT",
    rationale:
      'The National Institute of Standards and Technology (NIST), OMB, and Microsoft have published guidance indicating mandated periodic password changes make user accounts less secure. For example, OMB-22-09 states, "Password policies must not require use of special characters or regular rotation."',
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [],
    nistMapping: ["IA-5(1)"],
    mitreMapping: [],
    resources: [
      "https://learn.microsoft.com/en-us/microsoft-365/admin/misc/password-policy-recommendations?view=o365-worldwide#password-expiration-requirements-for-users",
      "https://learn.microsoft.com/en-us/entra/identity/authentication/concept-password-ban-bad",
      "https://pages.nist.gov/800-63-3/sp800-63b.html",
    ],
    implementation:
      "1. Configure the Password expiration policy to Set passwords to never expire.",
    licenseRequirements: "N/A",
  },

  // ── Section 7: Highly Privileged User Access ──
  {
    id: "MS.AAD.7.1v1",
    section: "Highly Privileged User Access",
    sectionNumber: 7,
    title:
      "A minimum of two users and a maximum of eight users SHALL be provisioned with the Global Administrator role",
    description:
      "The Global Administrator role provides unfettered access to the tenant. Limiting the number of users with this level of access makes tenant compromise more challenging. Microsoft recommends fewer than five users. However, additional user accounts, up to eight, may be necessary to support emergency access and some operational scenarios.",
    criticality: "SHALL",
    rationale:
      "The Global Administrator role provides unfettered access to the tenant. Limiting the number of users with this level of access makes tenant compromise more challenging.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [],
    nistMapping: ["AC-6(5)"],
    mitreMapping: [
      "T1098: Account Manipulation",
      "T1098.003: Additional Cloud Roles",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/best-practices#5-limit-the-number-of-global-administrators-to-less-than-5",
    ],
    implementation: `1. In Microsoft Entra admin center count the number of users assigned to the Global Administrator role. Count users assigned directly and via group membership. If you have Microsoft Entra ID PIM, count both Eligible assignments and Active assignments.
2. Validate that there are a total of two to eight users assigned to the Global Administrator role.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.AAD.7.2v1",
    section: "Highly Privileged User Access",
    sectionNumber: 7,
    title:
      "Privileged users SHALL be provisioned with finer-grained roles instead of Global Administrator",
    description:
      "Many privileged administrative users do not need unfettered access. Users should be assigned to roles based on least privilege to reduce compromise risk.",
    criticality: "SHALL",
    rationale:
      "Many privileged administrative users do not need unfettered access to the tenant to perform their duties. By assigning them to roles based on least privilege, the risks associated with having their accounts compromised are reduced.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [],
    nistMapping: ["AC-5"],
    mitreMapping: [
      "T1098: Account Manipulation",
      "T1098.003: Additional Cloud Roles",
      "T1651: Cloud Administration Command",
      "T1136: Create Account",
      "T1136.003: Cloud Account",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/best-practices",
    ],
    implementation: `1. Follow instructions for MS.AAD.7.1v1 to get a count of users assigned to Global Administrator.
2. Get a count of users assigned to other highly privileged roles (not Global Administrator).
3. Divide: X = (Global Admin count) / (Other privileged roles count). If X <= 1, the tenant is compliant.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.AAD.7.3v1",
    section: "Highly Privileged User Access",
    sectionNumber: 7,
    title:
      "Privileged users SHALL be provisioned cloud-only accounts separate from an on-premises directory or other federated identity providers",
    description:
      "Cloud-only Microsoft Entra ID user accounts must be provisioned for privileged users to reduce risks from compromised on-premises federation infrastructure.",
    criticality: "SHALL",
    rationale:
      "By provisioning cloud-only Microsoft Entra ID user accounts to privileged users, the risks associated with a compromise of on-premises federation infrastructure are reduced. It is more challenging for the adversary to pivot from the compromised environment to the cloud with privileged access.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [],
    nistMapping: ["AC-6(5)"],
    mitreMapping: [
      "T1556: Modify Authentication Process",
      "T1556.007: Hybrid Identity",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/best-practices",
    ],
    implementation: `1. Perform the steps below for each highly privileged role.
2. Create a list of all users assigned to the role (direct, group, PIM eligible/active).
3. For each user, run: Connect-MgGraph; Get-MgBetaUser -Filter "userPrincipalName eq 'username@domain.com'" | FL
4. Review the OnPremisesImmutableId field. If it contains data, the user is not cloud-only.
5. Create cloud-only accounts for non-cloud-only privileged users.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.AAD.7.4v1",
    section: "Highly Privileged User Access",
    sectionNumber: 7,
    title:
      "Permanent active role assignments SHALL NOT be allowed for highly privileged roles",
    description:
      "Instead of permanent assignments, provision access just-in-time using PIM or alternative PAM system by assigning users as eligible instead of perpetually active.",
    criticality: "SHALL NOT",
    rationale:
      "Instead of giving users permanent assignments to privileged roles, provisioning access just in time lessens exposure if those accounts become compromised.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [
      "Exceptions: Emergency access accounts and some service accounts that require perpetual active assignment.",
      "If using PIM for Groups, a group enrolled in PIM is allowed to have perpetual active assignment because activation is handled by PIM for Groups.",
    ],
    nistMapping: ["AC-2"],
    mitreMapping: [
      "T1098: Account Manipulation",
      "T1098.003: Additional Cloud Roles",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-how-to-add-role-to-user",
    ],
    implementation: `1. In Microsoft Entra admin center select Roles and admins. Perform for each highly privileged role.
2. Select the role (e.g., Global Administrator).
3. Under Manage, select Assignments and click Active assignments tab.
4. Verify there are no users or groups with Permanent in the End time column.
5. Recreate any permanent assignments with an expiration date using PIM.`,
    licenseRequirements:
      "Requires Microsoft Entra ID P2 license (or third-party PAM solution).",
  },
  {
    id: "MS.AAD.7.5v1",
    section: "Highly Privileged User Access",
    sectionNumber: 7,
    title:
      "Provisioning users to highly privileged roles SHALL NOT occur outside of a PAM system",
    description:
      "Users must be provisioned to privileged roles within a PAM system (like Microsoft Entra ID PIM). Assigning roles directly in M365 admin center or via PowerShell bypasses critical security capabilities.",
    criticality: "SHALL NOT",
    rationale:
      "Provisioning users to privileged roles within a PAM system enables enforcement of numerous privileged access policies and monitoring. If privileged users are assigned directly to roles outside the context of a PAM system, a significant set of critical security capabilities are bypassed.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [],
    nistMapping: ["AC-2"],
    mitreMapping: [
      "T1098: Account Manipulation",
      "T1098.003: Additional Cloud Roles",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-how-to-add-role-to-user",
    ],
    implementation: `1. For each highly privileged role, in Microsoft Entra admin center select Roles and Admins.
2. Select the role (e.g., Global Administrator).
3. Under Manage, select Assignments and click Active assignments tab.
4. For each user/group, examine the Start time column. If it contains '-', the assignment was made outside of PIM.
5. Delete assignments made outside PIM and recreate using PIM.`,
    licenseRequirements:
      "Requires Microsoft Entra ID P2 license (or third-party PAM solution).",
  },
  {
    id: "MS.AAD.7.6v1",
    section: "Highly Privileged User Access",
    sectionNumber: 7,
    title:
      "Activation of the Global Administrator role SHALL require approval",
    description:
      "Configuring PIM to require approval before activating Global Administrator provides an additional security layer and creates an audit trail.",
    criticality: "SHALL",
    rationale:
      "Requiring approval for a user to activate Global Administrator, which provides unfettered access, makes it more challenging for an attacker to compromise the tenant with stolen credentials, and it provides visibility of activities indicating a compromise is taking place.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [],
    nistMapping: ["AC-6(1)"],
    mitreMapping: [
      "T1098: Account Manipulation",
      "T1098.003: Additional Cloud Roles",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-approval-workflow",
    ],
    implementation: `1. In Microsoft Entra Portal, under Identity Governance, select Privileged Identity Management (PIM), under Manage, select Microsoft Entra roles.
2. Under Manage, select Roles.
3. Select the Global Administrator role.
4. Click Settings, then Edit.
5. Select the Require approval to activate option.
6. Click Update.
7. Review PIM for Groups if any groups are actively assigned to Global Administrator.`,
    licenseRequirements:
      "Requires Microsoft Entra ID P2 license (or third-party PAM solution).",
  },
  {
    id: "MS.AAD.7.7v1",
    section: "Highly Privileged User Access",
    sectionNumber: 7,
    title:
      "Eligible and active highly privileged role assignments SHALL trigger an alert",
    description:
      "Configure PIM to send email alerts to a security monitoring mailbox when users are assigned (eligible or active) to highly privileged roles.",
    criticality: "SHALL",
    rationale:
      "Closely monitor assignment of the highest privileged roles for signs of compromise. Send assignment alerts to enable the security monitoring team to detect compromise attempts.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [],
    nistMapping: ["AC-2(1)"],
    mitreMapping: [
      "T1098: Account Manipulation",
      "T1098.003: Additional Cloud Roles",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-how-to-configure-security-alerts",
    ],
    implementation: `1. In Microsoft Entra Portal, under Identity Governance, select PIM, then Microsoft Entra roles.
2. Under Manage, select Roles. For each highly privileged role:
   a. Click the role, then Settings, then Edit.
   b. Click the Notification tab.
   c. Under 'Send notifications when members are assigned as eligible to this role', enter security mailbox in Additional recipients.
   d. Under 'Send notifications when members are assigned as active to this role', enter security mailbox in Additional recipients.
   e. Click Update.
3. Apply the same to PIM groups if used.`,
    licenseRequirements:
      "Requires Microsoft Entra ID P2 license (or third-party PAM solution).",
  },
  {
    id: "MS.AAD.7.8v1",
    section: "Highly Privileged User Access",
    sectionNumber: 7,
    title:
      "User activation of the Global Administrator role SHALL trigger an alert",
    description:
      "Configure PIM to send an activation alert to a security monitoring mailbox when the Global Administrator role is activated.",
    criticality: "SHALL",
    rationale:
      "Closely monitor activation of the Global Administrator role for signs of compromise. Send activation alerts to enable the security monitoring team to detect compromise attempts.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [
      "It is recommended to prioritize user activation of Global Administrator as one of the most important events to monitor and respond to.",
    ],
    nistMapping: ["AC-6(9)"],
    mitreMapping: [
      "T1098: Account Manipulation",
      "T1098.003: Additional Cloud Roles",
      "T1651: Cloud Administration Command",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-how-to-configure-security-alerts",
    ],
    implementation: `1. In Microsoft Entra Portal, under Identity Governance, select PIM, then Microsoft Entra roles.
2. Click the Global Administrator role.
3. Click Settings then Edit.
4. Click the Notification tab.
5. Under 'Send notifications when eligible members activate this role', in Role activation alert, enter security monitoring mailbox in Additional recipients.
6. Click Update.
7. Apply the same to PIM groups if used.`,
    licenseRequirements:
      "Requires Microsoft Entra ID P2 license (or third-party PAM solution).",
  },
  {
    id: "MS.AAD.7.9v1",
    section: "Highly Privileged User Access",
    sectionNumber: 7,
    title:
      "User activation of other highly privileged roles SHOULD trigger an alert",
    description:
      "Configure PIM to send activation alerts for all highly privileged roles (other than Global Administrator) to a separate security monitoring mailbox.",
    criticality: "SHOULD",
    rationale:
      "Closely monitor activation of high-risk roles for signs of compromise. Send activation alerts to enable the security monitoring team to detect compromise attempts. In some environments, activating privileged roles can generate a significant number of alerts.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-6(9)"],
    mitreMapping: [
      "T1098: Account Manipulation",
      "T1098.003: Additional Cloud Roles",
      "T1651: Cloud Administration Command",
      "T1136: Create Account",
      "T1136.003: Cloud Account",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-how-to-configure-security-alerts",
    ],
    implementation: `1. Follow the same instructions as MS.AAD.7.8v1 for each of the highly privileged roles (other than Global Administrator) but enter a security monitoring mailbox different from the one used to monitor Global Administrator activations.
2. Apply the same to PIM groups if used.`,
    licenseRequirements:
      "Requires Microsoft Entra ID P2 license (or third-party PAM solution).",
  },

  // ── Section 8: Guest User Access ──
  {
    id: "MS.AAD.8.1v1",
    section: "Guest User Access",
    sectionNumber: 8,
    title:
      "Guest users SHOULD have limited or restricted access to Microsoft Entra ID directory objects",
    description:
      "Limit the amount of object information available to guest users to reduce malicious reconnaissance exposure if a guest account is compromised.",
    criticality: "SHOULD",
    rationale:
      "Limiting the amount of object information available to guest users in the tenant, reduces malicious reconnaissance exposure if a guest account is compromised or created by an adversary.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-6"],
    mitreMapping: [
      "T1087: Account Discovery",
      "T1087.003: Email Account",
      "T1087.004: Cloud Account",
      "T1526: Cloud Service Discovery",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/external-id/external-collaboration-settings-configure",
      "https://learn.microsoft.com/en-us/entra/fundamentals/users-default-permissions#compare-member-and-guest-default-permissions",
    ],
    implementation: `1. In Microsoft Entra admin center select External Identities > External collaboration settings.
2. Under Guest user access, select either 'Guest users have limited access to properties and memberships of directory objects' or 'Guest user access is restricted to properties and memberships of their own directory objects (most restrictive)'.
3. Click Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.AAD.8.2v1",
    section: "Guest User Access",
    sectionNumber: 8,
    title:
      "Only users with the Guest Inviter role SHOULD be able to invite guest users",
    description:
      "Only allow an authorized group of individuals to invite external users to create accounts in the tenant.",
    criticality: "SHOULD",
    rationale:
      "By only allowing an authorized group of individuals to invite external users to create accounts in the tenant, an agency can enforce a guest user account approval process, reducing the risk of unauthorized account creation.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-6(10)"],
    mitreMapping: [
      "T1098: Account Manipulation",
      "T1098.003: Additional Cloud Roles",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/external-id/external-collaboration-settings-configure",
    ],
    implementation: `1. In Microsoft Entra admin center select External Identities > External collaboration settings.
2. Under Guest invite settings, select 'Only users assigned to specific admin roles can invite guest users'.
3. Click Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.AAD.8.3v1",
    section: "Guest User Access",
    sectionNumber: 8,
    title:
      "Guest invites SHOULD only be allowed to specific external domains that have been authorized by the agency for legitimate business purposes",
    description:
      "Limit which external domains can be invited to create guest accounts in the tenant.",
    criticality: "SHOULD",
    rationale:
      "Limiting which domains can be invited to create guest accounts in the tenant helps reduce the risk of users from unauthorized external organizations getting access.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3"],
    mitreMapping: [
      "T1078: Valid Accounts",
      "T1078.001: Default Accounts",
    ],
    resources: [
      "https://learn.microsoft.com/en-us/entra/external-id/external-collaboration-settings-configure",
    ],
    implementation: `1. In Microsoft Entra admin center select External Identities > External collaboration settings.
2. Under Collaboration restrictions, select 'Allow invitations only to the specified domains (most restrictive)'.
3. Select Target domains and enter the names of the external domains authorized by the agency.
4. Click Save.`,
    licenseRequirements: "N/A",
  },
];

// ══════════════════════════════════════════════════════════════
// EXCHANGE ONLINE (EXO) BASELINE CONTROLS
// Source: https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/exo.md
// ══════════════════════════════════════════════════════════════

export const EXO_SECTIONS: Record<number, string> = {
  1: "Automatic Forwarding",
  2: "Sender Policy Framework",
  3: "DKIM",
  4: "DMARC",
  5: "SMTP Authentication",
  6: "Calendar and Contact Sharing",
  7: "External Sender Warnings",
  8: "Data Loss Prevention",
  9: "Attachment File Type",
  10: "Malware Scanning",
  11: "Phishing Protections",
  12: "IP Allow Lists",
  13: "Mailbox Auditing",
  14: "Inbound Anti-Spam Protections",
  15: "Link Protection",
  16: "Alerts",
  17: "Audit Logging",
};

export const EXO_BASELINE_CONTROLS: BaselineControl[] = [
  {
    id: "MS.EXO.1.1v1",
    section: "Automatic Forwarding",
    sectionNumber: 1,
    title: "Automatic forwarding to external domains SHALL be disabled",
    description: "Automatic forwarding of email to external domains shall be disabled to prevent unauthorized data exfiltration.",
    criticality: "SHALL",
    rationale: "Automatic forwarding can be used to exfiltrate data. Disabling it reduces the risk of unauthorized information disclosure.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [],
    nistMapping: ["AC-4", "SC-7"],
    mitreMapping: ["T1114.003: Email Collection: Email Forwarding Rule", "T1020: Automated Exfiltration"],
    resources: ["https://learn.microsoft.com/en-us/exchange/policy-and-compliance/mail-flow-rules/mail-flow-rule-procedures"],
    implementation: `1. Sign in to the Exchange admin center.
2. Navigate to Mail flow > Remote domains.
3. Select the Default domain.
4. Under Email reply types, set Automatic forwarding to Disabled.
5. Click Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.2.1v1",
    section: "Calendar and Contact Sharing",
    sectionNumber: 2,
    title: "Contact folders SHALL NOT be shared with all domains",
    description: "Contact folders should not be shared with all external domains to prevent unauthorized access to organizational contact information.",
    criticality: "SHALL NOT",
    rationale: "Sharing contact information with external domains can lead to data leakage and social engineering attacks.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3", "AC-4"],
    mitreMapping: ["T1589: Gather Victim Identity Information"],
    resources: ["https://learn.microsoft.com/en-us/exchange/sharing/organization-relationships/organization-relationships"],
    implementation: `1. Sign in to the Exchange admin center.
2. Navigate to Organization > Sharing.
3. For the default sharing policy, ensure that contact sharing with all domains is disabled.
4. If specific partner domains require sharing, create individual sharing policies with limited scope.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.2.2v1",
    section: "Calendar and Contact Sharing",
    sectionNumber: 2,
    title: "Calendar details SHALL NOT be shared with all domains",
    description: "Calendar details should not be shared with all external domains to prevent exposure of meeting information.",
    criticality: "SHALL NOT",
    rationale: "Sharing calendar details with all domains exposes meeting schedules and information to potential adversaries.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3", "AC-4"],
    mitreMapping: ["T1589: Gather Victim Identity Information"],
    resources: ["https://learn.microsoft.com/en-us/exchange/sharing/sharing-policies/sharing-policies"],
    implementation: `1. Sign in to the Exchange admin center.
2. Navigate to Organization > Sharing.
3. For the default sharing policy, ensure that calendar sharing with all domains is disabled or limited to free/busy only.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.3.1v1",
    section: "DKIM",
    sectionNumber: 3,
    title: "DKIM SHOULD be enabled for all domains",
    description: "DomainKeys Identified Mail (DKIM) should be enabled for all accepted domains to help prevent email spoofing.",
    criticality: "SHOULD",
    rationale: "DKIM provides a method for validating a domain name identity associated with a message through cryptographic authentication.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing", "T1566.001: Spearphishing Attachment"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/email-authentication-dkim-configure"],
    implementation: `1. Sign in to the Microsoft 365 Defender portal.
2. Navigate to Email & collaboration > Policies & rules > Threat policies > Email authentication settings.
3. Select the DKIM tab.
4. For each domain, enable DKIM signing by clicking Enable.
5. Publish the required CNAME records in DNS for each domain.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.4.1v1",
    section: "DMARC",
    sectionNumber: 4,
    title: "A DMARC policy SHALL be published for every second-level domain",
    description: "A DMARC policy must be published for every second-level domain to protect against email spoofing and phishing.",
    criticality: "SHALL",
    rationale: "DMARC builds on SPF and DKIM to validate that email is sent from authorized domains, reducing phishing risk.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing", "T1566.002: Spearphishing Link"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/email-authentication-dmarc-configure"],
    implementation: `1. Publish a DMARC TXT record in DNS for every second-level domain.
2. Start with p=none to monitor, then move to p=quarantine and eventually p=reject.
3. Example record: _dmarc.example.com TXT "v=DMARC1; p=reject; pct=100; rua=mailto:dmarc-reports@example.com"`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.4.2v1",
    section: "DMARC",
    sectionNumber: 4,
    title: "The DMARC message rejection option SHALL be p=reject",
    description: "The DMARC policy should be set to reject messages that fail authentication checks.",
    criticality: "SHALL",
    rationale: "A reject policy provides the strongest protection against spoofed email from the domain.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/email-authentication-dmarc-configure"],
    implementation: `1. Update the DMARC DNS record to set p=reject.
2. Ensure the percentage (pct) is set to 100.
3. Monitor DMARC reports for any legitimate mail that may be affected.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.4.3v1",
    section: "DMARC",
    sectionNumber: 4,
    title: "The DMARC point of contact for aggregate reports SHALL be defined",
    description: "A point of contact for DMARC aggregate reports must be configured.",
    criticality: "SHALL",
    rationale: "Aggregate reports provide visibility into email authentication results and potential spoofing attempts.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/email-authentication-dmarc-configure"],
    implementation: `1. In the DMARC DNS record, include the rua tag with a valid mailto address.
2. Example: rua=mailto:dmarc-reports@example.com`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.5.1v1",
    section: "SMTP Authentication",
    sectionNumber: 5,
    title: "SMTP AUTH SHALL be disabled",
    description: "SMTP AUTH should be disabled globally, as it allows legacy authentication that does not support MFA.",
    criticality: "SHALL",
    rationale: "SMTP AUTH uses legacy authentication. Disabling it reduces the attack surface for credential-based attacks.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [],
    nistMapping: ["CM-7", "IA-2"],
    mitreMapping: ["T1110: Brute Force", "T1078: Valid Accounts"],
    resources: ["https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/authenticated-client-smtp-submission"],
    implementation: `1. Sign in to the Exchange admin center.
2. Navigate to Settings > Mail flow.
3. Disable SMTP AUTH globally.
4. For individual mailboxes that require SMTP AUTH (e.g., multifunction printers), enable it per-mailbox only.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.6.1v1",
    section: "SPF",
    sectionNumber: 6,
    title: "An SPF policy SHALL be published for each domain",
    description: "Sender Policy Framework records must be published for each domain that sends email.",
    criticality: "SHALL",
    rationale: "SPF validates that email is sent from authorized mail servers, helping prevent spoofing.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/email-authentication-spf-configure"],
    implementation: `1. Publish an SPF TXT record in DNS for each domain.
2. Include all authorized sending sources.
3. End with -all (hard fail) to reject unauthorized senders.
4. Example: v=spf1 include:spf.protection.outlook.com -all`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.6.2v1",
    section: "SPF",
    sectionNumber: 6,
    title: "An SPF policy SHALL terminate with -all",
    description: "SPF policies should use a hard fail (-all) mechanism to reject unauthorized senders.",
    criticality: "SHALL",
    rationale: "A hard fail directive rejects mail from unauthorized senders rather than allowing it through.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/email-authentication-spf-configure"],
    implementation: `1. Update the SPF DNS record to end with -all instead of ~all.
2. Verify all legitimate sending sources are included before switching to hard fail.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.7.1v1",
    section: "Inbound Anti-Spam Protections",
    sectionNumber: 7,
    title: "External sender warnings SHALL be enabled",
    description: "Warnings for emails from external senders should be enabled to help users identify potential phishing.",
    criticality: "SHALL",
    rationale: "External sender identification helps users recognize potentially malicious emails from outside the organization.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-protection-about"],
    implementation: `1. Sign in to the Microsoft 365 Defender portal.
2. Navigate to Policies & rules > Threat policies > Anti-spam.
3. Enable external sender identification in Outlook.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.8.1v1",
    section: "Phishing Protections",
    sectionNumber: 8,
    title: "Anti-phishing policies SHALL have impersonation protection enabled for key users",
    description: "Anti-phishing policies should protect against impersonation of high-value targets.",
    criticality: "SHALL",
    rationale: "Impersonation-based phishing targets executives and other key personnel. Specific protections reduce this risk.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing", "T1566.001: Spearphishing Attachment"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-phishing-policies-about"],
    implementation: `1. Sign in to the Microsoft 365 Defender portal.
2. Navigate to Policies & rules > Threat policies > Anti-phishing.
3. Edit the default policy or create a new policy.
4. Enable user impersonation protection and add key users (executives, finance staff, etc.).
5. Set the action for impersonated users to Quarantine the message.`,
    licenseRequirements: "Microsoft Defender for Office 365 Plan 1",
  },
  {
    id: "MS.EXO.8.2v1",
    section: "Phishing Protections",
    sectionNumber: 8,
    title: "Anti-phishing policies SHALL have domain impersonation protection enabled",
    description: "Domain impersonation protection should be enabled to prevent spoofing of the organization's domains.",
    criticality: "SHALL",
    rationale: "Domain impersonation protection helps prevent attackers from using look-alike domains.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-phishing-policies-about"],
    implementation: `1. In the Microsoft 365 Defender portal, navigate to Anti-phishing policies.
2. Enable domain impersonation protection.
3. Add all agency-owned domains to the protection list.
4. Set the action for impersonated domains to Quarantine the message.`,
    licenseRequirements: "Microsoft Defender for Office 365 Plan 1",
  },
  {
    id: "MS.EXO.9.1v1",
    section: "Connection Filter",
    sectionNumber: 9,
    title: "IP allow lists SHOULD NOT be used",
    description: "IP allow lists in the connection filter should be avoided as they bypass spam filtering.",
    criticality: "SHOULD NOT",
    rationale: "IP allow lists bypass spam filtering for the listed addresses, which can be exploited by adversaries.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/connection-filter-policies-configure"],
    implementation: `1. Sign in to the Microsoft 365 Defender portal.
2. Navigate to Policies & rules > Threat policies > Anti-spam > Connection filter policy.
3. Remove any entries from the IP Allow list unless absolutely required.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.9.2v1",
    section: "Connection Filter",
    sectionNumber: 9,
    title: "Safe lists SHOULD NOT be enabled",
    description: "The 'safe' list option in the connection filter should be disabled.",
    criticality: "SHOULD NOT",
    rationale: "The safe list option uses Microsoft's internal list to bypass filtering, which reduces filtering effectiveness.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/connection-filter-policies-configure"],
    implementation: `1. In the Microsoft 365 Defender portal, navigate to Connection filter policy.
2. Ensure the 'Turn on safe list' option is disabled.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.10.1v1",
    section: "Malware Filter",
    sectionNumber: 10,
    title: "Notifications for internal senders SHALL be disabled for malware detection",
    description: "Internal sender notifications should be disabled when malware is detected to reduce information leakage.",
    criticality: "SHALL",
    rationale: "Notifying senders about malware detections can provide adversaries with information about detection capabilities.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3"],
    mitreMapping: ["T1566.001: Spearphishing Attachment"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-malware-policies-configure"],
    implementation: `1. Sign in to the Microsoft 365 Defender portal.
2. Navigate to Policies & rules > Threat policies > Anti-malware.
3. Edit the default policy.
4. Under Notifications, disable sender notifications for internal senders.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.10.2v1",
    section: "Malware Filter",
    sectionNumber: 10,
    title: "The common attachments filter SHALL be enabled",
    description: "The common attachments filter should be enabled to block file types commonly associated with malware.",
    criticality: "SHALL",
    rationale: "Blocking common malware file types reduces the risk of malware delivery via email attachments.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3"],
    mitreMapping: ["T1566.001: Spearphishing Attachment"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-malware-policies-configure"],
    implementation: `1. In the Microsoft 365 Defender portal, navigate to Anti-malware policies.
2. Edit the default policy.
3. Under Protection settings, enable the common attachments filter.
4. Add any additional file types that should be blocked per agency policy.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.12.1v1",
    section: "Alerts",
    sectionNumber: 12,
    title: "Security alerts SHALL be enabled",
    description: "Default security alerts in the Microsoft 365 Defender portal must be enabled.",
    criticality: "SHALL",
    rationale: "Alerts provide timely notification of security events, enabling rapid response to potential threats.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-4"],
    mitreMapping: ["T1114: Email Collection"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/alert-policies-defender-portal"],
    implementation: `1. Sign in to the Microsoft 365 Defender portal.
2. Navigate to Policies & rules > Alert policy.
3. Ensure that all default security alert policies are enabled.
4. Configure alert recipients as appropriate.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.13.1v1",
    section: "Audit",
    sectionNumber: 13,
    title: "Mailbox auditing SHALL be enabled",
    description: "Mailbox auditing must be enabled to track mailbox access and actions.",
    criticality: "SHALL",
    rationale: "Auditing mailbox actions provides essential forensic data for investigating security incidents.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [],
    nistMapping: ["AU-2", "AU-3", "AU-6"],
    mitreMapping: ["T1114: Email Collection", "T1114.002: Remote Email Collection"],
    resources: ["https://learn.microsoft.com/en-us/purview/audit-mailboxes"],
    implementation: `1. Mailbox auditing is enabled by default in Microsoft 365.
2. Verify by running: Get-OrganizationConfig | Select AuditDisabled
3. Ensure the value is False.
4. If disabled, run: Set-OrganizationConfig -AuditDisabled $false`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.14.1v1",
    section: "Mailbox Auditing",
    sectionNumber: 14,
    title: "Unified audit logging SHALL be enabled",
    description: "The unified audit log must be enabled to capture events across Microsoft 365 services.",
    criticality: "SHALL",
    rationale: "The unified audit log provides a comprehensive record of user and admin activities across all Microsoft 365 services.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [],
    nistMapping: ["AU-2", "AU-3", "AU-6", "AU-12"],
    mitreMapping: ["T1114: Email Collection"],
    resources: ["https://learn.microsoft.com/en-us/purview/audit-log-enable-disable"],
    implementation: `1. Sign in to the Microsoft Purview compliance portal.
2. Navigate to Audit.
3. If auditing is not enabled, click 'Start recording user and admin activity'.
4. Alternatively, use PowerShell: Set-AdminAuditLogConfig -UnifiedAuditLogIngestionEnabled $true`,
    licenseRequirements: "N/A",
  },

  // ── Section 4 (cont.): DMARC — additional controls ──
  {
    id: "MS.EXO.4.4v1",
    section: "DMARC",
    sectionNumber: 4,
    title: "An agency point of contact SHOULD be included for aggregate and failure reports",
    description: "The DMARC record should include an agency-specific point of contact in the RUA and RUF fields for receiving aggregate and failure reports.",
    criticality: "SHOULD",
    rationale: "Email spoofing attempts are not inherently visible to domain owners. DMARC provides a mechanism to receive reports of spoofing attempts. Including an agency point of contact gives the agency insight into attempts to spoof their domains.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-4(5)"],
    mitreMapping: ["T1562: Impair Defenses"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/email-authentication-dmarc-configure"],
    implementation: `1. Update the DMARC DNS record to include an agency point of contact in the RUA field.
2. Include reports@dmarc.cyber.dhs.gov as one of the emails in the RUA field.
3. Include one or more agency-defined points of contact in the RUF field.
4. Example: v=DMARC1; p=reject; pct=100; rua=mailto:reports@dmarc.cyber.dhs.gov,mailto:reports@example.com; ruf=mailto:reports@example.com`,
    licenseRequirements: "N/A",
  },

  // ── Section 8 (cont.): Data Loss Prevention — additional manual controls ──
  {
    id: "MS.EXO.8.3v1",
    section: "Data Loss Prevention",
    sectionNumber: 8,
    title: "The DLP solution SHOULD offer services comparable to the native DLP solution offered by Microsoft",
    description: "Any alternative DLP solution should be able to detect sensitive information in Exchange Online and block access to unauthorized entities.",
    criticality: "SHOULD",
    rationale: "Any alternative DLP solution should be able to detect sensitive information in Exchange Online and block access to unauthorized entities.",
    lastModified: "May 2024",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SC-7(10)"],
    mitreMapping: ["T1567: Exfiltration Over Web Service", "T1048: Exfiltration Over Alternative Protocol", "T1530: Data from Cloud Storage"],
    resources: [],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft Defender, see the implementation steps for DLP in the Defender baseline for additional guidance.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.8.4v1",
    section: "Data Loss Prevention",
    sectionNumber: 8,
    title: "At a minimum, the DLP solution SHALL restrict sharing credit card numbers, ITINs, and SSNs via email",
    description: "The DLP solution must restrict sharing of credit card numbers, U.S. Individual Taxpayer Identification Numbers (ITIN), and U.S. Social Security numbers (SSN) via email.",
    criticality: "SHALL",
    rationale: "Users may inadvertently share sensitive information with others who should not have access to it. DLP policies provide a way for agencies to detect and prevent unauthorized disclosures.",
    lastModified: "May 2024",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SC-7(10)"],
    mitreMapping: ["T1567: Exfiltration Over Web Service", "T1048: Exfiltration Over Alternative Protocol", "T1213: Data from Information Repositories", "T1530: Data from Cloud Storage"],
    resources: [],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft Defender, see the implementation steps for protecting PII in the Defender baseline for additional guidance.`,
    licenseRequirements: "N/A",
  },

  // ── Section 9 (cont.): Attachment File Type — additional manual controls ──
  {
    id: "MS.EXO.9.3v2",
    section: "Attachment File Type",
    sectionNumber: 9,
    title: "Disallowed file types SHALL be determined and enforced",
    description: "The agency must determine the full list of file types to block and enforce the block via their chosen solution.",
    criticality: "SHALL",
    rationale: "Malicious attachments often take the form of click-to-run files, though other file types can contain malicious content as well. Determining the full list of file types to block is left to each organization, in accordance with their risk tolerance.",
    lastModified: "May 2024",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3"],
    mitreMapping: ["T1566: Phishing", "T1566.001: Spearphishing Attachment"],
    resources: ["https://learn.microsoft.com/en-us/defender-office-365/anti-malware-protection-about#common-attachments-filter-in-anti-malware-policies"],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft Defender, see the implementation steps for enabling preset security policies, which disallow click-to-run file types.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.9.4v1",
    section: "Attachment File Type",
    sectionNumber: 9,
    title: "If a third-party filtering solution is used, it SHOULD offer services comparable to Microsoft Defender's Common Attachment Filter",
    description: "Any alternative filtering solution should offer services comparable to the Common Attachment Filter in Microsoft Defender.",
    criticality: "SHOULD",
    rationale: "Malicious attachments often take the form of click-to-run files. Filtering email attachments based on file types can prevent spread of malware distributed via click-to-run email attachments.",
    lastModified: "May 2024",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3"],
    mitreMapping: ["T1566: Phishing", "T1566.001: Spearphishing Attachment"],
    resources: ["https://learn.microsoft.com/en-us/defender-office-365/anti-malware-protection-about#common-attachments-filter-in-anti-malware-policies"],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft Defender, see the implementation steps for enabling preset security policies, which disallow click-to-run file types.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.9.5v1",
    section: "Attachment File Type",
    sectionNumber: 9,
    title: "At a minimum, click-to-run files SHOULD be blocked (e.g., .exe, .cmd, and .vbe)",
    description: "At minimum, common executable file types should be blocked to reduce the risk of malware delivery.",
    criticality: "SHOULD",
    rationale: "Malicious attachments often take the form of click-to-run files. Blocking common executable files helps mitigate the risk of adversarial exploitation.",
    lastModified: "May 2024",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3"],
    mitreMapping: ["T1566: Phishing", "T1566.001: Spearphishing Attachment"],
    resources: ["https://learn.microsoft.com/en-us/defender-office-365/anti-malware-protection-about#common-attachments-filter-in-anti-malware-policies"],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft Defender, see the implementation steps for enabling preset security policies, which disallow click-to-run file types.`,
    licenseRequirements: "N/A",
  },

  // ── Section 10 (cont.): Malware Scanning — additional manual control ──
  {
    id: "MS.EXO.10.3v1",
    section: "Malware Scanning",
    sectionNumber: 10,
    title: "Email scanning SHALL be capable of reviewing emails after delivery",
    description: "The malware scanning solution must be able to retroactively scan and remove malware from emails already delivered to user mailboxes.",
    criticality: "SHALL",
    rationale: "As known malware signatures are updated, it is possible for an email to be retroactively identified as containing malware after delivery. Scanning emails after delivery can reduce the number of malware-infected emails in users' mailboxes.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3"],
    mitreMapping: ["T1566: Phishing", "T1566.001: Spearphishing Attachment"],
    resources: [],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft Defender, see the implementation steps for enabling preset security policies, which include zero-hour auto purge (ZAP) to retroactively detect malware in messages already delivered to mailboxes and remove them.`,
    licenseRequirements: "N/A",
  },

  // ── Section 11: Phishing Protections ──
  {
    id: "MS.EXO.11.1v1",
    section: "Phishing Protections",
    sectionNumber: 11,
    title: "Impersonation protection checks SHOULD be used",
    description: "Impersonation protection should be used to identify senders that appear to be impersonating known entities.",
    criticality: "SHOULD",
    rationale: "Users might not be able to reliably identify phishing emails, especially if the FROM address is nearly indistinguishable from that of a known entity. By automatically identifying senders who appear to be impersonating known senders, the risk of a successful phishing attempt can be reduced.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing", "T1656: Impersonation"],
    resources: [],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft Defender, see the implementation steps for enabling impersonation protection in the Defender baseline.`,
    licenseRequirements: "Defender for Office 365 Plan 1 or 2 (included with E5/G5, add-on for E3/G3)",
  },
  {
    id: "MS.EXO.11.2v1",
    section: "Phishing Protections",
    sectionNumber: 11,
    title: "User warnings, comparable to the user safety tips included with EOP, SHOULD be displayed",
    description: "User safety tips or equivalent warnings should be displayed to alert users about potential phishing messages.",
    criticality: "SHOULD",
    rationale: "Many tasks are better suited for automated processes, such as identifying unusual characters in the FROM address or identifying a first-time sender. User warnings can handle these tasks, reducing the burden on end users and the risk of successful phishing attempts.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["AT-2b", "SI-8"],
    mitreMapping: ["T1566: Phishing", "T1656: Impersonation"],
    resources: [],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft Defender, see the implementation steps for enabling preset security policies which include user safety tips to warn users.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.11.3v1",
    section: "Phishing Protections",
    sectionNumber: 11,
    title: "The phishing protection solution SHOULD include an AI-based phishing detection tool comparable to EOP Mailbox Intelligence",
    description: "The anti-phishing solution should use AI-based detection, such as Mailbox Intelligence, to improve phishing detection rates.",
    criticality: "SHOULD",
    rationale: "Phishing attacks can result in unauthorized data disclosure and unauthorized access. Using AI-based phishing detection tools to improve the detection rate of phishing attempts helps reduce the risk of successful phishing attacks.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing", "T1656: Impersonation"],
    resources: [],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft Defender, see the implementation steps for enabling preset security policies which include mailbox intelligence for detecting phishing attacks using AI.`,
    licenseRequirements: "Defender for Office 365 Plan 1 or 2 (included with E5/G5, add-on for E3/G3)",
  },

  // ── Section 12 (cont.): IP Allow Lists — additional automated control ──
  {
    id: "MS.EXO.12.2v1",
    section: "IP Allow Lists",
    sectionNumber: 12,
    title: "Safe lists SHOULD NOT be enabled",
    description: "Safe lists should not be enabled as messages from allowed safe list addresses bypass important security mechanisms.",
    criticality: "SHOULD",
    rationale: "Messages sent from allowed safe list addresses bypass important security mechanisms, including spam filtering and sender authentication checks. Avoiding use of safe lists prevents potential threats from circumventing security mechanisms.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: false,
    notes: ["A connection filter MAY be implemented to create an IP block list."],
    nistMapping: ["AC-4"],
    mitreMapping: [],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/connection-filter-policies-configure"],
    implementation: `1. Sign in to the Microsoft 365 Defender portal.
2. From the left-hand menu, find Email & collaboration and select Policies and Rules.
3. Select Threat Policies from the list of policy names.
4. Under Policies, select Anti-spam.
5. Select Connection filter policy (Default).
6. Click Edit connection filter policy.
7. (Optional) Enter addresses under Always block messages from the following IP addresses or address range as needed.
8. Ensure Turn on safe list is not selected.`,
    licenseRequirements: "N/A",
  },

  // ── Section 14 (cont.): Inbound Anti-Spam — additional manual controls ──
  {
    id: "MS.EXO.14.2v1",
    section: "Inbound Anti-Spam Protections",
    sectionNumber: 14,
    title: "Spam and high confidence spam SHALL be moved to either the junk email folder or the quarantine folder",
    description: "Spam messages must be moved to a separate junk or quarantine folder to prevent users from interacting with potentially malicious content.",
    criticality: "SHALL",
    rationale: "Moving spam messages to a separate junk or quarantine folder helps users filter out spam while still giving them the ability to review messages, as needed, in case a message is filtered incorrectly.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/defender-office-365/anti-spam-policies-configure"],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft Defender, see the implementation steps for enabling preset security policies, which include spam filtering that moves high confidence spam to either the junk or quarantine folder.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.14.3v1",
    section: "Inbound Anti-Spam Protections",
    sectionNumber: 14,
    title: "Allowed domains SHALL NOT be added to inbound anti-spam protection policies",
    description: "Allowed domains must not be added to anti-spam policies as this allows a large number of potentially unknown users to bypass spam protections.",
    criticality: "SHALL",
    rationale: "Legitimate emails may be incorrectly filtered by spam protections. Adding allowed senders is an acceptable method of combating false positives. However, allowing an entire domain provides for a large number of potentially unknown users to bypass spam protections.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: ["Allowed senders MAY be added."],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/defender-office-365/anti-spam-policies-configure"],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft Defender, see the implementation steps for enabling preset security policies, which do not include any allowed sender domains by default.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.14.4v1",
    section: "Inbound Anti-Spam Protections",
    sectionNumber: 14,
    title: "If a third-party filtering solution is used, it SHOULD offer services comparable to the native spam filtering offered by Microsoft",
    description: "Any alternative spam filtering product should offer comparable services to Microsoft's native spam filtering.",
    criticality: "SHOULD",
    rationale: "Filtering out spam reduces user workload burden, prevents junk mail congestion, and reduces potentially malicious content exposure.",
    lastModified: "May 2024",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/defender-office-365/anti-spam-policies-configure"],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft Defender, see the implementation steps for enabling preset security policies, which include spam filtering.`,
    licenseRequirements: "N/A",
  },

  // ── Section 15: Link Protection ──
  {
    id: "MS.EXO.15.1v1",
    section: "Link Protection",
    sectionNumber: 15,
    title: "URL comparison with a block-list SHOULD be enabled",
    description: "Emails should be scanned for URLs that match a known block-list of malicious sites.",
    criticality: "SHOULD",
    rationale: "Users may be directed to malicious websites via links in email. Blocking access to known, malicious URLs can prevent users from accessing known malicious websites.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3"],
    mitreMapping: ["T1566: Phishing", "T1566.002: Spearphishing Link"],
    resources: [],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft Defender for Office 365, see the implementation steps for enabling preset security policies, which include Safe Links protections to scan URLs in email messages against a list of known, malicious links.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.15.2v1",
    section: "Link Protection",
    sectionNumber: 15,
    title: "Direct download links SHOULD be scanned for malware",
    description: "URLs in emails that point to downloadable files should be scanned in real-time for known malware.",
    criticality: "SHOULD",
    rationale: "URLs in emails may direct users to download and run malware. Scanning direct download links in real-time for known malware and blocking access can prevent users from infecting their devices.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3"],
    mitreMapping: ["T1566: Phishing", "T1566.002: Spearphishing Link"],
    resources: [],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft Defender for Office 365, see the implementation steps for enabling preset security policies, which include Safe Links protections to scan links to files for malware.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.15.3v1",
    section: "Link Protection",
    sectionNumber: 15,
    title: "User click tracking SHOULD be enabled",
    description: "Click tracking should be enabled so that agencies can identify when users click on malicious links.",
    criticality: "SHOULD",
    rationale: "Users may click on malicious links in emails, leading to compromise or unauthorized data disclosure. Enabling user click tracking lets agencies know if a malicious link may have been visited after the fact to help tailor a response to a potential incident.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3", "AU-12c"],
    mitreMapping: ["T1566: Phishing", "T1566.002: Spearphishing Link"],
    resources: [],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft Defender for Office 365, see the implementation steps for enabling preset security policies, which include Safe Links click protections to track user clicks on links in email.`,
    licenseRequirements: "N/A",
  },

  // ── Section 16: Alerts ──
  {
    id: "MS.EXO.16.1v1",
    section: "Alerts",
    sectionNumber: 16,
    title: "At a minimum, the required alerts SHALL be enabled",
    description: "The following alerts must be enabled: Suspicious email sending patterns detected, Suspicious Connector Activity, Suspicious Email Forwarding Activity, Messages have been delayed, Tenant restricted from sending unprovisioned email, Tenant restricted from sending email, and A potentially malicious URL click was detected.",
    criticality: "SHALL",
    rationale: "Potentially malicious or service impacting events may go undetected without a means of detecting these events. Setting up a mechanism to alert administrators to these events draws attention to them to help minimize impact to users and the agency.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-4(5)"],
    mitreMapping: ["T1078: Valid Accounts", "T1078.004: Cloud Accounts", "T1562: Impair Defenses", "T1566: Phishing", "T1566.002: Spearphishing Link"],
    resources: [],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft 365 alert policies, see the implementation steps for enabling alerts in the Defender baseline for additional guidance. Ensure the following alerts are enabled:\n- Suspicious email sending patterns detected\n- Suspicious Connector Activity\n- Suspicious Email Forwarding Activity\n- Messages have been delayed\n- Tenant restricted from sending unprovisioned email\n- Tenant restricted from sending email\n- A potentially malicious URL click was detected`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.16.2v1",
    section: "Alerts",
    sectionNumber: 16,
    title: "The alerts SHOULD be sent to a monitored address or incorporated into a SIEM system",
    description: "Alerts should be directed to a monitored email address or integrated into a security information and event management (SIEM) system for timely response.",
    criticality: "SHOULD",
    rationale: "Suspicious or malicious events, if not resolved promptly, may have a greater impact to users and the agency. Sending alerts to a monitored email address or SIEM system helps ensure these events are acted upon in a timely manner.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-4(12)"],
    mitreMapping: ["T1562: Impair Defenses", "T1562.006: Indicator Blocking"],
    resources: [],
    implementation: `Any product meeting the requirements outlined in this baseline policy may be used. If the agency uses Microsoft 365 alert policies, see the implementation steps to add email recipients to an alert in the Defender baseline for additional guidance.`,
    licenseRequirements: "N/A",
  },

  // ── Section 17: Audit Logging ──
  {
    id: "MS.EXO.17.1v1",
    section: "Audit Logging",
    sectionNumber: 17,
    title: "Unified Audit logging SHALL be enabled",
    description: "Unified Audit logging must be enabled to capture user and admin activities across Microsoft 365 services.",
    criticality: "SHALL",
    rationale: "Responding to incidents without detailed information about activities that took place slows response actions. Enabling Unified Audit logging helps ensure agencies have visibility into user actions. Furthermore, enabling the Unified Audit log is required for government agencies by OMB M-21-31.",
    lastModified: "March 2025",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["AU-12"],
    mitreMapping: ["T1562: Impair Defenses", "T1562.008: Disable or Modify Cloud Logs"],
    resources: ["https://learn.microsoft.com/en-us/purview/audit-log-export-records"],
    implementation: `See the implementation steps for enabling Unified Audit logging in the Defender baseline for additional guidance.\n1. Sign in to the Microsoft Purview compliance portal.\n2. Navigate to Audit.\n3. If auditing is not enabled, click 'Start recording user and admin activity'.\n4. Alternatively, use PowerShell: Set-AdminAuditLogConfig -UnifiedAuditLogIngestionEnabled $true`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.EXO.17.3v1",
    section: "Audit Logging",
    sectionNumber: 17,
    title: "Audit logs SHALL be maintained for at least the minimum duration dictated by OMB M-21-31",
    description: "Audit logs must be retained for at least 12 months in active storage and 18 months in cold storage per OMB M-21-31, Appendix C.",
    criticality: "SHALL",
    rationale: "Increased log retention time gives an agency the necessary visibility to investigate incidents that occurred some time ago. OMB M-21-31, Appendix C, Table 5 specifically calls out Unified Audit Logs in the Cloud Azure log category.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: ["Microsoft 365 Purview (Premium) provides a default audit log retention policy retaining records for one year. Additional record types require custom audit retention policies. Agencies may also consider alternate storage locations."],
    nistMapping: ["AU-11"],
    mitreMapping: ["T1070: Indicator Removal", "T1562: Impair Defenses", "T1562.008: Disable or Modify Cloud Logs"],
    resources: [
      "https://learn.microsoft.com/en-us/purview/audit-log-retention-policies",
      "https://learn.microsoft.com/en-us/purview/audit-log-export-records",
    ],
    implementation: `See the implementation steps to create an audit retention policy in the Defender baseline for additional guidance.\n1. Sign in to the Microsoft Purview compliance portal.\n2. Navigate to Audit > Audit retention policies.\n3. Create a new retention policy to retain logs for at least 12 months.\n4. Ensure logs are also exported to cold storage for an additional 18 months if required.`,
    licenseRequirements: "Microsoft 365 Audit (Premium) — E5/G5 license or E3/G3 with add-on compliance license",
  },
];

// ══════════════════════════════════════════════════════════════
// MICROSOFT DEFENDER BASELINE CONTROLS
// Source: https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/defender.md
// ══════════════════════════════════════════════════════════════

export const DEFENDER_SECTIONS: Record<number, string> = {
  1: "Preset Security Profiles",
  2: "Impersonation Protection",
  3: "Safe Attachments",
  4: "Data Loss Prevention",
  5: "Alerts",
  6: "Audit Logging",
};

export const DEFENDER_BASELINE_CONTROLS: BaselineControl[] = [
  {
    id: "MS.DEFENDER.1.1v1",
    section: "Preset Security Profiles",
    sectionNumber: 1,
    title: "The standard preset security policy SHALL be enabled",
    description: "The standard protection preset security policy should be enabled and applied to all users.",
    criticality: "SHALL",
    rationale: "Preset security policies provide a baseline of protection that is managed and updated by Microsoft.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3", "SI-8"],
    mitreMapping: ["T1566: Phishing", "T1566.001: Spearphishing Attachment"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/preset-security-policies"],
    implementation: `1. Sign in to the Microsoft 365 Defender portal.
2. Navigate to Email & collaboration > Policies & rules > Threat policies > Preset security policies.
3. Under Standard protection, click Manage protection settings.
4. Apply to all recipients.
5. Click Confirm.`,
    licenseRequirements: "Microsoft Defender for Office 365 Plan 1",
  },
  {
    id: "MS.DEFENDER.1.2v1",
    section: "Preset Security Profiles",
    sectionNumber: 1,
    title: "The strict preset security policy SHALL be enabled for high-risk users",
    description: "The strict protection preset security policy should be enabled for priority accounts and high-risk users.",
    criticality: "SHALL",
    rationale: "Strict protection provides enhanced security for users who are high-value targets such as executives.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3", "SI-8"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/preset-security-policies"],
    implementation: `1. In the Microsoft 365 Defender portal, navigate to Preset security policies.
2. Under Strict protection, click Manage protection settings.
3. Apply to specific groups containing high-risk or priority users.
4. Click Confirm.`,
    licenseRequirements: "Microsoft Defender for Office 365 Plan 1",
  },
  {
    id: "MS.DEFENDER.1.3v1",
    section: "Preset Security Profiles",
    sectionNumber: 1,
    title: "All users SHALL be added to Defender for Office 365 protection in either the standard or strict preset security policy",
    description: "All users must be included in Defender for Office 365 protection via either the standard or strict preset security policy to ensure secure defaults are applied.",
    criticality: "SHALL",
    rationale: "Important user protections are provided by Defender for Office 365 protection, including safe attachments and safe links. By using the preset policies, administrators can help ensure all new and existing users have secure defaults applied automatically.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [],
    nistMapping: ["CM-6a", "SI-3a", "SI-8"],
    mitreMapping: [
      "T1566: Phishing",
      "T1566.001: Spearphishing Attachment",
      "T1566.002: Spearphishing Link",
      "T1566.003: Spearphishing via Service",
    ],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/preset-security-policies"],
    implementation: `1. Sign in to Microsoft 365 Defender.
2. Go to Email & Collaboration > Policies & Rules > Threat Policies > Preset Security Policies.
3. Under Standard or Strict protection, select Manage protection settings.
4. On the Apply Defender for Office 365 protection page, select All recipients.
5. Click Next until the Review page, then Confirm.`,
    licenseRequirements: "Defender for Office 365 Plan 1 or 2",
  },
  {
    id: "MS.DEFENDER.1.4v1",
    section: "Preset Security Profiles",
    sectionNumber: 1,
    title: "Sensitive accounts SHALL be added to Exchange Online Protection in the strict preset security policy",
    description: "Sensitive accounts must be included in the strict preset security policy for Exchange Online Protection to mitigate their elevated risk to email threats.",
    criticality: "SHALL",
    rationale: "Unauthorized access to a sensitive account may result in greater harm than a standard user account. Adding sensitive accounts to the strict preset security policy better mitigates their elevated risk to email threats.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [],
    nistMapping: ["CM-6a", "SI-3a", "SI-8"],
    mitreMapping: [
      "T1566: Phishing",
      "T1566.001: Spearphishing Attachment",
      "T1566.002: Spearphishing Link",
    ],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/preset-security-policies"],
    implementation: `1. Sign in to Microsoft 365 Defender.
2. Go to Email & Collaboration > Policies & Rules > Threat Policies > Preset Security Policies.
3. Under Strict protection, select Manage protection settings.
4. On the Apply Exchange Online Protection page, select Specific recipients.
5. Add all sensitive accounts via the User and Group boxes.
6. Click Next until the Review page, then Confirm.`,
    licenseRequirements: "Defender for Office 365 Plan 1 or 2",
  },
  {
    id: "MS.DEFENDER.1.5v1",
    section: "Preset Security Profiles",
    sectionNumber: 1,
    title: "Sensitive accounts SHALL be added to Defender for Office 365 protection in the strict preset security policy",
    description: "Sensitive accounts must be included in the strict preset security policy for Defender for Office 365 protection to mitigate their elevated risk.",
    criticality: "SHALL",
    rationale: "Unauthorized access to a sensitive account may result in greater harm than to a standard user account. Adding sensitive accounts to the strict preset security policy better mitigates their elevated risk.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [],
    nistMapping: ["CM-6a", "SI-3a", "SI-8"],
    mitreMapping: [
      "T1566: Phishing",
      "T1566.001: Spearphishing Attachment",
      "T1566.002: Spearphishing Link",
    ],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/preset-security-policies"],
    implementation: `1. Sign in to Microsoft 365 Defender.
2. Go to Email & Collaboration > Policies & Rules > Threat Policies > Preset Security Policies.
3. Under Strict protection, select Manage protection settings.
4. Navigate to the Apply Defender for Office 365 protection page.
5. Select Specific recipients or Previously selected recipients if already set on the EOP page.
6. Add all sensitive accounts.
7. Click Next until the Review page, then Confirm.`,
    licenseRequirements: "Defender for Office 365 Plan 1 or 2",
  },
  {
    id: "MS.DEFENDER.2.1v1",
    section: "Safe Links",
    sectionNumber: 2,
    title: "Safe Links SHALL be enabled for email messages",
    description: "URL detonation via Safe Links must be enabled for all email messages.",
    criticality: "SHALL",
    rationale: "Safe Links provides time-of-click protection against malicious URLs in email messages.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3", "SI-8"],
    mitreMapping: ["T1566.002: Spearphishing Link", "T1204.001: Malicious Link"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about"],
    implementation: `1. Sign in to the Microsoft 365 Defender portal.
2. Navigate to Policies & rules > Threat policies > Safe Links.
3. Edit the default policy or create a new policy.
4. Under Protection settings, enable Safe Links checks for email messages.
5. Enable 'Apply real-time URL scanning for suspicious links and links that point to files'.`,
    licenseRequirements: "Microsoft Defender for Office 365 Plan 1",
  },
  {
    id: "MS.DEFENDER.2.2v1",
    section: "Safe Links",
    sectionNumber: 2,
    title: "Safe Links SHALL be enabled for Microsoft Teams",
    description: "Safe Links protection should be extended to URLs shared in Microsoft Teams.",
    criticality: "SHALL",
    rationale: "Teams is a common vector for sharing links. Safe Links protection helps users avoid clicking malicious URLs.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3"],
    mitreMapping: ["T1566.002: Spearphishing Link"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about"],
    implementation: `1. In the Safe Links policy, enable Safe Links checks for Microsoft Teams.`,
    licenseRequirements: "Microsoft Defender for Office 365 Plan 1",
  },
  {
    id: "MS.DEFENDER.2.3v1",
    section: "Safe Links",
    sectionNumber: 2,
    title: "Safe Links SHALL be enabled for Office 365 apps",
    description: "Safe Links protection should be enabled for Office 365 applications including Word, Excel, and PowerPoint.",
    criticality: "SHALL",
    rationale: "Users may open malicious links from within Office documents. Safe Links provides protection in Office apps.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3"],
    mitreMapping: ["T1566.001: Spearphishing Attachment", "T1204.001: Malicious Link"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about"],
    implementation: `1. In the Safe Links policy, enable Safe Links checks for Office 365 applications.`,
    licenseRequirements: "Microsoft Defender for Office 365 Plan 1",
  },
  {
    id: "MS.DEFENDER.3.1v1",
    section: "Safe Attachments",
    sectionNumber: 3,
    title: "Safe Attachments SHALL be enabled for email",
    description: "Safe Attachments provides sandboxing of email attachments to detect and block malicious files.",
    criticality: "SHALL",
    rationale: "Safe Attachments detonates attachment files in a sandbox environment to detect malware that evades signature-based detection.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3"],
    mitreMapping: ["T1566.001: Spearphishing Attachment"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-attachments-about"],
    implementation: `1. Sign in to the Microsoft 365 Defender portal.
2. Navigate to Policies & rules > Threat policies > Safe Attachments.
3. Edit the default policy or create a new policy.
4. Set the action to Block messages with detected malware.
5. Enable redirect to send blocked messages to a security admin mailbox for review.`,
    licenseRequirements: "Microsoft Defender for Office 365 Plan 1",
  },
  {
    id: "MS.DEFENDER.3.2v1",
    section: "Safe Attachments",
    sectionNumber: 3,
    title: "Safe Attachments SHALL be enabled for SharePoint, OneDrive, and Teams",
    description: "Safe Attachments should be enabled for files in SharePoint, OneDrive, and Teams.",
    criticality: "SHALL",
    rationale: "Extending Safe Attachments to SharePoint, OneDrive, and Teams protects against malware in shared files.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3"],
    mitreMapping: ["T1566.001: Spearphishing Attachment"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-attachments-for-spo-odfb-teams-about"],
    implementation: `1. In the Microsoft 365 Defender portal, navigate to Safe Attachments.
2. Click Global settings.
3. Enable 'Turn on Defender for Office 365 for SharePoint, OneDrive, and Microsoft Teams'.`,
    licenseRequirements: "Microsoft Defender for Office 365 Plan 1",
  },
  {
    id: "MS.DEFENDER.4.1v1",
    section: "Anti-Phishing Protections",
    sectionNumber: 4,
    title: "Impersonation protection SHALL be enabled for key agency personnel",
    description: "Anti-phishing impersonation protection should be configured for executives and other key personnel.",
    criticality: "SHALL",
    rationale: "Impersonation attacks target high-profile users. Protecting them reduces business email compromise risk.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing", "T1534: Internal Spearphishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-phishing-policies-about"],
    implementation: `1. In the Microsoft 365 Defender portal, navigate to Anti-phishing policies.
2. Edit the default policy.
3. Enable user impersonation protection and add key users.
4. Enable domain impersonation protection and add agency domains.
5. Enable mailbox intelligence.
6. Set actions to Quarantine for both user and domain impersonation.`,
    licenseRequirements: "Microsoft Defender for Office 365 Plan 1",
  },
  {
    id: "MS.DEFENDER.4.2v1",
    section: "Data Loss Prevention",
    sectionNumber: 4,
    title: "The DLP policy SHOULD be applied to Exchange, OneDrive, SharePoint, Teams chat, and Devices",
    description: "DLP policies should cover all affected M365 service locations and endpoint devices to prevent unauthorized disclosures.",
    criticality: "SHOULD",
    rationale: "Unauthorized disclosures may happen through M365 services or endpoint devices. DLP policies should cover all affected locations to be effective.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SC-7(10)"],
    mitreMapping: [
      "T1567: Exfiltration Over Web Service",
      "T1530: Data from Cloud Storage",
      "T1213: Data from Information Repositories",
    ],
    resources: [],
    implementation: `See MS.DEFENDER.4.1 instructions step 8 for details on enforcing DLP policy in specific M365 service locations.`,
    licenseRequirements: "DLP for Teams requires E5/G5",
  },
  {
    id: "MS.DEFENDER.4.3v1",
    section: "Data Loss Prevention",
    sectionNumber: 4,
    title: "The action for the DLP policy SHOULD be set to block sharing sensitive information with everyone",
    description: "DLP policy actions should block sharing of sensitive information unless explicitly allowed based on agency policies.",
    criticality: "SHOULD",
    rationale: "Access to sensitive information should be prohibited unless explicitly allowed. Specific exemptions can be made based on agency policies and valid business justifications.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3", "SC-7(10)"],
    mitreMapping: [
      "T1567: Exfiltration Over Web Service",
      "T1530: Data from Cloud Storage",
      "T1213: Data from Information Repositories",
    ],
    resources: [],
    implementation: `See MS.DEFENDER.4.1 instructions steps 15-17 for configuring DLP policy to block sharing sensitive information.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.DEFENDER.4.4v1",
    section: "Data Loss Prevention",
    sectionNumber: 4,
    title: "Notifications to inform and educate users on proper use of sensitive information SHOULD be enabled",
    description: "DLP policy notifications should be enabled to educate users about proper handling of sensitive information.",
    criticality: "SHOULD",
    rationale: "Some users may not be aware of agency policies on proper use of sensitive information. Enabling notifications provides positive feedback to users when accessing sensitive information.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["AT-2b"],
    mitreMapping: [],
    resources: [],
    implementation: `See MS.DEFENDER.4.1 instructions steps 18-19 for configuring DLP policy to notify users.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.DEFENDER.4.5v1",
    section: "Data Loss Prevention",
    sectionNumber: 4,
    title: "A list of apps restricted from accessing DLP-protected files SHOULD be defined",
    description: "A list of apps that are restricted from accessing files protected by DLP policies should be defined to prevent unauthorized access on endpoints.",
    criticality: "SHOULD",
    rationale: "Some apps may inappropriately share accessed files or not conform to agency policies for access to sensitive information. Defining a list of those apps makes it possible to use DLP policies to restrict those apps' access to sensitive information on endpoints.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SC-7(10)"],
    mitreMapping: [
      "T1565: Data Manipulation",
      "T1485: Data Destruction",
      "T1530: Data from Cloud Storage",
    ],
    resources: [],
    implementation: `1. Sign in to the Microsoft Purview portal.
2. Go to Settings > Data loss prevention.
3. Go to Endpoint DLP Settings.
4. Go to Restricted apps and app groups.
5. Click Add or edit Restricted Apps.
6. Enter app and executable names to disallow.
7. Go to Unallowed Bluetooth apps.
8. Click Add or edit unallowed Bluetooth apps.
9. Enter app and executable names.`,
    licenseRequirements: "E5 or G5",
  },
  {
    id: "MS.DEFENDER.4.6v1",
    section: "Data Loss Prevention",
    sectionNumber: 4,
    title: "The DLP policy SHOULD include an action to block restricted apps and unwanted Bluetooth applications",
    description: "A DLP policy action should be defined to block access from restricted apps and unwanted Bluetooth applications to prevent unauthorized disclosure.",
    criticality: "SHOULD",
    rationale: "Some apps may inappropriately share accessed files or not conform to agency policies. Defining a DLP policy action to block access from restricted apps prevents unauthorized disclosure.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: ["This action can only be included if at least one device is onboarded to the agency tenant."],
    nistMapping: ["AC-19a"],
    mitreMapping: [
      "T1565: Data Manipulation",
      "T1485: Data Destruction",
      "T1530: Data from Cloud Storage",
      "T1486: Data Encrypted for Impact",
    ],
    resources: [],
    implementation: `1. Sign in to the Microsoft Purview portal.
2. Under Solutions, select Data loss prevention.
3. Select Policies.
4. Find the custom DLP policy and click to select.
5. Select Edit Policy.
6. Navigate to Advanced DLP rules.
7. Select the relevant rule and edit.
8. Under Actions, click Add an action.
9. Choose Audit or restrict activities on device.
10. Check Copy or move using unallowed Bluetooth app and set to Block.
11. Check Access by restricted apps and set to Block.
12. Save and submit.`,
    licenseRequirements: "E5 or G5",
  },
  {
    id: "MS.DEFENDER.5.1v1",
    section: "Inbound Anti-Spam Protections",
    sectionNumber: 5,
    title: "Allowed domains SHALL NOT be added to inbound anti-spam policies",
    description: "Sender domains should not be added to the allowed senders list in anti-spam policies.",
    criticality: "SHALL NOT",
    rationale: "Adding allowed domains bypasses spam filtering, which can be exploited by attackers spoofing those domains.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-8"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/anti-spam-protection-about"],
    implementation: `1. In the Microsoft 365 Defender portal, navigate to Anti-spam policies.
2. Edit each policy.
3. Remove any entries from the Allowed domains list.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.DEFENDER.5.2v1",
    section: "Alerts",
    sectionNumber: 5,
    title: "Alerts SHOULD be sent to a monitored address or incorporated into a SIEM",
    description: "Security alerts should be sent to a monitored email address or incorporated into a SIEM system to ensure timely response to suspicious events.",
    criticality: "SHOULD",
    rationale: "Suspicious or malicious events, if not resolved promptly, may have a greater impact to users and the agency. Sending alerts to a monitored email address or SIEM system helps ensure events are acted upon in a timely manner.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-4(5)"],
    mitreMapping: [
      "T1562: Impair Defenses",
      "T1562.006: Indicator Blocking",
    ],
    resources: [],
    implementation: `1. Sign in to Microsoft 365 Defender.
2. Under Email & collaboration, select Policies & rules.
3. Select Alert Policy.
4. Click the alert policy to modify.
5. Click the pencil icon next to Set your recipients.
6. Check the Opt-In for email notifications box.
7. Add email addresses to the Email recipients text box.
8. Click Next, then Submit.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.DEFENDER.6.1v1",
    section: "Zero-hour Auto Purge",
    sectionNumber: 6,
    title: "Zero-hour auto purge (ZAP) SHALL be enabled",
    description: "ZAP retroactively detects and neutralizes malicious email that has already been delivered to mailboxes.",
    criticality: "SHALL",
    rationale: "ZAP provides a safety net by removing malicious messages that were delivered before they were identified as threats.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3", "SI-8"],
    mitreMapping: ["T1566: Phishing", "T1566.001: Spearphishing Attachment"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/zero-hour-auto-purge"],
    implementation: `1. ZAP is enabled by default in Exchange Online Protection.
2. Verify ZAP is not disabled in any anti-spam or anti-phishing policy.
3. In anti-spam policies, ensure ZAP for spam and ZAP for phishing are both enabled.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.DEFENDER.6.3v1",
    section: "Audit Logging",
    sectionNumber: 6,
    title: "Audit logs SHALL be maintained for at least the minimum duration dictated by OMB M-21-31",
    description: "Audit logs must be retained for at least the minimum duration specified by OMB M-21-31 to ensure sufficient visibility for incident investigation.",
    criticality: "SHALL",
    rationale: "Audit logs may no longer be available when needed if they are not retained for a sufficient time. Increased log retention time gives an agency the necessary visibility to investigate incidents that occurred some time ago.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: ["Purview Audit (Premium) provides a default audit log retention policy retaining certain records for one year. Additional record types require custom audit retention policies."],
    nistMapping: ["AU-11"],
    mitreMapping: ["T1070: Indicator Removal"],
    resources: [],
    implementation: `1. Create one or more custom audit retention policies if the default retention policy is not sufficient.
2. Follow instructions at Microsoft Learn for creating audit log retention policies.
3. Ensure the duration selected is at least one year per OMB M-21-31.`,
    licenseRequirements: "Microsoft Purview Audit (Premium) requires E5/G5 or E3/G3 with add-on compliance licenses",
  },
];

// ══════════════════════════════════════════════════════════════
// POWER PLATFORM BASELINE CONTROLS
// Source: https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/powerplatform.md
// ══════════════════════════════════════════════════════════════

export const POWERPLATFORM_SECTIONS: Record<number, string> = {
  1: "Environment Creation",
  2: "Data Loss Prevention (DLP) Policies",
  3: "Tenant Isolation",
  4: "Power Apps Content Security Policy",
  5: "Power Pages Creation",
  6: "Power Apps Sharing Controls",
};

export const POWERPLATFORM_BASELINE_CONTROLS: BaselineControl[] = [
  {
    id: "MS.POWERPLATFORM.1.1v1",
    section: "Environment Creation",
    sectionNumber: 1,
    title: "The ability to create production and sandbox environments SHALL be restricted to admins",
    description: "Only administrators should be able to create production and sandbox environments to prevent unauthorized resource sprawl.",
    criticality: "SHALL",
    rationale: "Unrestricted environment creation can lead to shadow IT, data sprawl, and lack of governance over organizational data.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-2", "AC-6"],
    mitreMapping: ["T1136: Create Account"],
    resources: ["https://learn.microsoft.com/en-us/power-platform/admin/control-environment-creation"],
    implementation: `1. Sign in to the Power Platform admin center.
2. Navigate to Settings > Tenant settings.
3. Under 'Who can create production and sandbox environments', select 'Only specific admins'.
4. Click Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.POWERPLATFORM.1.2v1",
    section: "Environment Creation",
    sectionNumber: 1,
    title: "The ability to create trial environments SHALL be restricted to admins",
    description: "Only administrators should be able to create trial environments.",
    criticality: "SHALL",
    rationale: "Trial environments can access production data and should be governed with the same rigor as production environments.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-2", "AC-6"],
    mitreMapping: ["T1136: Create Account"],
    resources: ["https://learn.microsoft.com/en-us/power-platform/admin/control-environment-creation"],
    implementation: `1. In the Power Platform admin center, navigate to Settings > Tenant settings.
2. Under 'Who can create trial environments', select 'Only specific admins'.
3. Click Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.POWERPLATFORM.2.1v1",
    section: "Data Loss Prevention (DLP) Policies",
    sectionNumber: 2,
    title: "A DLP policy SHALL be created to restrict connector access in the default environment",
    description: "A Data Loss Prevention policy must be configured to control which connectors can be used together.",
    criticality: "SHALL",
    rationale: "DLP policies prevent data leakage by controlling how connectors can share data between business and non-business services.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-4", "SC-7"],
    mitreMapping: ["T1537: Transfer Data to Cloud Account"],
    resources: ["https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention"],
    implementation: `1. Sign in to the Power Platform admin center.
2. Navigate to Policies > Data policies.
3. Click +New Policy.
4. Classify connectors into Business, Non-Business, and Blocked groups.
5. Apply the policy to the default environment (at minimum).`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.POWERPLATFORM.2.2v1",
    section: "Data Loss Prevention (DLP) Policies",
    sectionNumber: 2,
    title: "A DLP policy SHALL be created to restrict connector access for all environments",
    description: "A tenant-wide DLP policy must govern connector usage across all environments.",
    criticality: "SHALL",
    rationale: "A tenant-wide DLP policy ensures consistent data protection across all environments, not just the default.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-4", "SC-7"],
    mitreMapping: ["T1537: Transfer Data to Cloud Account"],
    resources: ["https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention"],
    implementation: `1. In the Power Platform admin center, navigate to Policies > Data policies.
2. Create or edit a policy that applies to 'All environments' or 'Add multiple environments' to cover all.
3. Configure appropriate connector classifications.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.POWERPLATFORM.2.3v1",
    section: "Data Loss Prevention (DLP) Policies",
    sectionNumber: 2,
    title: "Non-default environments SHOULD have at least one DLP policy affecting them",
    description: "Each non-default environment should be covered by at least one DLP policy.",
    criticality: "SHOULD",
    rationale: "Environments without DLP policies can be used to bypass data protection controls.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-4"],
    mitreMapping: ["T1537: Transfer Data to Cloud Account"],
    resources: ["https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention"],
    implementation: `1. Review all environments in the Power Platform admin center.
2. Ensure each non-default environment is covered by at least one DLP policy.
3. Consider applying a tenant-wide policy that covers all environments.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.POWERPLATFORM.3.1v1",
    section: "Tenant Isolation",
    sectionNumber: 3,
    title: "Power Platform tenant isolation SHALL be enabled",
    description: "Tenant isolation restricts cross-tenant connections and data flows in Power Platform.",
    criticality: "SHALL",
    rationale: "Without tenant isolation, users can establish connections to external tenants, potentially leaking organizational data.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-4", "SC-7"],
    mitreMapping: ["T1537: Transfer Data to Cloud Account"],
    resources: ["https://learn.microsoft.com/en-us/power-platform/admin/cross-tenant-restrictions"],
    implementation: `1. Sign in to the Power Platform admin center.
2. Navigate to Settings > Tenant settings.
3. Enable tenant isolation.
4. Add any approved external tenants to the allowlist as needed.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.POWERPLATFORM.3.2v1",
    section: "Tenant Isolation",
    sectionNumber: 3,
    title: "An inbound/outbound connection allowlist SHOULD be configured",
    description: "A tenant isolation allowlist should be configured to control which external tenants can connect to the Power Platform environment.",
    criticality: "SHOULD",
    rationale: "By default, tenant isolation blocks all external connections. If legitimate cross-tenant connections are needed, they should be explicitly allowed rather than disabling tenant isolation entirely.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: ["This policy only applies if tenant isolation is enabled (MS.POWERPLATFORM.3.1v1)."],
    nistMapping: ["AC-4"],
    mitreMapping: ["T1048: Exfiltration Over Alternative Protocol"],
    resources: ["https://learn.microsoft.com/en-us/power-platform/admin/cross-tenant-restrictions"],
    implementation: `1. Sign in to the Power Platform admin center.
2. Select Policies > Tenant isolation.
3. Set tenant isolation to Enabled (if not already via MS.POWERPLATFORM.3.1).
4. Under Tenant isolation rules, add rules for specific tenants that should be allowed.
5. For each rule, specify the tenant domain or ID and choose the direction (Inbound, Outbound, or Both).
6. Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.POWERPLATFORM.4.1v1",
    section: "Power Apps Content Security Policy",
    sectionNumber: 4,
    title: "Content Security Policy SHALL be enforced for model-driven and canvas apps",
    description: "Content Security Policy (CSP) should be enabled to protect Power Apps from cross-site scripting and injection attacks.",
    criticality: "SHALL",
    rationale: "CSP mitigates cross-site scripting attacks by restricting which scripts and resources can be loaded.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-10"],
    mitreMapping: ["T1059: Command and Scripting Interpreter"],
    resources: ["https://learn.microsoft.com/en-us/power-platform/admin/content-security-policy"],
    implementation: `1. In the Power Platform admin center, navigate to Environments.
2. Select each environment > Settings > Product > Privacy + Security.
3. Enable Content Security Policy.
4. Configure the allowed domains list as needed.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.POWERPLATFORM.5.1v1",
    section: "Power Pages Creation",
    sectionNumber: 5,
    title: "Power Pages creation SHOULD be restricted to admins",
    description: "Only administrators should be allowed to create new Power Pages sites.",
    criticality: "SHOULD",
    rationale: "Power Pages sites are publicly accessible by default. Restricting creation to administrators helps ensure that new sites are created with proper security configurations and oversight.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["CM-2"],
    mitreMapping: ["T1190: Exploit Public-Facing Application"],
    resources: ["https://learn.microsoft.com/en-us/power-pages/admin/admin-roles"],
    implementation: `1. Sign in to the Power Platform admin center.
2. Select Settings > Power Pages settings.
3. Under Who can create Power Pages sites, select Only specific admins.
4. Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.POWERPLATFORM.6.1v1",
    section: "Power Apps Sharing Controls",
    sectionNumber: 6,
    title: "The ability to share Power Apps with the entire organization (Share with Everyone) SHOULD be disabled",
    description: "Power Apps should not be shareable with the entire organization by default to prevent accidental over-sharing.",
    criticality: "SHOULD",
    rationale: "Sharing apps with the entire organization by default can lead to unintended access to apps and their underlying data. Disabling this ensures apps are shared intentionally with specific users or groups.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3"],
    mitreMapping: ["T1078: Valid Accounts"],
    resources: ["https://learn.microsoft.com/en-us/power-platform/admin/settings-privacy-security"],
    implementation: `1. Sign in to the Power Platform admin center.
2. Select Environments and choose the default environment.
3. Select Settings > Product > Privacy + Security.
4. Set Share with Everyone to Off.
5. Save.`,
    licenseRequirements: "N/A",
  },
];

// ══════════════════════════════════════════════════════════════
// SHAREPOINT ONLINE BASELINE CONTROLS
// Source: https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/sharepoint.md
// ══════════════════════════════════════════════════════════════

export const SHAREPOINT_SECTIONS: Record<number, string> = {
  1: "External Sharing",
  2: "Access Control",
  3: "Securing Anyone Links and Verification Code Users",
  4: "Site Creation",
};

export const SHAREPOINT_BASELINE_CONTROLS: BaselineControl[] = [
  {
    id: "MS.SHAREPOINT.1.1v1",
    section: "External Sharing",
    sectionNumber: 1,
    title: "External sharing for SharePoint SHALL be limited to approved domains or disabled",
    description: "External sharing in SharePoint should be restricted to specific approved domains or disabled entirely.",
    criticality: "SHALL",
    rationale: "Unrestricted external sharing can lead to data leakage to unauthorized parties.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3", "AC-4"],
    mitreMapping: ["T1537: Transfer Data to Cloud Account"],
    resources: ["https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off"],
    implementation: `1. Sign in to the SharePoint admin center.
2. Navigate to Policies > Sharing.
3. Under External sharing, set SharePoint to 'Only people in your organization' or limit to specific domains.
4. If external sharing is required, use 'New and existing guests' and add domain restrictions.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.SHAREPOINT.1.2v1",
    section: "External Sharing",
    sectionNumber: 1,
    title: "External sharing for OneDrive SHALL be limited to approved domains or disabled",
    description: "External sharing in OneDrive should be restricted to match or be more restrictive than SharePoint settings.",
    criticality: "SHALL",
    rationale: "OneDrive sharing settings should not be more permissive than SharePoint to maintain consistent data protection.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3", "AC-4"],
    mitreMapping: ["T1537: Transfer Data to Cloud Account"],
    resources: ["https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off"],
    implementation: `1. In the SharePoint admin center, navigate to Policies > Sharing.
2. Under External sharing for OneDrive, set to the same or more restrictive level as SharePoint.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.SHAREPOINT.1.3v1",
    section: "External Sharing",
    sectionNumber: 1,
    title: "Sensitive SharePoint sites SHALL restrict sharing to site owners only",
    description: "Sensitive SharePoint sites should restrict sharing so only site owners can share externally.",
    criticality: "SHALL",
    rationale: "Restricting sharing to site owners provides governance over who can share sensitive data externally.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3"],
    mitreMapping: ["T1537: Transfer Data to Cloud Account"],
    resources: ["https://learn.microsoft.com/en-us/sharepoint/change-external-sharing-site"],
    implementation: `1. For each sensitive site, navigate to the site settings.
2. Under Sharing, select 'Only site owners can share files, folders, and the site'.
3. Apply this consistently across all sites containing sensitive data.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.SHAREPOINT.2.1v1",
    section: "Access Control",
    sectionNumber: 2,
    title: "Expiration timers for 'Anyone' links SHALL be set",
    description: "Anyone links (anonymous access links) must have expiration timers configured.",
    criticality: "SHALL",
    rationale: "Expiration timers ensure anonymous access links do not persist indefinitely, reducing exposure risk.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3"],
    mitreMapping: ["T1537: Transfer Data to Cloud Account"],
    resources: ["https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off"],
    implementation: `1. In the SharePoint admin center, navigate to Policies > Sharing.
2. Under 'Choose expiration and permissions options for Anyone links', enable expiration.
3. Set the expiration to 30 days or less.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.SHAREPOINT.2.2v1",
    section: "Access Control",
    sectionNumber: 2,
    title: "'Anyone' link permissions SHALL be set to View only",
    description: "Anyone links should only permit View access, not Edit access.",
    criticality: "SHALL",
    rationale: "Limiting anonymous links to view-only prevents uncontrolled modification of shared content.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3"],
    mitreMapping: ["T1537: Transfer Data to Cloud Account"],
    resources: ["https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off"],
    implementation: `1. In the SharePoint admin center, navigate to Policies > Sharing.
2. Under 'Anyone link permissions', set Files to 'View' and Folders to 'View'.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.SHAREPOINT.3.1v1",
    section: "Sharing Settings",
    sectionNumber: 3,
    title: "The default sharing link type SHALL be set to 'Specific people'",
    description: "The default sharing link type should be 'Specific people' rather than 'Anyone' or 'Organization'.",
    criticality: "SHALL",
    rationale: "Setting the default to Specific people ensures users must consciously choose broader access.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3"],
    mitreMapping: ["T1537: Transfer Data to Cloud Account"],
    resources: ["https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off"],
    implementation: `1. In the SharePoint admin center, navigate to Policies > Sharing.
2. Under 'Default link type', select 'Specific people (only the people the user specifies)'.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.SHAREPOINT.3.2v1",
    section: "Sharing Settings",
    sectionNumber: 3,
    title: "Default link permissions SHALL be set to View",
    description: "The default permissions for new sharing links should be set to View rather than Edit.",
    criticality: "SHALL",
    rationale: "Defaulting to view permissions ensures least-privilege access when sharing files.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3", "AC-6"],
    mitreMapping: ["T1537: Transfer Data to Cloud Account"],
    resources: ["https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off"],
    implementation: `1. In the SharePoint admin center, navigate to Policies > Sharing.
2. Under 'Default link permissions', select 'View'.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.SHAREPOINT.3.3v1",
    section: "Securing Anyone Links and Verification Code Users",
    sectionNumber: 3,
    title: "Reauthentication for verification code users SHALL be required after 30 days or less",
    description: "External users who use verification codes to access shared content must re-authenticate within 30 days.",
    criticality: "SHALL",
    rationale: "Verification code users are external users who access shared content without a Microsoft account. Requiring reauthentication limits the window of access, reducing risk if a code is compromised.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [],
    nistMapping: ["AC-12"],
    mitreMapping: ["T1550: Use Alternate Authentication Material"],
    resources: ["https://learn.microsoft.com/en-us/sharepoint/turn-external-sharing-on-or-off"],
    implementation: `1. Sign in to the SharePoint admin center.
2. Under Policies, select Sharing.
3. Expand More external sharing settings.
4. Check People who use a verification code must reauthenticate after this many days.
5. Set the value to 30 or less.
6. Click Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.SHAREPOINT.4.1v1",
    section: "Site Creation",
    sectionNumber: 4,
    title: "Users SHALL be prevented from running custom scripts on self-service sites",
    description: "Custom script execution on user-created sites should be disabled to prevent malicious code execution.",
    criticality: "SHALL",
    rationale: "Custom scripts can introduce security vulnerabilities and malicious code into SharePoint sites.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["CM-7"],
    mitreMapping: ["T1059: Command and Scripting Interpreter"],
    resources: ["https://learn.microsoft.com/en-us/sharepoint/allow-or-prevent-custom-script"],
    implementation: `1. In the SharePoint admin center, navigate to Settings > Site creation.
2. Under Custom Script, select 'Prevent users from running custom script on self-service created sites'.
3. Click Save.`,
    licenseRequirements: "N/A",
  },
];

// ══════════════════════════════════════════════════════════════
// MICROSOFT TEAMS BASELINE CONTROLS
// Source: https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/teams.md
// ══════════════════════════════════════════════════════════════

export const TEAMS_SECTIONS: Record<number, string> = {
  1: "Meeting Policies",
  2: "External User Access",
  4: "Teams Email Integration",
  5: "App Management",
  6: "Data Loss Prevention",
  7: "Malware Scanning",
  8: "Link Protection",
};

export const TEAMS_BASELINE_CONTROLS: BaselineControl[] = [
  {
    id: "MS.TEAMS.1.1v1",
    section: "External Access",
    sectionNumber: 1,
    title: "External access SHALL only be enabled on a per-domain basis",
    description: "External access (federation) should be restricted to specific domains rather than open to all.",
    criticality: "SHALL",
    rationale: "Unrestricted external access allows communication with any external Teams tenant, increasing phishing and social engineering risk.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3", "AC-4"],
    mitreMapping: ["T1566: Phishing", "T1534: Internal Spearphishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoftteams/manage-external-access"],
    implementation: `1. Sign in to the Microsoft Teams admin center.
2. Navigate to Users > External access.
3. Select 'Allow only specific external domains'.
4. Add only approved external domains.
5. Click Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.TEAMS.1.2v1",
    section: "External Access",
    sectionNumber: 1,
    title: "Unmanaged users SHALL NOT be enabled to initiate contact with internal users",
    description: "Users from unmanaged (non-Teams) environments should not be able to initiate contact.",
    criticality: "SHALL NOT",
    rationale: "Unmanaged users bypass organizational security controls and could be used for social engineering.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoftteams/manage-external-access"],
    implementation: `1. In the Teams admin center, navigate to External access.
2. Under 'Users in unmanaged Teams accounts', disable the option.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.TEAMS.1.3v1",
    section: "External Access",
    sectionNumber: 1,
    title: "Skype users SHALL NOT be enabled to initiate contact with internal users",
    description: "Communication with Skype users should be disabled as Skype is a legacy platform with reduced security.",
    criticality: "SHALL NOT",
    rationale: "Skype for Consumer does not have the same security controls as Teams. Disabling reduces attack surface.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoftteams/manage-external-access"],
    implementation: `1. In the Teams admin center, navigate to External access.
2. Under 'Skype users', disable the toggle.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.TEAMS.1.4v1",
    section: "Meeting Policies",
    sectionNumber: 1,
    title: "Anonymous users SHOULD NOT be enabled to start meetings",
    description: "Anonymous users should not be allowed to start meetings in Teams.",
    criticality: "SHOULD",
    rationale: "In some cases, allowing anonymous users to start meetings is a feature used to host large public events. However, for most agencies, this represents a security risk as anonymous users would be able to start meetings without an authenticated user present.",
    lastModified: "December 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3"],
    mitreMapping: ["T1562: Impair Defenses"],
    resources: ["https://learn.microsoft.com/en-us/microsoftteams/meeting-settings-in-teams"],
    implementation: `1. Sign in to the Microsoft Teams admin center.
2. Select Meetings > Meeting settings.
3. Under the Participants section, set Anonymous users can join a meeting to On.
4. Set Anonymous users and dial-in callers can start a meeting to Off.
5. Click Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.TEAMS.1.5v1",
    section: "Meeting Policies",
    sectionNumber: 1,
    title: "Anonymous users SHALL NOT be enabled to join meetings",
    description: "Anonymous users should not be permitted to join Teams meetings at all.",
    criticality: "SHALL",
    rationale: "Anonymous access can be exploited for unauthorized meeting access. Restricting anonymous access provides additional security by requiring authentication before joining meetings.",
    lastModified: "December 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: true,
    notes: [],
    nistMapping: ["AC-3"],
    mitreMapping: ["T1562: Impair Defenses"],
    resources: ["https://learn.microsoft.com/en-us/microsoftteams/meeting-settings-in-teams"],
    implementation: `1. Sign in to the Microsoft Teams admin center.
2. Select Meetings > Meeting settings.
3. Under the Participants section, set Anonymous users can join a meeting to Off.
4. Click Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.TEAMS.1.6v1",
    section: "Meeting Policies",
    sectionNumber: 1,
    title: "Per-meeting meeting organizer controls over anonymous access SHOULD be enabled",
    description: "Meeting organizers should be able to override global anonymous access settings on a per-meeting basis.",
    criticality: "SHOULD",
    rationale: "Some meetings may require anonymous access for legitimate business purposes. Enabling per-meeting controls allows organizers to selectively allow anonymous access while maintaining a secure default.",
    lastModified: "December 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3"],
    mitreMapping: ["T1562: Impair Defenses"],
    resources: ["https://learn.microsoft.com/en-us/microsoftteams/meeting-settings-in-teams"],
    implementation: `1. Sign in to the Microsoft Teams admin center.
2. Select Meetings > Meeting settings.
3. Under the Participants section, ensure Anonymous users can join a meeting is On.
4. Set Meeting organizers can override to allow anonymous users to join meetings to On.
5. Click Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.TEAMS.1.7v2",
    section: "Meeting Policies",
    sectionNumber: 1,
    title: "Only users who are in the organizer's organization SHOULD be able to bypass the meeting lobby",
    description: "External and anonymous users should wait in the lobby and be manually admitted by meeting organizers.",
    criticality: "SHOULD",
    rationale: "Allowing external or anonymous users to bypass the lobby reduces the organizer's ability to control who enters meetings. This setting gives the organizer the ability to vet attendees before admitting them.",
    lastModified: "December 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3"],
    mitreMapping: ["T1562: Impair Defenses"],
    resources: ["https://learn.microsoft.com/en-us/microsoftteams/who-can-bypass-meeting-lobby"],
    implementation: `1. Sign in to the Microsoft Teams admin center.
2. Select Meetings > Meeting policies.
3. Select the Global (Org-wide default) policy.
4. Under Meeting join & lobby, set Who can bypass the lobby to People in my org.
5. Click Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.TEAMS.2.1v1",
    section: "Guest Access",
    sectionNumber: 2,
    title: "Guest access SHOULD only be enabled on a per-user basis",
    description: "Guest access in Teams should be controlled on a per-user basis rather than enabled broadly.",
    criticality: "SHOULD",
    rationale: "Per-user guest access control allows fine-grained governance over who can invite guests.",
    lastModified: "June 2023",
    checkType: "Manual",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3", "AC-6"],
    mitreMapping: ["T1078: Valid Accounts"],
    resources: ["https://learn.microsoft.com/en-us/microsoftteams/guest-access"],
    implementation: `1. In the Teams admin center, navigate to Users > Guest access.
2. Review the guest access settings.
3. Use Entra ID conditional access policies to control guest access on a per-user or group basis.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.TEAMS.2.2v2",
    section: "External User Access",
    sectionNumber: 2,
    title: "Unmanaged users SHALL NOT be enabled to initiate contact with internal users",
    description: "Teams users not managed by an organization should not be able to initiate contact with internal users.",
    criticality: "SHALL",
    rationale: "Allowing unmanaged users to initiate contact with internal users provides a potential vector for phishing and social engineering attacks.",
    lastModified: "December 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [],
    nistMapping: ["AC-3"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoftteams/manage-external-access"],
    implementation: `1. Sign in to the Microsoft Teams admin center.
2. Select Users > External access.
3. Under Teams accounts not managed by an organization, uncheck People in my org can communicate with Teams users whose accounts aren't managed by an organization.
4. Click Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.TEAMS.2.3v2",
    section: "External User Access",
    sectionNumber: 2,
    title: "Internal users SHOULD NOT be enabled to initiate contact with Skype users",
    description: "Internal Teams users should not be able to communicate with Skype consumer users.",
    criticality: "SHOULD",
    rationale: "Skype presents a largely uncontrolled channel for communication that could be exploited for phishing, data exfiltration, or social engineering.",
    lastModified: "December 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoftteams/manage-external-access"],
    implementation: `1. Sign in to the Microsoft Teams admin center.
2. Select Users > External access.
3. Under Skype users, uncheck Allow users in my organization to communicate with Skype users.
4. Click Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.TEAMS.3.1v1",
    section: "Meeting Policies",
    sectionNumber: 3,
    title: "Anonymous users SHALL NOT be enabled to start meetings",
    description: "Anonymous users should not be able to start Teams meetings without an authenticated user present.",
    criticality: "SHALL NOT",
    rationale: "Allowing anonymous users to start meetings can lead to unauthorized use of organizational resources.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3"],
    mitreMapping: ["T1078: Valid Accounts"],
    resources: ["https://learn.microsoft.com/en-us/microsoftteams/meeting-settings-in-teams"],
    implementation: `1. In the Teams admin center, navigate to Meetings > Meeting policies.
2. Edit the Global (default) policy.
3. Under Participants & guests, set 'Let anonymous people start a meeting' to Off.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.TEAMS.3.2v1",
    section: "Meeting Policies",
    sectionNumber: 3,
    title: "Anonymous users SHOULD NOT be enabled to join meetings",
    description: "Anonymous meeting join should be restricted to reduce the risk of unauthorized meeting access.",
    criticality: "SHOULD NOT",
    rationale: "Anonymous meeting access could allow unauthorized individuals to eavesdrop on sensitive discussions.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-3"],
    mitreMapping: ["T1040: Network Sniffing"],
    resources: ["https://learn.microsoft.com/en-us/microsoftteams/meeting-settings-in-teams"],
    implementation: `1. In the Teams admin center, navigate to Meetings > Meeting settings.
2. Under Participants, set 'Anonymous users can join a meeting' to Off.
3. If anonymous access is required for specific scenarios, use per-organizer meeting policies.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.TEAMS.4.1v1",
    section: "Messaging Policies",
    sectionNumber: 4,
    title: "Users SHALL be able to report security concerns in Teams messages",
    description: "The ability to report security concerns in Teams messages should be enabled.",
    criticality: "SHALL",
    rationale: "Allowing users to report suspicious messages helps security teams identify phishing and social engineering attacks.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["IR-6"],
    mitreMapping: ["T1566: Phishing"],
    resources: ["https://learn.microsoft.com/en-us/microsoftteams/messaging-policies-in-teams"],
    implementation: `1. In the Teams admin center, navigate to Messaging policies.
2. Edit the Global (default) policy.
3. Enable 'Report a security concern'.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.TEAMS.5.1v1",
    section: "App Policies",
    sectionNumber: 5,
    title: "Unmanaged apps SHALL be restricted",
    description: "Third-party and custom apps should be restricted to only those approved by the organization.",
    criticality: "SHALL",
    rationale: "Unmanaged apps can access organizational data. Restricting them reduces the risk of data leakage.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["CM-7"],
    mitreMapping: ["T1195: Supply Chain Compromise"],
    resources: ["https://learn.microsoft.com/en-us/microsoftteams/manage-apps"],
    implementation: `1. In the Teams admin center, navigate to Teams apps > Permission policies.
2. Edit the Global (default) policy.
3. Under Third-party apps, select 'Block all apps' or 'Allow specific apps and block all others'.
4. Under Custom apps, apply the same restrictions.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.TEAMS.5.2v1",
    section: "App Policies",
    sectionNumber: 5,
    title: "Installed apps SHALL be approved by an admin",
    description: "Only admin-approved apps should be able to be installed in Teams.",
    criticality: "SHALL",
    rationale: "Admin-approved app installation ensures only vetted applications have access to organizational data.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["CM-7"],
    mitreMapping: ["T1195: Supply Chain Compromise"],
    resources: ["https://learn.microsoft.com/en-us/microsoftteams/manage-apps"],
    implementation: `1. In the Teams admin center, navigate to Teams apps > Setup policies.
2. Edit the Global (default) policy.
3. Under Installed apps, only add admin-approved apps.
4. Disable 'Allow user pinning'.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.TEAMS.5.3v2",
    section: "App Management",
    sectionNumber: 5,
    title: "Default org-wide app settings SHALL be configured to not allow third-party or custom apps",
    description: "Third-party and custom apps should not be installed by default in Teams.",
    criticality: "SHALL",
    rationale: "Third-party and custom apps may not have the same security assurances as first-party Microsoft applications. Disabling by default and selectively enabling ensures only vetted apps are available.",
    lastModified: "December 2023",
    checkType: "Automated",
    configurable: false,
    bod2501: true,
    notes: [],
    nistMapping: ["CM-7(5)(b)"],
    mitreMapping: ["T1195: Supply Chain Compromise", "T1195.002: Compromise Software Supply Chain"],
    resources: ["https://learn.microsoft.com/en-us/microsoftteams/manage-apps"],
    implementation: `1. Sign in to the Microsoft Teams admin center.
2. Select Teams apps > Manage apps.
3. Select Org-wide app settings.
4. Under Third-party apps, uncheck Allow third-party apps.
5. Under Custom apps, uncheck Allow interaction with custom apps.
6. Click Save.`,
    licenseRequirements: "N/A",
  },
  {
    id: "MS.TEAMS.6.1v1",
    section: "Data Loss Prevention",
    sectionNumber: 6,
    title: "DLP policies SHALL be enabled for Teams chat and channel messages",
    description: "Data Loss Prevention policies should cover Teams chat and channel messages to prevent data leakage.",
    criticality: "SHALL",
    rationale: "Teams is a primary communication channel. DLP policies help prevent accidental or intentional sharing of sensitive data.",
    lastModified: "June 2023",
    checkType: "Automated",
    configurable: true,
    bod2501: false,
    notes: [],
    nistMapping: ["AC-4", "SC-7"],
    mitreMapping: ["T1530: Data from Cloud Storage"],
    resources: ["https://learn.microsoft.com/en-us/purview/dlp-microsoft-teams"],
    implementation: `1. Sign in to the Microsoft Purview compliance portal.
2. Navigate to Data loss prevention > Policies.
3. Create or edit a DLP policy.
4. Under Locations, enable Teams chat and channel messages.
5. Configure rules to detect and protect sensitive information types.`,
    licenseRequirements: "Microsoft 365 E5 or equivalent",
  },
  {
    id: "MS.TEAMS.6.2v1",
    section: "Data Loss Prevention",
    sectionNumber: 6,
    title: "The DLP solution SHALL protect PII and sensitive information, as defined by the agency",
    description: "A DLP solution should be configured to detect and protect personally identifiable information and other sensitive data in Teams.",
    criticality: "SHALL",
    rationale: "Sensitive information may be inadvertently shared through Teams. DLP policies help detect and prevent the sharing of sensitive information.",
    lastModified: "December 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SC-28"],
    mitreMapping: ["T1567: Exfiltration Over Web Service"],
    resources: ["https://learn.microsoft.com/en-us/purview/dlp-microsoft-teams"],
    implementation: `1. Identify PII and sensitive information types as defined by the agency.
2. Sign in to the Microsoft Purview portal.
3. Under Solutions, select Data loss prevention.
4. Select Policies and create or edit a policy that covers Microsoft Teams.
5. Configure rules to detect and protect the identified information types.
6. Apply the policy.`,
    licenseRequirements: "E5 or G5 licensing, or E3/G3 with add-on compliance licenses",
  },
  {
    id: "MS.TEAMS.7.1v1",
    section: "Malware Scanning",
    sectionNumber: 7,
    title: "Attachments included with Teams messages SHOULD be scanned for malware",
    description: "Malware scanning should be enabled for files shared through Teams channels and chats.",
    criticality: "SHOULD",
    rationale: "Malware may be shared through Teams messages. Scanning attachments helps detect and prevent malware from spreading within the organization.",
    lastModified: "December 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3a", "SI-8"],
    mitreMapping: ["T1566.001: Spearphishing Attachment"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-attachments-for-spo-odfb-teams-about"],
    implementation: `1. Sign in to the Microsoft Defender portal.
2. Select Email & collaboration > Policies & rules > Threat policies.
3. Select Safe Attachments.
4. Select Global settings.
5. Set Turn on Defender for Office 365 for SharePoint, OneDrive, and Microsoft Teams to On.
6. Click Save.`,
    licenseRequirements: "Defender for Office 365 Plan 1 or Plan 2",
  },
  {
    id: "MS.TEAMS.7.2v1",
    section: "Malware Scanning",
    sectionNumber: 7,
    title: "Users SHOULD be prevented from opening or downloading files detected as malware",
    description: "Users should not be able to open or download files that have been detected as malware in Teams.",
    criticality: "SHOULD",
    rationale: "Even with scanning enabled, if users are able to open flagged files, the protection is not effective. Blocking access to flagged files ensures the malware is not spread.",
    lastModified: "December 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-3a", "SI-8"],
    mitreMapping: ["T1204: User Execution", "T1204.002: Malicious File"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-attachments-for-spo-odfb-teams-configure"],
    implementation: `This item is partially implemented by MS.TEAMS.7.1. Additionally, use the SharePoint Online Management Shell:
1. Connect-SPOService.
2. Set-SPOTenant -DisallowInfectedFileDownload $true.
This prevents users from opening or downloading files detected as malicious.`,
    licenseRequirements: "Defender for Office 365 Plan 1 or Plan 2",
  },
  {
    id: "MS.TEAMS.8.1v1",
    section: "Link Protection",
    sectionNumber: 8,
    title: "URL comparison with a block list SHOULD be enabled",
    description: "Safe Links should be configured in Teams to compare clicked URLs against a list of known malicious links.",
    criticality: "SHOULD",
    rationale: "URLs sent in Teams messages may be malicious. Comparing URLs against a block list detects known malicious links before users can navigate to them.",
    lastModified: "December 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SC-7"],
    mitreMapping: ["T1566.002: Spearphishing Link"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about"],
    implementation: `1. Sign in to Microsoft Defender.
2. Select Email & collaboration > Policies & rules > Threat policies.
3. Select Safe Links.
4. Edit or create a Safe Links policy.
5. Under URL & click tracking settings, set On: Safe Links checks a list of known, malicious links when users click links in Microsoft Teams to On.
6. Click Save.`,
    licenseRequirements: "Defender for Office 365 Plan 1 or Plan 2",
  },
  {
    id: "MS.TEAMS.8.2v1",
    section: "Link Protection",
    sectionNumber: 8,
    title: "User click tracking SHOULD be enabled",
    description: "Safe Links should be configured to track user clicks on URLs in Teams messages for security monitoring.",
    criticality: "SHOULD",
    rationale: "Tracking user clicks on links provides visibility into potentially malicious link activity and helps identify compromised accounts or targeted phishing campaigns.",
    lastModified: "December 2023",
    checkType: "Manual",
    configurable: false,
    bod2501: false,
    notes: [],
    nistMapping: ["SI-4"],
    mitreMapping: ["T1566.002: Spearphishing Link", "T1204.001: Malicious Link"],
    resources: ["https://learn.microsoft.com/en-us/microsoft-365/security/office-365-security/safe-links-about"],
    implementation: `1. Sign in to Microsoft Defender.
2. Select Email & collaboration > Policies & rules > Threat policies.
3. Select Safe Links.
4. Edit the Safe Links policy.
5. Under URL & click tracking settings, ensure Track user clicks is On and Let users click through to the original URL is Off.
6. Click Save.`,
    licenseRequirements: "Defender for Office 365 Plan 1 or Plan 2",
  },
];

// ══════════════════════════════════════════════════════════════
// ALL BASELINE CONTROLS (combined)
// ══════════════════════════════════════════════════════════════

export const ALL_BASELINE_CONTROLS: BaselineControl[] = [
  ...AAD_BASELINE_CONTROLS,
  ...EXO_BASELINE_CONTROLS,
  ...DEFENDER_BASELINE_CONTROLS,
  ...POWERPLATFORM_BASELINE_CONTROLS,
  ...SHAREPOINT_BASELINE_CONTROLS,
  ...TEAMS_BASELINE_CONTROLS,
];

/**
 * Get all controls for a specific section (across all products)
 */
export function getControlsBySection(
  sectionNumber: number
): BaselineControl[] {
  return ALL_BASELINE_CONTROLS.filter(
    (c) => c.sectionNumber === sectionNumber
  );
}

/**
 * Get a specific control by ID (searches all products)
 */
export function getControlById(
  controlId: string
): BaselineControl | undefined {
  return ALL_BASELINE_CONTROLS.find(
    (c) => c.id.toLowerCase() === controlId.toLowerCase()
  );
}

/**
 * Search controls by keyword in title, description, rationale, or implementation (all products)
 */
export function searchControls(query: string): BaselineControl[] {
  const lowerQuery = query.toLowerCase();
  return ALL_BASELINE_CONTROLS.filter(
    (c) =>
      c.title.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.rationale.toLowerCase().includes(lowerQuery) ||
      c.implementation.toLowerCase().includes(lowerQuery) ||
      c.id.toLowerCase().includes(lowerQuery) ||
      c.section.toLowerCase().includes(lowerQuery)
  );
}
