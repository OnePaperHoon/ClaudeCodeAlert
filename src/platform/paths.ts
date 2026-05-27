import { homedir } from 'node:os';
import { join } from 'node:path';

const HOME = homedir();
const CLAUDE_DIR = join(HOME, '.claude');

export const paths = {
  home: HOME,
  claudeDir: CLAUDE_DIR,
  settings: join(CLAUDE_DIR, 'settings.json'),
  ccaConfig: join(CLAUDE_DIR, 'cca-config.json'),
  disabledFlag: join(CLAUDE_DIR, 'notifications.disabled'),
  scriptsDir: join(CLAUDE_DIR, 'scripts'),
  scriptPs1: join(CLAUDE_DIR, 'scripts', 'cca.ps1'),
  scriptSh: join(CLAUDE_DIR, 'scripts', 'cca.sh'),
  soundsDir: join(CLAUDE_DIR, 'sounds'),
  backupsDir: join(CLAUDE_DIR, 'cca-backups'),
};

export function dispatcherCommandPath(platform: 'win' | 'mac'): string {
  const p = platform === 'win' ? paths.scriptPs1 : paths.scriptSh;
  return p.replace(/\\/g, '/');
}

/**
 * 명령 문자열 또는 경로의 정규화.
 * - 백슬래시 → 슬래시
 * - 큰/작은따옴표 제거 (인용된 경로와 raw 경로를 같게 봄)
 * - 트림 + 소문자
 * 사용처: `isOurHookNode` 가 settings.json command 안의 dispatcher 경로를 찾을 때.
 */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/["']/g, '').trim().toLowerCase();
}
