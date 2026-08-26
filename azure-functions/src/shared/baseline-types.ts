/**
 * Shape of a single CISA baseline control.
 *
 * Kept separate from `baseline-data.ts` so the generated data file can import
 * the type without a circular reference.
 */
export interface BaselineControl {
  id: string;
  /** Product key parsed from the policy ID, e.g. AAD, EXO, SECURITYSUITE. */
  product: string;
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
  /** ScubaGear config exclusion type declared upstream, e.g. AllowedForwardingDomains. */
  exclusionType: string | null;
  notes: string[];
  nistMapping: string[];
  mitreMapping: string[];
  resources: string[];
  implementation: string;
  licenseRequirements: string;
}
