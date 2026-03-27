#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const skillsDir = path.join(root, 'skills');
const allowed = new Set(['kaneo']);

async function main() {
  let entries;
  try {
    entries = await fs.readdir(skillsDir, { withFileTypes: true });
  } catch {
    console.error(`Scope validation failed: missing directory ${skillsDir}`);
    process.exit(1);
  }

  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (!directories.includes('kaneo')) {
    console.error('Scope validation failed: required directory skills/kaneo is missing.');
    process.exit(1);
  }

  const disallowed = directories.filter((name) => !allowed.has(name));
  if (disallowed.length > 0) {
    console.error('Scope validation failed: this repository is Kaneo-only.');
    for (const name of disallowed) {
      console.error(`- remove unsupported skill directory: skills/${name}`);
    }
    process.exit(1);
  }

  console.log('Scope validation passed.');
}

main();
