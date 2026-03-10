/**
 * Syncs i18n translation files.
 *
 * Uses `en.json` as the source of truth. For every other locale,
 * adds missing keys with the English value prefixed by "[TRANSLATE] "
 * so they are easy to find and translate later.
 *
 * Usage:  node scripts/sync-i18n.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(__dirname, '..', 'messages');

const SOURCE_LOCALE = 'en';
const TARGET_LOCALES = ['es', 'cs'];
const MISSING_PREFIX = '[TRANSLATE] ';

function flattenKeys(obj, prefix = '') {
  const keys = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      Object.assign(keys, flattenKeys(value, fullKey));
    } else {
      keys[fullKey] = value;
    }
  }
  return keys;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((curr, key) => curr?.[key], obj);
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let curr = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in curr) || typeof curr[keys[i]] !== 'object') {
      curr[keys[i]] = {};
    }
    curr = curr[keys[i]];
  }
  curr[keys[keys.length - 1]] = value;
}

// Load source
const sourcePath = join(messagesDir, `${SOURCE_LOCALE}.json`);
const source = JSON.parse(readFileSync(sourcePath, 'utf-8'));
const sourceKeys = flattenKeys(source);

let totalAdded = 0;

for (const locale of TARGET_LOCALES) {
  const targetPath = join(messagesDir, `${locale}.json`);
  let target;

  try {
    target = JSON.parse(readFileSync(targetPath, 'utf-8'));
  } catch {
    console.log(`  Creating ${locale}.json from scratch`);
    target = {};
  }

  let added = 0;

  for (const [key, value] of Object.entries(sourceKeys)) {
    if (getNestedValue(target, key) === undefined) {
      setNestedValue(target, key, `${MISSING_PREFIX}${value}`);
      added++;
    }
  }

  if (added > 0) {
    writeFileSync(targetPath, JSON.stringify(target, null, 2) + '\n', 'utf-8');
    console.log(`  ${locale}.json: +${added} keys added`);
    totalAdded += added;
  } else {
    console.log(`  ${locale}.json: already in sync`);
  }
}

if (totalAdded > 0) {
  console.log(`\nDone! ${totalAdded} missing key(s) added. Search for "${MISSING_PREFIX}" to find them.`);
} else {
  console.log('\nAll translations are in sync!');
}
