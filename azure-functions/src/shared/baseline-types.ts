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
  /** Policy needs values in the ScubaGear config file before it can be evaluated. */
  requiresConfiguration: boolean;
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

/** One stable ScubaGear release that the change history covers. */
export interface BaselineRelease {
  tag: string;
  version: string;
  publishedAt: string;
  url: string;
  /** The "Baselines" section of the upstream release notes (markdown). */
  baselineNotes: string;
}

export type BaselineChangeType = 'added' | 'removed' | 'revised' | 'versioned';

/** A single control-level difference between two consecutive releases. */
export interface BaselineChange {
  type: BaselineChangeType;
  /** ID as of the newer release (or the last release that had it, for removals). */
  controlId: string;
  fromId?: string;
  toId?: string;
  product: string;
  fromVersion: string;
  toVersion: string;
  /** Which parts of the control changed (revised / versioned only). */
  fields?: string[];
  title?: { from?: string; to?: string };
  criticality?: { from?: string; to?: string };
  /** Upstream-declared replacement controls (removed only). */
  replacedBy?: string[];
  /** Controls this one absorbed or replaced (added only). */
  replaces?: string[];
  /** Upstream rationale for a removal, or the reason for a version bump. */
  note?: string;
}

/** A control that existed in an earlier release but is absent from the pinned baseline. */
export interface LegacyControl {
  id: string;
  product: string;
  section: string;
  sectionNumber: number;
  title: string;
  criticality: 'SHALL' | 'SHALL NOT' | 'SHOULD' | 'SHOULD NOT';
  rationale: string;
  lastVersion: string;
  removedIn: string | null;
  replacedBy: string[];
  removalRationale: string;
}

/** Entry from upstream removedpolicies.md. */
export interface RemovedPolicy {
  id: string;
  product: string;
  removalDate: string;
  rationale: string;
}
