import { mkdir, copyFile, readdir, stat, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { paths } from '../platform/paths.js';

const KEEP = 3;

function tsStamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export async function backupSettings(): Promise<string | null> {
  if (!existsSync(paths.settings)) return null;
  await mkdir(paths.backupsDir, { recursive: true });
  const dest = join(paths.backupsDir, `settings.${tsStamp()}.json`);
  await copyFile(paths.settings, dest);
  await rotate();
  return dest;
}

async function rotate(): Promise<void> {
  const entries = await readdir(paths.backupsDir);
  const items: { name: string; mtime: number }[] = [];
  for (const name of entries) {
    if (!name.startsWith('settings.') || !name.endsWith('.json')) continue;
    const full = join(paths.backupsDir, name);
    const s = await stat(full);
    items.push({ name: full, mtime: s.mtimeMs });
  }
  items.sort((a, b) => b.mtime - a.mtime);
  for (const old of items.slice(KEEP)) await unlink(old.name);
}
