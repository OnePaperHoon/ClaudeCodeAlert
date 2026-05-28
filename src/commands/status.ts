import { existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import pc from 'picocolors';
import { paths } from '../platform/paths.js';
import { readSettings, readCcaConfig } from '../settings/reader.js';
import { isOurHookNode } from '../settings/writer.js';
import { ALL_EVENTS } from '../settings/types.js';

function tilde(p: string): string {
  return p.startsWith(paths.home) ? '~' + p.slice(paths.home.length).replace(/\\/g, '/') : p;
}

export async function runStatus(): Promise<void> {
  const installed = existsSync(paths.scriptPs1) || existsSync(paths.scriptSh);
  const cfg = await readCcaConfig();
  const settings = await readSettings();
  const disabled = existsSync(paths.disabledFlag);

  console.log();
  console.log(pc.bold('claude-code-alert · status'));
  console.log();

  if (!installed) {
    console.log(pc.dim('  Not installed. Run `cca init`.'));
    console.log();
    return;
  }

  console.log(`  ${pc.green('●')} Installed`);
  console.log(`  Dispatcher: ${tilde(paths.scriptsDir)}/cca.{ps1,sh}`);
  if (cfg) console.log(`  Config:     ${tilde(paths.ccaConfig)}`);
  console.log();

  console.log(pc.bold('  Hooks:'));
  let hasAny = false;
  for (const ev of ALL_EVENTS) {
    const arr = settings.hooks?.[ev] ?? [];
    const ours = arr.filter(isOurHookNode).length;
    const others = arr.length - ours;
    if (ours === 0 && others === 0) continue;
    hasAny = true;

    const ccaEnabled = cfg?.events?.[ev]?.enabled ?? false;
    const status = ours > 0
      ? (ccaEnabled ? pc.green('✓') : pc.yellow('!'))
      : ' ';

    const sources: string[] = [];
    if (ours > 0) sources.push(pc.cyan(`cca×${ours}`));
    if (others > 0) sources.push(pc.dim(`user×${others}`));

    let detail = '';
    if (ours > 0 && cfg?.events?.[ev]) {
      const e = cfg.events[ev];
      detail = pc.dim(`  | sound=${e.sound}, msg=${JSON.stringify(e.message)}`);
    }

    console.log(`    ${status}  ${ev.padEnd(18)} ${sources.join(' + ')}${detail}`);
  }
  if (!hasAny) console.log(pc.dim('    (none)'));

  // 정합성 경고: settings에 우리 hook이 있는데 cca-config 에서 disabled
  const mismatches: string[] = [];
  for (const ev of ALL_EVENTS) {
    const ours = (settings.hooks?.[ev] ?? []).some(isOurHookNode);
    const enabledInCfg = cfg?.events?.[ev]?.enabled ?? false;
    if (ours && !enabledInCfg) mismatches.push(ev);
  }
  if (mismatches.length > 0) {
    console.log();
    console.log(pc.yellow(`  ! Mismatch: settings.json hook present but cca-config disabled: ${mismatches.join(', ')}`));
    console.log(pc.dim(`    → run \`cca init\` to reconcile`));
  }

  console.log();
  console.log(`  Mute flag:  ${disabled ? pc.yellow('on (notifications muted)') : pc.dim('off')}`);
  const cmdsInstalled = existsSync(paths.cmdOff) || existsSync(paths.cmdOn);
  console.log(`  Toggle cmds: ${cmdsInstalled ? pc.green('/cca-off, /cca-on') : pc.dim('—')}`);

  if (existsSync(paths.backupsDir)) {
    const files = readdirSync(paths.backupsDir)
      .filter((f) => f.startsWith('settings.') && f.endsWith('.json'))
      .map((f) => ({ name: f, mtime: statSync(join(paths.backupsDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    if (files.length > 0 && files[0]) {
      const latest = new Date(files[0].mtime).toLocaleString();
      console.log(`  Backups:    ${files.length} (latest ${latest})`);
    }
  }
  console.log();
}
