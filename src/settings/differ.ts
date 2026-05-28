import pc from 'picocolors';
import type { MergePlan } from './writer.js';

export function renderMergeDiff(plan: MergePlan): string {
  const lines: string[] = ['  ~ Diff to apply ~'];
  const cmd = '~/.claude/scripts/cca.{ps1,sh}';
  for (const [event, action] of Object.entries(plan.byEvent)) {
    if (action === 'append') {
      lines.push(pc.green(`  + hooks.${event}[] += { dispatcher: ${cmd} }`));
    } else if (action === 'replace') {
      lines.push(pc.yellow(`  ~ hooks.${event}[i]  = { dispatcher: ${cmd} }   (update)`));
    } else if (action === 'skip') {
      lines.push(pc.dim(`  · hooks.${event} skipped (existing kept)`));
    } else if (action === 'remove') {
      lines.push(pc.red(`  - hooks.${event}[]  (our entry removed — no longer enabled)`));
    }
  }
  if (lines.length === 1) lines.push(pc.dim('  (no changes)'));
  return lines.join('\n');
}

export function renderRemoveDiff(eventsRemoved: string[]): string {
  if (eventsRemoved.length === 0) {
    return pc.dim('  (no claude-code-alert hooks found)');
  }
  return [
    '  ~ Diff to apply ~',
    ...eventsRemoved.map((e) => pc.red(`  - hooks.${e}[]  (our entry)`)),
  ].join('\n');
}
