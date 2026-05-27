import { writeFile } from 'node:fs/promises';
import { paths, normalizePath, dispatcherCommandPath } from '../platform/paths.js';
import { detectPlatform } from '../platform/detect.js';
import type {
  ClaudeSettings,
  HookMatcherNode,
  EventName,
  CcaConfig,
} from './types.js';

/**
 * dispatcher 호출 명령 빌드.
 * 경로를 항상 큰따옴표로 감싼다 — 사용자 홈이 "C:/Users/홍 길동/" 같은 공백 포함이라도 안전.
 * normalizePath 가 인용 부호를 제거하므로 isOurHookNode 매칭에는 영향 없음.
 */
function buildOurCommand(): string {
  const platform = detectPlatform();
  const path = dispatcherCommandPath(platform);
  return platform === 'win'
    ? `powershell.exe -ExecutionPolicy Bypass -File "${path}"`
    : `bash "${path}"`;
}

function buildOurHookNode(): HookMatcherNode {
  return {
    matcher: '*',
    hooks: [{ type: 'command', command: buildOurCommand() }],
  };
}

export function isOurHookNode(node: HookMatcherNode): boolean {
  const platform = detectPlatform();
  const needle = normalizePath(dispatcherCommandPath(platform));
  return node.hooks?.some((h) => normalizePath(h.command).includes(needle)) ?? false;
}

export type ConflictDecision = 'append' | 'skip' | 'abort';

export interface MergePlan {
  byEvent: Record<string, 'append' | 'replace' | 'skip' | 'noop'>;
}

export function mergeHooks(
  settings: ClaudeSettings,
  enabledEvents: EventName[],
  conflictDecision: ConflictDecision,
): { next: ClaudeSettings; plan: MergePlan } {
  if (conflictDecision === 'abort') {
    return { next: settings, plan: { byEvent: {} } };
  }

  const nextHooks: NonNullable<ClaudeSettings['hooks']> = { ...(settings.hooks ?? {}) };
  const next: ClaudeSettings = { ...settings, hooks: nextHooks };
  const plan: MergePlan = { byEvent: {} };
  const ourNode = buildOurHookNode();

  for (const event of enabledEvents) {
    const arr = [...(nextHooks[event] ?? [])];
    const ourIdx = arr.findIndex(isOurHookNode);

    if (ourIdx >= 0) {
      arr[ourIdx] = ourNode;
      plan.byEvent[event] = 'replace';
    } else if (arr.length === 0) {
      arr.push(ourNode);
      plan.byEvent[event] = 'append';
    } else {
      if (conflictDecision === 'skip') {
        plan.byEvent[event] = 'skip';
        continue;
      }
      arr.push(ourNode);
      plan.byEvent[event] = 'append';
    }
    nextHooks[event] = arr;
  }
  return { next, plan };
}

/** uninstall: 우리 hook만 제거. 결과적으로 빈 배열이 된 키는 통째로 삭제. */
export function removeOurHooks(settings: ClaudeSettings): ClaudeSettings {
  const nextHooks: NonNullable<ClaudeSettings['hooks']> = { ...(settings.hooks ?? {}) };
  const next: ClaudeSettings = { ...settings, hooks: nextHooks };

  for (const key of Object.keys(nextHooks) as EventName[]) {
    const filtered = (nextHooks[key] ?? []).filter((n) => !isOurHookNode(n));
    if (filtered.length === 0) delete nextHooks[key];
    else nextHooks[key] = filtered;
  }
  if (Object.keys(nextHooks).length === 0) delete next.hooks;
  return next;
}

export async function writeSettings(settings: ClaudeSettings): Promise<void> {
  const json = JSON.stringify(settings, null, 2);
  await writeFile(paths.settings, json + '\n', 'utf8');
}

export async function writeCcaConfig(cfg: CcaConfig): Promise<void> {
  await writeFile(paths.ccaConfig, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
}
