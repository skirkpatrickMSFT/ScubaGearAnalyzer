#!/usr/bin/env node
/**
 * Regenerates `src/shared/baseline-data.generated.ts` from the CISA ScubaGear
 * baseline markdown at a pinned release tag.
 *
 *   node scripts/generate-baselines.mjs [--tag v2.0.0] [--check] [--strict]
 *                                       [--since v1.5.0] [--no-history]
 *
 * Besides the current control data, the generator walks every stable release from
 * `--since` up to the target tag, diffs consecutive releases, and writes
 * `baseline-changes.generated.ts` so the chat can explain what changed between versions.
 *
 * Products are discovered from the upstream `baselines/` directory and keyed by
 * the policy IDs inside each file, so renames (e.g. DEFENDER -> SECURITYSUITE in
 * ScubaGear 2.0) and brand-new products are picked up without code changes.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHARED = join(ROOT, 'src', 'shared');
const OUT_TS = join(SHARED, 'baseline-data.generated.ts');
const OUT_JSON = join(ROOT, 'scubagear-version.json');
const OVERRIDES = join(SHARED, 'baseline-overrides.json');

const REPO = 'cisagov/ScubaGear';
const API = `https://api.github.com/repos/${REPO}`;
const RAW = `https://raw.githubusercontent.com/${REPO}`;

// Upstream has moved these before; try in order so a 2.0 reorg does not break us.
const BASELINE_DIRS = [
  'PowerShell/ScubaGear/baselines',
  'PowerShell/ScubaGear/Baselines',
  'baselines',
];
const REGO_DIRS = ['PowerShell/ScubaGear/Rego', 'Rego'];

const SKIP_FILES = new Set(['removedpolicies.md', 'readme.md', 'index.md']);

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};

// ── HTTP ────────────────────────────────────────────────────
const headers = { 'User-Agent': 'scubagear-analyzer-baseline-generator' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function getJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  return res.json();
}

async function getText(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  return res.text();
}

async function listDir(tag, candidates, ext) {
  for (const dir of candidates) {
    try {
      const entries = await getJson(`${API}/contents/${dir}?ref=${tag}`);
      const hits = entries.filter((e) => e.type === 'file' && e.name.toLowerCase().endsWith(ext));
      if (hits.length) return { dir, files: hits.map((e) => e.name) };
    } catch {
      /* try next candidate */
    }
  }
  return { dir: null, files: [] };
}

async function resolveTag() {
  const explicit = opt('--tag');
  if (explicit) return explicit;
  // --check validates against the pinned tag so builds stay deterministic;
  // only an explicit generate goes looking for a newer release.
  if (flag('--check') && existsSync(OUT_JSON)) {
    const pinned = JSON.parse(await readFile(OUT_JSON, 'utf8'));
    if (pinned.tag) return pinned.tag;
  }
  const rel = await getJson(`${API}/releases/latest`);
  return rel.tag_name;
}

// ── Markdown helpers ────────────────────────────────────────
const POLICY_ID = /MS\.[A-Z0-9]+\.\d+\.\d+v\d+/;
const SECTION_RE = /^##\s+(\d+)\.\s+(.+?)\s*$/;
const POLICY_RE = new RegExp(`^####\\s+(${POLICY_ID.source})\\s*$`);
const INSTR_RE = new RegExp(`^####\\s+(${POLICY_ID.source})\\s+Instructions\\s*$`);
const COMMENT_RE = new RegExp(
  `<!--\\s*Policy:\\s*(${POLICY_ID.source})\\s*;\\s*Criticality:\\s*(SHALL NOT|SHOULD NOT|SHALL|SHOULD)\\s*-->`,
);
const EXCLUSION_RE = /<!--\s*ExclusionType:\s*([A-Za-z]+)\s*-->/;
const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
// ScubaGear 2.0 marks each policy with shield badges, e.g.
// [![Automated Check](https://img.shields.io/badge/Automated_Check-5E9732)](#key-terminology)
const BADGE_LINE_RE = /^\s*\[!\[[^\]]*\]\([^)]*img\.shields\.io\/badge\/[^)]*\)\]\([^)]*\)\s*$/;
const BADGE_NAME_RE = /img\.shields\.io\/badge\/(.+?)-[0-9A-Fa-f]{6}\)/;

/** Maps a badge image name to the indicator it represents. */
const INDICATORS = {
  'BOD 25-01 Requirement': 'bod2501',
  'Automated Check': 'automated',
  Manual: 'manual',
  Configurable: 'configurable',
  'Requires Configuration': 'requiresConfiguration',
};

