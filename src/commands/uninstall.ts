import { unlink, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as p from '@clack/prompts';
import { paths } from '../platform/paths.js';
import { readSettings } from '../settings/reader.js';
import { removeOurHooks, writeSettings, isOurHookNode } from '../settings/writer.js';
import { backupSettings } from '../settings/backup.js';
import { renderRemoveDiff } from '../settings/differ.js';

export async function runUninstall(): Promise<void> {
  p.intro('claude-code-alert · uninstall');
  const settings = await readSettings();

  const removedFrom: string[] = [];
  for (const [ev, arr] of Object.entries(settings.hooks ?? {})) {
    if ((arr ?? []).some(isOurHookNode)) removedFrom.push(ev);
  }
  p.log.message(renderRemoveDiff(removedFrom));

  const alsoDelete = await p.multiselect({
    message: 'Also delete?',
    options: [
      { value: 'scripts',  label: '~/.claude/scripts/cca.{ps1,sh}', hint: 'recommended' },
      { value: 'config',   label: '~/.claude/cca-config.json',     hint: 'recommended' },
      { value: 'commands', label: '~/.claude/commands/cca-off.md, cca-on.md', hint: 'recommended' },
      { value: 'sounds',   label: '~/.claude/sounds/  (custom sounds)' },
    ],
    initialValues: ['scripts', 'config', 'commands'],
    required: false,
  });
  if (p.isCancel(alsoDelete)) {
    p.cancel('Aborted');
    return;
  }

  const ok = await p.confirm({ message: 'Apply?', initialValue: true });
  if (p.isCancel(ok) || !ok) {
    p.cancel('Aborted');
    return;
  }

  const backupPath = await backupSettings();
  if (backupPath) p.log.info(`Backed up settings.json → ${backupPath}`);

  await writeSettings(removeOurHooks(settings));

  const targets = alsoDelete as string[];
  if (targets.includes('scripts')) {
    for (const f of [paths.scriptPs1, paths.scriptSh]) {
      if (existsSync(f)) await unlink(f);
    }
  }
  if (targets.includes('config') && existsSync(paths.ccaConfig)) {
    await unlink(paths.ccaConfig);
  }
  if (targets.includes('commands')) {
    for (const f of [paths.cmdOff, paths.cmdOn]) {
      if (existsSync(f)) await unlink(f);
    }
  }
  if (targets.includes('sounds') && existsSync(paths.soundsDir)) {
    await rm(paths.soundsDir, { recursive: true, force: true });
  }

  p.outro('✓ Uninstalled');
}
