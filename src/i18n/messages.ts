import type { EventName } from '../settings/types.js';

export type Locale = 'en' | 'ko';

/**
 * 이벤트별 기본 토스트 메시지.
 * Notification 은 항상 빈 문자열 → dispatcher 가 stdin 의 dynamic message 로 fallback.
 */
export const DEFAULT_MESSAGES: Record<Locale, Record<EventName, string>> = {
  en: {
    Stop: 'Response finished',
    Notification: '',
    SessionEnd: 'Session ended',
    SessionStart: 'Session started',
    SubagentStop: 'Subagent finished',
    UserPromptSubmit: 'Prompt submitted',
    PreToolUse: 'Tool call',
    PostToolUse: 'Tool finished',
    PreCompact: 'Compacting',
  },
  ko: {
    Stop: '응답을 끝냈어요',
    Notification: '',
    SessionEnd: '세션이 끝났어요',
    SessionStart: '세션을 시작했어요',
    SubagentStop: '서브 에이전트가 끝났어요',
    UserPromptSubmit: '입력을 받았어요',
    PreToolUse: '도구를 호출해요',
    PostToolUse: '도구가 끝났어요',
    PreCompact: '대화를 정리하고 있어요',
  },
};
