import { mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as p from '@clack/prompts';
import { paths } from '../platform/paths.js';
import { readSettings, readCcaConfig } from '../settings/reader.js';
import {
  mergeHooks,
  writeSettings,
  writeCcaConfig,
  type ConflictDecision,
} from '../settings/writer.js';
import { backupSettings } from '../settings/backup.js';
import { renderMergeDiff } from '../settings/differ.js';
import { selectEvents } from '../prompts/event-select.js';
import { detectConflicts, askConflict } from '../prompts/conflict-prompt.js';
import { buildConfig } from '../prompts/config-flow.js';

export async function runInit(): Promise<void> {
  p.intro('claude-code-alert · init');

  if (!existsSync(paths.claudeDir)) {
    await mkdir(paths.claudeDir, { recursive: true });
    p.log.warn(`Created ${paths.claudeDir}. Is Claude Code installed?`);
  }

  const settings = await readSettings();
  const previous = await readCcaConfig();

  // 1) 이벤트 선택 (previous 가 있으면 이전 활성 이벤트가 체크된 상태로)
  const enabled = await selectEvents(previous);

  // 2) 충돌 검사
  const conflicts = detectConflicts(settings, enabled);
  let decision: ConflictDecision = 'append';
  if (conflicts.length > 0) {
    decision = await askConflict(conflicts);
    if (decision === 'abort') {
      p.cancel('Aborted by user');
      return;
    }
  }

  // 3) merge plan 미리 산출 → diff
  const { next, plan } = mergeHooks(settings, enabled, decision);
  p.log.message(renderMergeDiff(plan));

  // 'skip' 으로 결정된 이벤트는 settings.json 에 우리 hook 이 안 들어가므로
  // cca-config 에서도 비활성 처리 + advanced prompt 에서 제외
  const skipped = new Set(
    Object.entries(plan.byEvent)
      .filter(([, a]) => a === 'skip')
      .map(([ev]) => ev),
  );
  const effectiveEnabled = enabled.filter((e) => !skipped.has(e));

  // 4) config 흐름
  const cfg = await buildConfig(effectiveEnabled, previous);

  // 5) 최종 confirm
  const ok = await p.confirm({ message: 'Apply changes?', initialValue: true });
  if (p.isCancel(ok) || !ok) {
    p.cancel('Aborted');
    return;
  }

  // 6) 백업 + settings 쓰기
  const backupPath = await backupSettings();
  if (backupPath) p.log.info(`Backed up settings.json → ${backupPath}`);
  await writeSettings(next);

  // 7) dispatcher 스크립트 복사
  await mkdir(paths.scriptsDir, { recursive: true });
  const pkgScriptsDir = locatePackageScripts();
  await copyFile(join(pkgScriptsDir, 'cca.ps1'), paths.scriptPs1);
  await copyFile(join(pkgScriptsDir, 'cca.sh'), paths.scriptSh);

  // 8) cca-config.json 쓰기
  await writeCcaConfig(cfg);

  p.outro('✓ Installed');
}

/** 빌드된 dist/cli.js 위치 → ../scripts */
function locatePackageScripts(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', 'scripts');
}
