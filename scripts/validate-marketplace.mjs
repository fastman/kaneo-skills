#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function isSafeRelativePath(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  if (path.isAbsolute(value)) return false;
  const normalized = path.posix.normalize(value.replace(/\\/g, '/'));
  return !normalized.startsWith('../') && normalized !== '..';
}

async function readJson(filePath, label) {
  let raw;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch {
    fail(`${label} not found: ${filePath}`);
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(`${label} must be a non-empty string`);
    return false;
  }
  return true;
}

async function main() {
  const manifestPath = path.join(repoRoot, '.claude-plugin', 'marketplace.json');
  const manifest = await readJson(manifestPath, 'Marketplace manifest');
  if (!manifest) return finish();

  requireString(manifest.name, 'marketplace.name');

  if (!manifest.owner || typeof manifest.owner !== 'object') {
    fail('marketplace.owner is required');
  } else {
    requireString(manifest.owner.name, 'marketplace.owner.name');
    requireString(manifest.owner.email, 'marketplace.owner.email');
  }

  if (!Array.isArray(manifest.plugins) || manifest.plugins.length === 0) {
    fail('marketplace.plugins must be a non-empty array');
    return finish();
  }

  const seenNames = new Set();

  for (const [index, plugin] of manifest.plugins.entries()) {
    const tag = `marketplace.plugins[${index}]`;

    if (!plugin || typeof plugin !== 'object') {
      fail(`${tag} must be an object`);
      continue;
    }

    if (requireString(plugin.name, `${tag}.name`)) {
      if (seenNames.has(plugin.name)) {
        fail(`${tag}.name duplicates another plugin name: ${plugin.name}`);
      }
      seenNames.add(plugin.name);
    }

    if (!requireString(plugin.source, `${tag}.source`)) {
      continue;
    }

    if (!isSafeRelativePath(plugin.source)) {
      fail(`${tag}.source must be a safe relative path: ${plugin.source}`);
      continue;
    }

    const sourceDir = path.resolve(repoRoot, plugin.source);
    if (!(await exists(sourceDir))) {
      fail(`${tag}.source points to missing path: ${plugin.source}`);
    }

    if (!Array.isArray(plugin.skills) || plugin.skills.length === 0) {
      fail(`${tag}.skills must be a non-empty array`);
      continue;
    }

    for (const [skillIndex, skillPath] of plugin.skills.entries()) {
      const skillTag = `${tag}.skills[${skillIndex}]`;
      if (!requireString(skillPath, skillTag)) continue;
      if (!isSafeRelativePath(skillPath)) {
        fail(`${skillTag} must be a safe relative path: ${skillPath}`);
        continue;
      }

      const resolved = path.resolve(sourceDir, skillPath);
      if (!(await exists(resolved))) {
        fail(`${skillTag} points to missing path (from plugin source): ${skillPath}`);
        continue;
      }

      const skillFile = path.join(resolved, 'SKILL.md');
      if (!(await exists(skillFile))) {
        fail(`${skillTag} must reference a directory containing SKILL.md: ${skillPath}`);
      }
    }
  }

  finish();
}

function finish() {
  if (errors.length > 0) {
    console.error('Marketplace validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Marketplace validation passed.');
}

main();
