export const ALL_EVENTS = [
  'Stop', 'Notification', 'SessionEnd',
  'SessionStart', 'SubagentStop', 'UserPromptSubmit',
  'PreToolUse', 'PostToolUse', 'PreCompact',
] as const;
export type EventName = typeof ALL_EVENTS[number];

export const DEFAULT_ENABLED: EventName[] = ['Stop', 'Notification', 'SessionEnd'];

export interface CcaEventConfig {
  enabled: boolean;
  sound: string;
  message: string | null;
}

export interface CcaConfig {
  version: 1;
  events: Record<EventName, CcaEventConfig>;
  defaults: {
    sound_win: string;
    sound_mac: string;
  };
}

export interface HookCommandNode {
  type: 'command';
  command: string;
}

export interface HookMatcherNode {
  matcher?: string;
  hooks: HookCommandNode[];
}

export interface ClaudeSettings {
  hooks?: Partial<Record<EventName, HookMatcherNode[]>>;
  [k: string]: unknown;
}
