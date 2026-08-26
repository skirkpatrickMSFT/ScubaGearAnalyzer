/**
 * CISA ScubaGear M365 secure configuration baselines.
 *
 * The control data itself lives in `baseline-data.generated.ts`, produced from
 * the upstream markdown by `scripts/generate-baselines.mjs`. Only hand-written
 * helpers belong in this file.
 */

import type { BaselineControl } from './baseline-types.js';
import {
  ALL_BASELINE_CONTROLS,
  CONTROLS_BY_PRODUCT,
  SECTIONS_BY_PRODUCT,
  PRODUCT_ALIASES,
} from './baseline-data.generated.js';

export type { BaselineControl };
export * from './baseline-data.generated.js';

export const HIGHLY_PRIVILEGED_ROLES = [
  'Global Administrator',
  'Privileged Role Administrator',
  'User Administrator',
  'SharePoint Administrator',
  'Exchange Administrator',
  'Hybrid Identity Administrator',
  'Application Administrator',
  'Cloud Application Administrator',
];

/** Resolves a product key across ScubaGear versions that renamed it. */
export function canonicalizeProduct(product: string): string {
  const upper = (product ?? '').toUpperCase();
  return PRODUCT_ALIASES[upper] ?? upper;
}

/** Section names are per-product; falls back to any product defining the number. */
export function getSectionName(sectionNumber: number, product?: string): string | undefined {
  if (product) {
    const key = canonicalizeProduct(product);
    const named = SECTIONS_BY_PRODUCT[key]?.[sectionNumber];
    if (named) return named;
  }
  for (const sections of Object.values(SECTIONS_BY_PRODUCT)) {
    if (sections[sectionNumber]) return sections[sectionNumber];
  }
  return undefined;
}

export function getControlsByProduct(product: string): BaselineControl[] {
  return CONTROLS_BY_PRODUCT[canonicalizeProduct(product)] ?? [];
}

/** Get all controls for a section number, optionally scoped to one product. */
export function getControlsBySection(
  sectionNumber: number,
  product?: string,
): BaselineControl[] {
  const pool = product ? getControlsByProduct(product) : ALL_BASELINE_CONTROLS;
  return pool.filter((c) => c.sectionNumber === sectionNumber);
}

/** Get a control by ID, tolerating version suffix drift (e.g. v1 -> v2). */
export function getControlById(controlId: string): BaselineControl | undefined {
  const wanted = (controlId ?? '').toLowerCase();
  const exact = ALL_BASELINE_CONTROLS.find((c) => c.id.toLowerCase() === wanted);
  if (exact) return exact;

  const stem = wanted.replace(/v\d+$/, '');
  if (!stem) return undefined;
  return ALL_BASELINE_CONTROLS.find((c) => c.id.toLowerCase().replace(/v\d+$/, '') === stem);
}

/** Search controls by keyword across title, description, rationale and implementation. */
export function searchControls(query: string): BaselineControl[] {
  const q = (query ?? '').toLowerCase();
  if (!q) return [];
  return ALL_BASELINE_CONTROLS.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.rationale.toLowerCase().includes(q) ||
      c.implementation.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.section.toLowerCase().includes(q),
  );
}
