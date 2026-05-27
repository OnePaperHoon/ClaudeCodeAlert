import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { paths } from '../platform/paths.js';
import type { ClaudeSettings, CcaConfig } from './types.js';

export async function readSettings(): Promise<ClaudeSettings> {
  if (!existsSync(paths.settings)) return {};
  const raw = await readFile(paths.settings, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      `settings.json is not valid JSON at ${paths.settings}. Fix it manually first.`,
    );
  }
}

export async function readCcaConfig(): Promise<CcaConfig | null> {
  if (!existsSync(paths.ccaConfig)) return null;
  const raw = await readFile(paths.ccaConfig, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
