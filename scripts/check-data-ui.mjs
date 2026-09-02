#!/usr/bin/env node
/**
 * Every component root emits an un-hashed `data-ui` part name as its override hook. Names must be
 * unique across packages or a consumer override for one component leaks into another.
 *
 * Scans `packages/<pkg>/src` for:
 *   - literal attributes:  data-ui='button'  /  data-ui="table"
 *   - part tables:         export const PARTS = { root: 'table', … } as const
 * and fails when the same name is declared by more than one package.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const packagesDir = join(root, 'packages');

const LITERAL = /data-ui\s*[=:]\s*['"]([a-z][a-z0-9-]*)['"]/g;
const PARTS_BLOCK = /PARTS\s*=\s*\{([\s\S]*?)\}\s*as const/g;
const PART_VALUE = /:\s*['"]([a-z][a-z0-9-]*)['"]/g;

/** @type {Map<string, Set<string>>} name → packages declaring it */
const owners = new Map();
/** @type {Map<string, string[]>} name → file:line evidence */
const where = new Map();

function record(name, pkg, file) {
  if (!owners.has(name)) owners.set(name, new Set());
  owners.get(name).add(pkg);
  if (!where.has(name)) where.set(name, []);
  where.get(name).push(`${pkg} (${relative(root, file)})`);
}

function walk(dir, visit) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, visit);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry) && !/\.(test|fixtures)\./.test(entry)) visit(path);
  }
}

for (const pkg of readdirSync(packagesDir)) {
  const src = join(packagesDir, pkg, 'src');
  let isDir = false;
  try {
    isDir = statSync(src).isDirectory();
  } catch {
    continue;
  }
  if (!isDir) continue;
  walk(src, (file) => {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(LITERAL)) record(match[1], pkg, file);
    for (const block of text.matchAll(PARTS_BLOCK)) {
      for (const value of block[1].matchAll(PART_VALUE)) record(value[1], pkg, file);
    }
  });
}

const duplicates = [...owners.entries()].filter(([, pkgs]) => pkgs.size > 1);

if (duplicates.length > 0) {
  console.error('Duplicate data-ui part names across packages:\n');
  for (const [name] of duplicates) {
    console.error(`  "${name}"`);
    for (const evidence of new Set(where.get(name))) console.error(`    - ${evidence}`);
  }
  console.error('\nEach data-ui name must belong to exactly one package.');
  process.exit(1);
}

console.info(
  `data-ui: ${owners.size} unique part names across ${new Set([...owners.values()].flatMap((s) => [...s])).size} packages.`
);
