import * as p from '@clack/prompts';
import { runInit } from './commands/init.js';
import { runDisable } from './commands/disable.js';
import { runEnable } from './commands/enable.js';
import { runUninstall } from './commands/uninstall.js';

const HELP = `cca (claude-code-alert)
  cca init       Install hooks (interactive)
  cca disable    Mute notifications
  cca enable     Unmute notifications
  cca uninstall  Remove our hooks
`;

const cmd = process.argv[2];

try {
  switch (cmd) {
    case 'init':
      await runInit();
      break;
    case 'disable':
      await runDisable();
      break;
    case 'enable':
      await runEnable();
      break;
    case 'uninstall':
      await runUninstall();
      break;
    case '-h':
    case '--help':
    case 'help':
      console.log(HELP);
      break;
    default:
      if (cmd) console.error(`Unknown command: ${cmd}\n`);
      console.log(HELP);
      process.exit(cmd ? 1 : 0);
  }
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  p.cancel(msg);
  process.exit(1);
}
