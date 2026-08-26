#!/usr/bin/env node
/**
 * Regenerates `src/shared/baseline-data.generated.ts` from the CISA ScubaGear
 * baseline markdown at a pinned release tag.
 *
 *   node scripts/generate-baselines.mjs [--tag v1.8.0] [--check] [--strict]
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
    if (m[1] !== id) {
      console.warn(`  [warn] ${id}: policy comment says ${m[1]} (upstream inconsistency)`);
    }
    const requirement = stripMd(text.slice(0, text.indexOf('<!--')));
    const fields = parseFields(text.slice(text.indexOf('-->') + 3));

    let criticality = m[2];
    if (criticality === 'SHALL' && /\bSHALL NOT\b/.test(requirement)) criticality = 'SHALL NOT';
    if (criticality === 'SHOULD' && /\bSHOULD NOT\b/.test(requirement)) criticality = 'SHOULD NOT';

    const notes = fields
      .filter((f) => f.name === 'note' || f.name === 'notes')
      .map((f) => stripMd(f.value))
      .filter(Boolean);

    controls.set(id, {
      id,
      section: sectionName,
      sectionNumber: sectionNum,
      title: requirement,
      description: requirement,
      criticality,
      rationale: stripMd(fieldValue(fields, 'rationale')),
      lastModified: stripMd(fieldValue(fields, 'last modified')) || 'Unknown',
      notes,
      nistMapping: nistFrom(fields),
      mitreMapping: mitreFrom(fields),
      exclusionType: text.match(EXCLUSION_RE)?.[1] ?? null,
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
    for (const c of controls) {
      c.checkType =
        forcedManual.has(c.id) ? 'Manual'
        : forcedAutomated.has(c.id) || automatedIds.has(c.id) ? 'Automated'
        : 'Manual';
      c.configurable = notConfigurable.has(c.id)
        ? false
        : configurable.has(c.id) || c.exclusionType !== null
          ? true
          : (defaults.configurable ?? false);
      c.bod2501 = bod.has(c.id);
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
  const known = new Set(allIds);
  const stale = [
    ...new Set([...bod, ...forcedManual, ...forcedAutomated, ...notConfigurable, ...configurable]),
  ].filter((id) => !known.has(id));
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
    console.log(`\nBaseline data is current for ${tag} (${allIds.length} controls).`);
    return;
  }

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
  await writeFile(
    OUT_JSON,
    `${JSON.stringify(
      {
        version,
        tag,
        generatedAt,
        controlCount: allIds.length,
        products: products.map((p) => ({ key: p.key, file: p.file, controls: p.controls.length })),
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
