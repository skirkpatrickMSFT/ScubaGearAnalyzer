/**
 * Shared TypeScript types for the ScubaGear Analyzer Azure Functions.
 */

/** Raw entry from ScubaGear TestResults.json */
export interface ScubaGearTestResult {
  ActualValue: unknown;
  Commandlet: string[];
  Criticality: string;
  PolicyId: string;
  ReportDetails: string;
  RequirementMet: boolean;
}

/** Normalised control status */
export type ControlStatus =
  | 'Pass'
  | 'Fail'
  | 'Warning'
  | 'Manual'
  | 'Error'
  | 'Not-Implemented'
  | '3rd Party'
  | 'Omitted'
  | 'Loading';

/** Product keys shipped by current ScubaGear releases. */
export type KnownScubaProduct =
  | 'AAD'
  | 'DEFENDER'
  | 'SECURITYSUITE'
  | 'EXO'
  | 'SHAREPOINT'
  | 'TEAMS'
  | 'POWERPLATFORM'
  | 'POWERBI';

/** Open union so products renamed or added upstream still type-check. */
export type ScubaProduct = KnownScubaProduct | (string & {});

/** Parsed / normalised control for display */
export interface ParsedControl {
  controlId: string;
  product: ScubaProduct;
  section: string;
  status: ControlStatus;
  criticality: string;
  reportDetails: string;
  requirementMet: boolean;
  isOmitted?: boolean;
  omittedEvaluationResult?: string;
  isIncorrectResult?: boolean;
  originalResult?: string;
  comments?: string[];
  resolutionDate?: string | null;
  /** Stringified JSON of the actual tenant configuration value evaluated by Rego (TestResults format only) */
  actualValue?: string;
  /** How this control ID relates to the pinned baseline; set when it is not an exact match. */
  baselineStatus?: 'current' | 'versionDrift' | 'removed' | 'unknown';
  /** Plain-language explanation of the mismatch, e.g. which controls replaced a removed one. */
  baselineNote?: string;
  /** Current-baseline control IDs that took over a removed control's requirement. */
  replacedBy?: string[];
}

/** A control entry from merged ScubaResults JSON */
export interface ScubaResultsControl {
  'Control ID': string;
  Requirement: string;
  Result: string;
  Criticality: string;
  Details: string;
  OmittedEvaluationResult?: string;
  OmittedEvaluationDetails?: string;
  IncorrectResult?: string;
  IncorrectResultDetails?: string;
  OriginalResult?: string;
  OriginalDetails?: string;
  Comments?: string[] | string;
  ResolutionDate?: string | null;
}

/** A group of controls nested under a product in ScubaResults.json */
export interface ScubaResultsGroup {
  GroupName?: string;
  GroupNumber?: number | string;
  Controls: ScubaResultsControl[];
}

/** Summary statistics for a set of controls */
export interface AssessmentSummary {
  total: number;
  pass: number;
  fail: number;
  manual: number;
  thirdParty: number;
  notImplemented: number;
  omitted: number;
  byProduct: Record<string, { total: number; pass: number; fail: number }>;
}

/** Chat message */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/** Approved CAP exclusions from scuba_config */
export interface CapExclusions {
  users: string[];
  groups: string[];
  applications: string[];
  guestUserTypes: string[];
}

/** Privileged-role exclusions from scuba_config (currently MS.AAD.7.4v1). */
export interface RoleExclusions {
  users: string[];
  groups: string[];
}

/** Per-control exclusion config from scuba_config */
export interface ControlExclusionConfig {
  controlId: string;
  capExclusions?: CapExclusions;
  roleExclusions?: RoleExclusions;
}

/**
 * Policy-specific config variables, e.g. Defender SensitiveAccounts or
 * Exo AllowedForwardingDomains. Captured generically so variables added by
 * future ScubaGear releases still surface.
 */
export interface PolicyVariableConfig {
  controlId: string;
  product: string;
  /** Variable name to either a flat list or a named group of lists. */
  variables: Record<string, string[] | Record<string, string[]>>;
}

/** Annotation (false positive) config from scuba_config */
export interface AnnotatePolicyConfig {
  controlId: string;
  incorrectResult: boolean;
  comment: string;
  remediationDate?: string;
}

/** Omission config from scuba_config */
export interface OmitPolicyConfig {
  controlId: string;
  expiration: string;
  rationale: string;
}

/** A privileged user resolved from the Raw data */
export interface PrivilegedUser {
  id: string;
  displayName: string;
  roles: string[];
  onPremisesImmutableId: string | null;
}

/** Classification of what a conditional access policy enforces */
export type CAPCategory =
  | 'phishing-resistant-mfa-all-users'
  | 'mfa-all-users'
  | 'phishing-resistant-mfa-privileged-roles'
  | 'block-legacy-auth'
  | 'block-device-code'
  | 'require-managed-device'
  | 'risk-based'
  | 'other';

/** A conditional access policy from the Raw data */
export interface ConditionalAccessPolicySummary {
  id: string;
  displayName: string;
  state: string;
  excludeUsers: string[];
  excludeGroups: string[];
  includeUsers: string[];
  includeGroups: string[];
  includeRoles: string[];
  grantControls: string[];
  clientAppTypes: string[];
  /** Authentication strength display name (e.g. "Phishing-resistant MFA") */
  authStrengthName: string;
  /** User risk levels the policy applies to */
  userRiskLevels: string[];
  /** Sign-in risk levels the policy applies to */
  signInRiskLevels: string[];
  /** Whether this policy targets device code flow */
  hasDeviceCodeFlowCondition: boolean;
  /** Applications the policy targets ("All", app IDs, or "Office365") */
  includeApps: string[];
  /** Number of applications explicitly excluded */
  excludeAppCount: number;
  /** Computed category for control-to-policy mapping */
  category: CAPCategory;
}

/** Exclusion analysis for a single CAP — shows unapproved exclusions */
export interface CAPExclusionAnalysis {
  policyId: string;
  policyName: string;
  policyState: string;
  policyCategory: CAPCategory;
  excludedUsers: Array<{ id: string; displayName: string; approved: boolean }>;
  excludedGroups: Array<{ id: string; approved: boolean }>;
  unapprovedUserCount: number;
  unapprovedGroupCount: number;
}

/** Full exclusion context extracted from Raw JSON */
export interface ExclusionContext {
  /** Approved exclusions per control from scuba_config */
  approvedExclusions: ControlExclusionConfig[];
  /** Policy-specific configuration variables per control */
  policyVariables: PolicyVariableConfig[];
  /** Annotated (marked false positive) policies */
  annotatedPolicies: AnnotatePolicyConfig[];
  /** Omitted policies */
  omittedPolicies: OmitPolicyConfig[];
  /** Privileged users (GUID → name resolution) */
  privilegedUsers: PrivilegedUser[];
  /** Conditional access policies with their user/group exclusions */
  conditionalAccessPolicies: ConditionalAccessPolicySummary[];
  /** Cross-referenced exclusion analysis per CAP */
  exclusionAnalysis: CAPExclusionAnalysis[];
}

/** Baseline control definition */
export interface BaselineControl {
  id: string;
  section: string;
  sectionNumber: number;
  title: string;
  description: string;
  criticality: 'SHALL' | 'SHALL NOT' | 'SHOULD' | 'SHOULD NOT';
  rationale: string;
  lastModified: string;
  checkType: 'Automated' | 'Manual';
  configurable: boolean;
  bod2501: boolean;
  notes: string[];
  nistMapping: string[];
  mitreMapping: string[];
  resources: string[];
  implementation: string;
  licenseRequirements: string;
}