function parseIndicators(lines) {
  const found = {
    bod2501: false,
    automated: false,
    manual: false,
    configurable: false,
    requiresConfiguration: false,
  };
  let any = false;
  for (const line of lines) {
    if (!BADGE_LINE_RE.test(line)) continue;
    const raw = line.match(BADGE_NAME_RE)?.[1];
    if (!raw) continue;
    const key = INDICATORS[raw.replace(/--/g, '-').replace(/_/g, ' ')];
    if (key) {
      found[key] = true;
      any = true;
    }
  }
  return any ? found : null;
}

function stripMd(s = '') {
  return s
    .replace(LINK_RE, '$1')
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectLinks(s = '') {
  const out = [];
  for (const m of s.matchAll(LINK_RE)) if (!out.includes(m[2])) out.push(m[2]);
  return out;
}

/** Splits a policy body into its `- _Field:_ value` bullets, keeping nested children. */
function parseFields(body) {
  const fields = [];
  let cur = null;
  for (const raw of body.split('\n')) {
    const top = raw.match(/^-\s+_?([A-Za-z][^:_]*?)_?\s*:_?\s*(.*)$/);
    if (top && !/^\s{2,}/.test(raw)) {
      cur = { name: top[1].trim().toLowerCase(), value: top[2].trim(), children: [] };
      fields.push(cur);
      continue;
    }
    if (!cur) continue;
    if (/^\s{2,}[-*]\s+/.test(raw)) cur.children.push(raw.trim().replace(/^[-*]\s+/, ''));
    else if (raw.trim()) cur.value += ` ${raw.trim()}`;
  }
  return fields;
}

const fieldValue = (fields, ...names) => {
  for (const n of names) {
    const f = fields.find((x) => x.name === n || x.name.startsWith(n));
    if (f) return f.value;
  }
  return '';
};

function mitreFrom(fields) {
  const f = fields.find((x) => x.name.startsWith('mitre'));
  if (!f) return [];
  const src = [f.value, ...f.children].join('\n');
  const out = [];
  for (const m of src.matchAll(/\[?(T\d{4}(?:\.\d{3})?):\s*([^\]\n(]+)/g)) {
    const entry = `${m[1]}: ${m[2].trim()}`;
    if (!out.includes(entry)) out.push(entry);
  }
  return out;
}

function nistFrom(fields) {
  const v = fieldValue(fields, 'nist sp 800-53', 'nist');
  if (!v || /^none$/i.test(v)) return [];
  return stripMd(v)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !/^none$/i.test(s));
}

function displayNameFrom(md, product) {
  const h1 = md.match(/^#\s+CISA\s+M365\s+Secure\s+Configuration\s+Baseline\s+for\s+(.+)$/m);
  return h1 ? stripMd(h1[1]).replace(/\s+and OneDrive$/i, '') : product;
}

// ── Per-file parser ─────────────────────────────────────────
// Historical releases carry upstream typos we cannot fix; only warn for the target tag.
let quietParse = false;
function parseBaseline(md) {
  const lines = md.split(/\r?\n/);
  const sections = {};
  const perSection = {};
  const controls = new Map();
  const instructions = new Map();

  let sectionNum = 0;
  let sectionName = '';
  let mode = null;
  let current = null;
  let buffer = [];

  function finalizePolicy(id, body) {
    const text = body.join('\n');
    const m = text.match(COMMENT_RE);
    if (!m) return;
    if (m[1] !== id && !quietParse) {
      console.warn(`  [warn] ${id}: policy comment says ${m[1]} (upstream inconsistency)`);
    }
    const head = text.slice(0, text.indexOf('<!--')).split('\n');
    // Badges normally precede the policy marker but some policies place them after it.
    const indicators = parseIndicators(text.split('\n'));
    const requirement = stripMd(head.filter((l) => !BADGE_LINE_RE.test(l)).join('\n'));
    // The first paragraph is the policy statement; later paragraphs are explanatory guidance.
    // A trailing colon means the statement continues into a list, so keep everything then.
    const paragraphs = head
      .filter((l) => !BADGE_LINE_RE.test(l))
      .join('\n')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    const statement = paragraphs.length && !/:\s*$/.test(paragraphs[0]) ? stripMd(paragraphs[0]) : requirement;
    const fields = parseFields(text.slice(text.indexOf('-->') + 3));

    let criticality = m[2];
    if (criticality === 'SHALL' && /\bSHALL NOT\b/.test(statement)) criticality = 'SHALL NOT';
    if (criticality === 'SHOULD' && /\bSHOULD NOT\b/.test(statement)) criticality = 'SHOULD NOT';

    const notes = fields
      .filter((f) => f.name === 'note' || f.name === 'notes')
      .map((f) => stripMd(f.value))
      .filter(Boolean);

    controls.set(id, {
      id,
      section: sectionName,
      sectionNumber: sectionNum,
      title: statement,
      description: requirement,
      criticality,
      rationale: stripMd(fieldValue(fields, 'rationale')),
      lastModified: stripMd(fieldValue(fields, 'last modified')) || 'Unknown',
      notes,
      nistMapping: nistFrom(fields),
      mitreMapping: mitreFrom(fields),
      exclusionType: text.match(EXCLUSION_RE)?.[1] ?? null,
      indicators,
    });
  }

  const flush = () => {
    if (mode === 'policy' && current) finalizePolicy(current, buffer);
    else if (mode === 'instructions' && current) instructions.set(current, buffer.join('\n').trim());
    else if (mode === 'resources' && sectionNum) {
      perSection[sectionNum] ??= {};
      perSection[sectionNum].resources = collectLinks(buffer.join('\n'));
    } else if (mode === 'license' && sectionNum) {
      perSection[sectionNum] ??= {};
      const t = stripMd(buffer.join(' ').replace(/^\s*-\s*/gm, ''));
      perSection[sectionNum].license = t || 'N/A';
    }
    buffer = [];
  };

  for (const line of lines) {
    let m;
    if ((m = line.match(SECTION_RE))) {
      flush();
      mode = null;
      current = null;
      sectionNum = Number(m[1]);
      sectionName = stripMd(m[2]);
      sections[sectionNum] = sectionName;
      continue;
    }
    if (/^###\s+Resources\s*$/i.test(line)) { flush(); mode = 'resources'; continue; }
    if (/^###\s+License\s+Requirements\s*$/i.test(line)) { flush(); mode = 'license'; continue; }
    if ((m = line.match(INSTR_RE))) { flush(); mode = 'instructions'; current = m[1]; continue; }
    if ((m = line.match(POLICY_RE))) { flush(); mode = 'policy'; current = m[1]; continue; }
    if (/^#{1,4}\s/.test(line)) { flush(); mode = null; current = null; continue; }
    if (mode) buffer.push(line);
  }
  flush();

  for (const c of controls.values()) {
    const s = perSection[c.sectionNumber] ?? {};
    c.resources = s.resources ?? [];
    c.licenseRequirements = s.license ?? 'N/A';
    c.implementation = instructions.get(c.id) ?? '';
  }

  return { sections, controls: [...controls.values()] };
}

// ── Emit ────────────────────────────────────────────────────
const j = (v) => JSON.stringify(v);

function emit({ tag, version, products, aliases }) {
  const L = [];
  L.push('/* eslint-disable */');
  L.push('// AUTO-GENERATED FILE — DO NOT EDIT BY HAND.');
  L.push(`// Source: ${REPO} @ ${tag}`);
  L.push('// Regenerate with: npm run baselines:generate');
  L.push('');
  L.push("import type { BaselineControl } from './baseline-types.js';");
  L.push('');
  L.push(`export const SCUBAGEAR_BASELINE_VERSION = ${j(version)};`);
  L.push(`export const SCUBAGEAR_BASELINE_TAG = ${j(tag)};`);
  L.push('');

  for (const p of products) {
    L.push(`export const ${p.key}_SECTIONS: Record<number, string> = ${j(p.sections)};`);
    L.push('');
    L.push(`export const ${p.key}_BASELINE_CONTROLS: BaselineControl[] = [`);
    for (const c of p.controls) {
      L.push('  {');
      L.push(`    id: ${j(c.id)},`);
      L.push(`    product: ${j(p.key)},`);
      L.push(`    section: ${j(c.section)},`);
      L.push(`    sectionNumber: ${c.sectionNumber},`);
      L.push(`    title: ${j(c.title)},`);
      L.push(`    description: ${j(c.description)},`);
      L.push(`    criticality: ${j(c.criticality)},`);
      L.push(`    rationale: ${j(c.rationale)},`);
      L.push(`    lastModified: ${j(c.lastModified)},`);
      L.push(`    checkType: ${j(c.checkType)},`);
      L.push(`    configurable: ${c.configurable},`);
      L.push(`    requiresConfiguration: ${c.requiresConfiguration},`);
      L.push(`    bod2501: ${c.bod2501},`);
      L.push(`    exclusionType: ${j(c.exclusionType)},`);
      L.push(`    notes: ${j(c.notes)},`);
      L.push(`    nistMapping: ${j(c.nistMapping)},`);
      L.push(`    mitreMapping: ${j(c.mitreMapping)},`);
      L.push(`    resources: ${j(c.resources)},`);
      L.push(`    implementation: ${j(c.implementation)},`);
      L.push(`    licenseRequirements: ${j(c.licenseRequirements)},`);
      L.push('  },');
    }
    L.push('];');
    L.push('');
  }

  L.push(`export const BASELINE_PRODUCTS = ${j(products.map((p) => p.key))} as const;`);
  L.push('');
  L.push('export const PRODUCT_DISPLAY_NAMES: Record<string, string> = {');
  for (const p of products) L.push(`  ${p.key}: ${j(p.displayName)},`);
  L.push('};');
  L.push('');
  L.push('/** Legacy/renamed product keys mapped to the key used by this baseline version. */');
  L.push(`export const PRODUCT_ALIASES: Record<string, string> = ${j(aliases)};`);
  L.push('');
  L.push('export const SECTIONS_BY_PRODUCT: Record<string, Record<number, string>> = {');
  for (const p of products) L.push(`  ${p.key}: ${p.key}_SECTIONS,`);
  L.push('};');
  L.push('');
  L.push('export const CONTROLS_BY_PRODUCT: Record<string, BaselineControl[]> = {');
  for (const p of products) L.push(`  ${p.key}: ${p.key}_BASELINE_CONTROLS,`);
  L.push('};');
  L.push('');
  L.push('export const ALL_BASELINE_CONTROLS: BaselineControl[] = [');
  for (const p of products) L.push(`  ...${p.key}_BASELINE_CONTROLS,`);
  L.push('];');
  return L.join('\n');
}

// ── Release history & change tracking ───────────────────────
const OUT_CHANGES = join(SHARED, 'baseline-changes.generated.ts');
const MIGRATIONS_PATHS = [
  'PowerShell/ScubaGear/mappings/scuba-baseline-policy-migrations.csv',
  'mappings/scuba-baseline-policy-migrations.csv',
];
const REMOVED_PATHS = BASELINE_DIRS.map((d) => `${d}/removedpolicies.md`);
const TRACKED_FIELDS = {
  title: 'requirement',
  criticality: 'criticality',
  rationale: 'rationale',
  implementation: 'implementation',
  notes: 'notes',
  nistMapping: 'nist',
  mitreMapping: 'mitre',
  exclusionType: 'exclusionType',
  section: 'section',
};
const MAX_NOTES_CHARS = 10_000;

const semverOf = (t) => t.replace(/^v/, '').split('.').map(Number);
const cmpSemver = (a, b) => {
  const x = semverOf(a);
  const y = semverOf(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
};
const stemOf = (id) => id.replace(/v\d+$/, '');
const norm = (v) =>
  Array.isArray(v) ? v.map((x) => String(x).replace(/\s+/g, ' ').trim()) : String(v ?? '').replace(/\s+/g, ' ').trim();

async function tryText(url) {
  try {
    return await getText(url);
  } catch {
    return null;
  }
}

/** Minimal RFC 4180 parser — the migration CSV has quoted, multi-line cells. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

function extractBaselineNotes(body = '') {
  const start = body.match(/^##\s+Baselines?(?:\s+Changes)?\s*$/im);
  if (!start) return '';
  const rest = body.slice(start.index + start[0].length);
  const end = rest.search(/^##\s(?!#)/m);
  const section = (end >= 0 ? rest.slice(0, end) : rest).trim();
  return section.length > MAX_NOTES_CHARS ? `${section.slice(0, MAX_NOTES_CHARS)}\n\n[truncated]` : section;
}

async function listReleases(target) {
  const since = opt('--since') ?? 'v1.5.0';
  const all = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await getJson(`${API}/releases?per_page=100&page=${page}`);
    all.push(...batch);
    if (batch.length < 100) break;
  }
  const picked = all.filter(
    (r) =>
      !r.draft &&
      !r.prerelease &&
      /^v\d+\.\d+\.\d+$/.test(r.tag_name) &&
      cmpSemver(r.tag_name, since) >= 0 &&
      cmpSemver(r.tag_name, target) <= 0,
  );
  if (!picked.some((r) => r.tag_name === target)) {
    picked.push(await getJson(`${API}/releases/tags/${target}`));
  }
  picked.sort((a, b) => cmpSemver(a.tag_name, b.tag_name));
  return picked.map((r) => ({
    tag: r.tag_name,
    version: r.tag_name.replace(/^v/, ''),
    publishedAt: r.published_at ?? '',
    url: r.html_url,
    baselineNotes: extractBaselineNotes(r.body ?? ''),
  }));
}

async function loadSnapshot(tag) {
  const md = await listDir(tag, BASELINE_DIRS, '.md');
  if (!md.dir) throw new Error(`No baselines directory at ${tag}`);
  const controls = new Map();
  quietParse = true;
  try {
    for (const file of md.files) {
      if (SKIP_FILES.has(file.toLowerCase())) continue;
      const { controls: parsed } = parseBaseline(await getText(`${RAW}/${tag}/${md.dir}/${file}`));
      for (const c of parsed) controls.set(c.id, { ...c, product: c.id.split('.')[1] });
    }
  } finally {
    quietParse = false;
  }
  return { tag, controls };
}

function expandIds(text, targetControls) {
  const ids = text.match(new RegExp(POLICY_ID.source, 'g')) ?? [];
  if (ids.length === 2 && /\s-\s/.test(text)) {
    const [a, b] = ids.map((id) => id.match(/^MS\.([A-Z0-9]+)\.(\d+)\.(\d+)v\d+$/));
    if (a && b && a[1] === b[1] && a[2] === b[2]) {
      const inRange = [...targetControls.keys()].filter((id) => {
        const m = id.match(/^MS\.([A-Z0-9]+)\.(\d+)\.(\d+)v\d+$/);
        return m && m[1] === a[1] && m[2] === a[2] && +m[3] >= +a[3] && +m[3] <= +b[3];
      });
      if (inRange.length) return inRange;
    }
  }
  return ids;
}

async function loadMigrations(tag, targetControls) {
  for (const p of MIGRATIONS_PATHS) {
    const csv = await tryText(`${RAW}/${tag}/${p}`);
    if (!csv) continue;
    const [header, ...rows] = parseCsv(csv);
    if (!header || !/old id/i.test(header[0])) continue;
    return rows
      .filter((r) => POLICY_ID.test(r[0] ?? ''))
      .map((r) => ({
        oldId: r[0].trim(),
        newIds: expandIds(r[2] ?? '', targetControls),
        rationale: /^n\/?a$/i.test((r[4] ?? '').trim()) ? '' : stripMd(r[4] ?? ''),
      }));
  }
  return [];
}

async function loadRemovedPolicies(tag) {
  for (const p of REMOVED_PATHS) {
    const md = await tryText(`${RAW}/${tag}/${p}`);
    if (!md) continue;
    const out = [];
    let id = null;
    let buf = [];
    const flushRemoved = () => {
      if (!id) return;
      const text = buf.join('\n');
      out.push({
        id,
        product: id.split('.')[1],
        removalDate: stripMd(text.match(/_Removal date:_\s*(.+)/i)?.[1] ?? '') || 'Unknown',
        rationale: stripMd(text.match(/_Removal rationale:_\s*([\s\S]*)$/i)?.[1] ?? ''),
      });
    };
    for (const line of md.split(/\r?\n/)) {
      const m = line.match(new RegExp(`^####\\s+(${POLICY_ID.source})`));
      if (m || /^<\/?details>/i.test(line.trim())) {
        flushRemoved();
        id = m ? m[1] : null;
        buf = [];
      } else if (id) buf.push(line);
    }
    flushRemoved();
    return out;
  }
  return [];
}

function changedFields(a, b) {
  return Object.entries(TRACKED_FIELDS)
    .filter(([k]) => JSON.stringify(norm(a[k])) !== JSON.stringify(norm(b[k])))
    .map(([, label]) => label);
}

function diffSnapshots(from, to) {
  const fromStems = new Map([...from.controls.values()].map((c) => [stemOf(c.id), c]));
  const toStems = new Map([...to.controls.values()].map((c) => [stemOf(c.id), c]));
  const base = { fromVersion: from.tag.replace(/^v/, ''), toVersion: to.tag.replace(/^v/, '') };
  const out = [];

  for (const [stem, b] of toStems) {
    const a = fromStems.get(stem);
    if (!a) {
      out.push({ ...base, type: 'added', controlId: b.id, toId: b.id, product: b.product, criticality: { to: b.criticality }, title: { to: b.title } });
      continue;
    }
    const fields = changedFields(a, b);
    const bumped = a.id !== b.id;
    // Mapping-only updates (NIST/MITRE) don't alter what a control requires or how to fix it.
    const substantive = fields.some((f) => f !== 'nist' && f !== 'mitre');
    if (!bumped && !substantive) continue;
    const entry = {
      ...base,
      type: bumped ? 'versioned' : 'revised',
      controlId: b.id,
      fromId: a.id,
      toId: b.id,
      product: b.product,
      fields: fields.length ? fields : ['version'],
    };
    if (fields.includes('requirement')) entry.title = { from: a.title, to: b.title };
    if (fields.includes('criticality')) entry.criticality = { from: a.criticality, to: b.criticality };
    out.push(entry);
  }
  for (const [stem, a] of fromStems) {
    if (toStems.has(stem)) continue;
    out.push({ ...base, type: 'removed', controlId: a.id, fromId: a.id, product: a.product, criticality: { from: a.criticality }, title: { from: a.title } });
  }
  return out;
}

function applyMigrations(changes, migrations, removed) {
  const byOld = new Map(migrations.map((m) => [m.oldId, m]));
  const removedBy = new Map(removed.map((r) => [r.id, r]));
  const replacesIndex = new Map();
  for (const m of migrations) for (const n of m.newIds) {
    if (stemOf(n) === stemOf(m.oldId)) continue;
    replacesIndex.set(n, [...(replacesIndex.get(n) ?? []), m.oldId]);
  }
  for (const c of changes) {
    if (c.type === 'removed' || c.type === 'versioned') {
      const m = byOld.get(c.fromId);
      if (m) {
        if (c.type === 'removed') c.replacedBy = m.newIds;
        if (m.rationale) c.note = m.rationale;
      }
      const r = removedBy.get(c.fromId);
      if (c.type === 'removed' && r?.rationale && !c.note) c.note = r.rationale;
    } else if (c.type === 'added') {
      const prior = replacesIndex.get(c.toId);
      if (prior) c.replaces = prior;
    }
  }
}

async function buildHistory(target, targetSnapshot) {
  const releases = await listReleases(target);
  console.log(`\nHistory: ${releases.map((r) => r.tag).join(' -> ')}`);

  const snapshots = [];
  for (const r of releases) {
    snapshots.push(r.tag === target ? targetSnapshot : await loadSnapshot(r.tag));
  }

  const migrations = await loadMigrations(target, targetSnapshot.controls);
  const removedPolicies = await loadRemovedPolicies(target);

  const changes = [];
  for (let i = 1; i < snapshots.length; i++) {
    const delta = diffSnapshots(snapshots[i - 1], snapshots[i]);
    applyMigrations(delta, migrations, removedPolicies);
    console.log(`  ${releases[i - 1].tag} -> ${releases[i].tag}: ${delta.length} change(s)`);
    changes.push(...delta);
  }

  // Controls that existed in an earlier release but are gone from the target.
  const targetStems = new Set([...targetSnapshot.controls.keys()].map(stemOf));
  const latestSeen = new Map();
  snapshots.forEach((s, i) => {
    for (const c of s.controls.values()) latestSeen.set(stemOf(c.id), { c, i });
  });
  const legacy = [];
  for (const [stem, { c, i }] of latestSeen) {
    if (targetStems.has(stem)) continue;
    const removal = changes.find((x) => x.type === 'removed' && x.fromId === c.id);
    const policy = removedPolicies.find((r) => r.id === c.id);
    legacy.push({
      id: c.id,
      product: c.product,
      section: c.section,
      sectionNumber: c.sectionNumber,
      title: c.title,
      criticality: c.criticality,
      rationale: c.rationale,
      lastVersion: releases[i].version,
      removedIn: releases[i + 1]?.version ?? null,
      replacedBy: removal?.replacedBy ?? [],
      removalRationale: removal?.note ?? policy?.rationale ?? '',
    });
  }
  legacy.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  return { releases, changes, legacy, removedPolicies, migrations };
}

function emitChanges(target, h) {
  const L = [];
  L.push('/* eslint-disable */');
  L.push('// AUTO-GENERATED FILE — DO NOT EDIT BY HAND.');
  L.push(`// Source: ${REPO} release history up to ${target}`);
  L.push('// Regenerate with: npm run baselines:generate');
  L.push('');
  L.push("import type { BaselineRelease, BaselineChange, LegacyControl, RemovedPolicy } from './baseline-types.js';");
  L.push('');
  L.push(`export const BASELINE_HISTORY_TARGET_TAG = ${j(target)};`);
  L.push('');
  L.push(`export const BASELINE_RELEASES: BaselineRelease[] = ${JSON.stringify(h.releases, null, 2)};`);
  L.push('');
  L.push(`export const BASELINE_CHANGES: BaselineChange[] = ${JSON.stringify(h.changes, null, 2)};`);
  L.push('');
  L.push(`export const LEGACY_CONTROLS: LegacyControl[] = ${JSON.stringify(h.legacy, null, 2)};`);
  L.push('');
  L.push(`export const REMOVED_POLICIES: RemovedPolicy[] = ${JSON.stringify(h.removedPolicies, null, 2)};`);
  return L.join('\n');
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  const tag = await resolveTag();
  const version = tag.replace(/^v/, '');
  console.log(`ScubaGear baseline generator — target ${tag}`);

  const overrides = JSON.parse(await readFile(OVERRIDES, 'utf8'));
  const defaults = overrides.defaults ?? {};
  const bod = new Set(overrides.bod2501 ?? []);
  const forcedManual = new Set(overrides.manual ?? []);
  const forcedAutomated = new Set(overrides.automated ?? []);
  const notConfigurable = new Set(overrides.notConfigurable ?? []);
  const configurable = new Set(overrides.configurable ?? []);

  // Automated-vs-manual is derived from the Rego rules that actually ship.
  const rego = await listDir(tag, REGO_DIRS, '.rego');
  const automatedIds = new Set();
  for (const f of rego.files) {
    const src = await getText(`${RAW}/${tag}/${rego.dir}/${f}`);
    for (const m of src.matchAll(new RegExp(POLICY_ID.source, 'g'))) automatedIds.add(m[0]);
  }
  console.log(`  Rego: ${rego.files.length} files, ${automatedIds.size} automated policy IDs`);

  const md = await listDir(tag, BASELINE_DIRS, '.md');
  if (!md.dir) throw new Error('Could not locate the baselines directory upstream.');

  const products = [];
  const indicatorProducts = new Set();
  for (const file of md.files) {
    if (SKIP_FILES.has(file.toLowerCase())) continue;
    const src = await getText(`${RAW}/${tag}/${md.dir}/${file}`);
    const { sections, controls } = parseBaseline(src);
    if (!controls.length) continue;

    // Every `<!--Policy:` marker upstream must survive parsing, or we lost a control.
    const declared = new Set(
      [...src.matchAll(new RegExp(COMMENT_RE.source, 'g'))].map((m) => m[1]),
    );
    const parsed = new Set(controls.map((c) => c.id));
    const missing = [...declared].filter(
      (id) => !parsed.has(id) && !controls.some((c) => c.id.replace(/v\d+$/, '') === id.replace(/v\d+$/, '')),
    );
    if (missing.length) {
      console.warn(`  [warn] ${file}: ${missing.length} declared policy(s) not parsed: ${missing.join(', ')}`);
      if (flag('--strict')) throw new Error(`Unparsed policies in ${file}`);
    }

    // Product key comes from the policy IDs, not the filename.
    const key = controls[0].id.split('.')[1];
    // 2.0+ documents carry indicator badges, which are authoritative. Older tags fall
    // back to the Rego rules that ship plus baseline-overrides.json.
    if (controls.some((c) => c.indicators)) indicatorProducts.add(key);
    for (const c of controls) {
      const ind = c.indicators;
      const derivedAutomated = forcedAutomated.has(c.id) || automatedIds.has(c.id);
      c.checkType = forcedManual.has(c.id)
        ? 'Manual'
        : ind
          ? ind.manual ? 'Manual' : ind.automated ? 'Automated' : derivedAutomated ? 'Automated' : 'Manual'
          : derivedAutomated ? 'Automated' : 'Manual';
      c.requiresConfiguration = ind?.requiresConfiguration ?? false;
      c.configurable = notConfigurable.has(c.id)
        ? false
        : ind
          ? ind.configurable || ind.requiresConfiguration || c.exclusionType !== null
          : configurable.has(c.id) || c.exclusionType !== null
            ? true
            : (defaults.configurable ?? false);
      c.bod2501 = ind ? ind.bod2501 : bod.has(c.id);
    }

    products.push({
      key,
      file,
      displayName: overrides.productDisplayNames?.[key] ?? displayNameFrom(src, key),
      sections,
      controls,
    });
    console.log(`  ${file.padEnd(22)} -> ${key.padEnd(15)} ${controls.length} controls`);
  }

  products.sort((a, b) => a.key.localeCompare(b.key));

  // Resolve alias groups against the products this version actually ships.
  const present = new Set(products.map((p) => p.key));
  const aliases = {};
  for (const group of overrides.productAliasGroups ?? []) {
    const canonical = group.find((g) => present.has(g)) ?? group[0];
    for (const member of group) if (member !== canonical) aliases[member] = canonical;
  }

  const generatedAt = new Date().toISOString();
  const content = emit({ tag, version, products, aliases });

  const allIds = products.flatMap((p) => p.controls.map((c) => c.id));

  // Warn on overrides that no longer match anything — the early signal for renames.
  // Products whose baseline carries indicator badges no longer consult the overrides.
  const known = new Set(allIds);
  const stale = [
    ...new Set([...bod, ...forcedManual, ...forcedAutomated, ...notConfigurable, ...configurable]),
  ].filter((id) => !known.has(id) && !indicatorProducts.has(id.split('.')[1]) && present.has(id.split('.')[1]));
  if (stale.length) {
    console.warn(`\n  [warn] ${stale.length} override ID(s) not present at ${tag}:`);
    for (const s of stale) console.warn(`         ${s}`);
    if (flag('--strict')) throw new Error('Stale overrides with --strict.');
  }

  if (flag('--check')) {
    const existing = existsSync(OUT_TS) ? await readFile(OUT_TS, 'utf8') : '';
    if (existing.trim() !== content.trim()) {
      console.error(`\nBaseline data is out of date for ${tag}. Run: npm run baselines:generate`);
      process.exit(1);
    }
    const changesFile = existsSync(OUT_CHANGES) ? await readFile(OUT_CHANGES, 'utf8') : '';
    if (!changesFile.includes(`BASELINE_HISTORY_TARGET_TAG = ${j(tag)}`)) {
      console.error(`\nBaseline change history is out of date for ${tag}. Run: npm run baselines:generate`);
      process.exit(1);
    }
    console.log(`\nBaseline data is current for ${tag} (${allIds.length} controls).`);
    return;
  }

  // Build the release history first so a network failure leaves existing files untouched.
  const targetSnapshot = {
    tag,
    controls: new Map(products.flatMap((p) => p.controls.map((c) => [c.id, { ...c, product: p.key }]))),
  };
  const history = flag('--no-history') ? null : await buildHistory(tag, targetSnapshot);

  // Report the ID delta so a large diff stays reviewable.
  let previous = [];
  if (existsSync(OUT_TS)) {
    const prev = await readFile(OUT_TS, 'utf8');
    previous = [...prev.matchAll(/^\s+id: "(MS\.[^"]+)"/gm)].map((m) => m[1]);
  }
  const base = (id) => id.replace(/v\d+$/, '');
  const prevSet = new Set(previous);
  const currSet = new Set(allIds);
  const added = allIds.filter((id) => !prevSet.has(id) && !previous.some((p) => base(p) === base(id)));
  const removed = previous.filter((id) => !currSet.has(id) && !allIds.some((c) => base(c) === base(id)));
  const bumped = allIds
    .filter((id) => !prevSet.has(id))
    .map((id) => ({ to: id, from: previous.find((p) => base(p) === base(id)) }))
    .filter((x) => x.from);

  await mkdir(SHARED, { recursive: true });
  await writeFile(OUT_TS, `${content}\n`, 'utf8');
  if (history) await writeFile(OUT_CHANGES, `${emitChanges(tag, history)}\n`, 'utf8');
  await writeFile(
    OUT_JSON,
    `${JSON.stringify(
      {
        version,
        tag,
        generatedAt,
        controlCount: allIds.length,
        products: products.map((p) => ({ key: p.key, file: p.file, controls: p.controls.length })),
        ...(history && {
          history: {
            releases: history.releases.map((r) => r.tag),
            changeCount: history.changes.length,
            legacyControlCount: history.legacy.length,
          },
        }),
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(`\nWrote ${allIds.length} controls across ${products.length} products.`);
  if (added.length) console.log(`  Added:   ${added.join(', ')}`);
  if (removed.length) console.log(`  Removed: ${removed.join(', ')}`);
  if (bumped.length) console.log(`  Bumped:  ${bumped.map((b) => `${b.from} -> ${b.to}`).join(', ')}`);
  if (!added.length && !removed.length && !bumped.length) console.log('  No control ID changes.');
  if (history) {
    const counts = {};
    for (const c of history.changes) counts[c.type] = (counts[c.type] ?? 0) + 1;
    console.log(
      `  History: ${history.releases.length} releases, ${history.changes.length} recorded changes ` +
        `(${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}), ${history.legacy.length} legacy controls.`,
    );
  }
}

main().catch((err) => {
  // A pre-build check must not break offline or rate-limited builds.
  if (flag('--check') && !flag('--strict')) {
    console.warn(`Baseline check skipped: ${err.message}`);
    process.exit(0);
  }
  console.error(err.message);
  process.exit(1);
});
