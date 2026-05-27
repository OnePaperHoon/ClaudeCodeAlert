import * as p from '@clack/prompts';
import {
  ALL_EVENTS,
  DEFAULT_ENABLED,
  type CcaConfig,
  type EventName,
} from '../settings/types.js';

export async function selectEvents(previous: CcaConfig | null): Promise<EventName[]> {
  const fromPrev = previous
    ? (Object.entries(previous.events ?? {})
        .filter(([, c]) => c?.enabled)
        .map(([k]) => k as EventName))
    : [];

  const initialValues = fromPrev.length > 0 ? fromPrev : DEFAULT_ENABLED;

  const res = await p.multiselect({
    message: 'Enable events',
    options: ALL_EVENTS.map((e) => ({ value: e, label: e })),
    initialValues,
    required: true,
  });
  if (p.isCancel(res)) throw new Error('Cancelled');
  return res as EventName[];
}
