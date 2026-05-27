import * as p from '@clack/prompts';
import { chooseSound } from './sound-prompt.js';
import { DEFAULT_SOUNDS } from '../platform/defaults.js';
import { DEFAULT_MESSAGES, type Locale } from '../i18n/messages.js';
import {
  ALL_EVENTS,
  type CcaConfig,
  type CcaEventConfig,
  type EventName,
} from '../settings/types.js';

function defaultEventCfg(
  ev: EventName,
  enabled: boolean,
  locale: Locale,
): CcaEventConfig {
  return {
    enabled,
    sound: 'default',
    message: ev === 'Notification' ? null : DEFAULT_MESSAGES[locale][ev],
  };
}

export async function buildConfig(
  enabled: EventName[],
  previous: CcaConfig | null,
): Promise<CcaConfig> {
  const localeChoice = await p.select({
    message: 'Default message language',
    options: [
      { value: 'en', label: 'English' },
      { value: 'ko', label: '한국어' },
    ],
    initialValue: 'en',
  });
  if (p.isCancel(localeChoice)) throw new Error('Cancelled');
  const locale = localeChoice as Locale;

  const useDefaults = await p.confirm({
    message: 'Use default sound + message?',
    initialValue: true,
  });
  if (p.isCancel(useDefaults)) throw new Error('Cancelled');

  const events = {} as Record<EventName, CcaEventConfig>;

  for (const ev of ALL_EVENTS) {
    const isEnabled = enabled.includes(ev);

    if (!isEnabled) {
      // 비활성 이벤트: 기존 설정 보존, enabled 만 false
      const base = previous?.events?.[ev] ?? defaultEventCfg(ev, false, locale);
      events[ev] = { ...base, enabled: false };
      continue;
    }

    if (useDefaults) {
      // 사용자가 명시적으로 locale 을 골랐으니 그 locale 기본 메시지를 적용
      events[ev] = {
        enabled: true,
        sound: previous?.events?.[ev]?.sound ?? 'default',
        message: ev === 'Notification' ? null : DEFAULT_MESSAGES[locale][ev],
      };
      continue;
    }

    // advanced 분기: 이벤트별 sound + message 직접 입력
    const sound = await chooseSound(ev);
    const initialMsg =
      previous?.events?.[ev]?.message ?? DEFAULT_MESSAGES[locale][ev];
    const msgInput = await p.text({
      message: `Message for ${ev}`,
      initialValue: initialMsg,
    });
    if (p.isCancel(msgInput)) throw new Error('Cancelled');
    const msgStr = String(msgInput);
    events[ev] = {
      enabled: true,
      sound,
      message: ev === 'Notification' && !msgStr ? null : msgStr,
    };
  }

  return {
    version: 1,
    events,
    defaults: {
      sound_win: DEFAULT_SOUNDS.win,
      sound_mac: DEFAULT_SOUNDS.mac,
    },
  };
}
