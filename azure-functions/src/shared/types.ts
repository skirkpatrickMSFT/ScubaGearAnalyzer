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

/** ScubaGear product identifier */
export type ScubaProduct =
  | 'AAD'
  | 'DEFENDER'
  | 'EXO'
  | 'SHAREPOINT'
  | 'TEAMS'
  | 'POWERPLATFORM'
  | 'POWERBI';

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
  byProduct: Record<ScubaProduct, { total: number; pass: number; fail: number }>;
}

/** Chat message */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
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
