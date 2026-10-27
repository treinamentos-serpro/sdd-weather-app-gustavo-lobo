import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatDayLabel } from '../../src/lib/format';

afterEach(() => vi.unstubAllEnvs());

describe('formatDayLabel', () => {
  it('formata o rótulo de dia na localidade solicitada', () => {
    expect(formatDayLabel('2026-10-27', 'pt-BR')).toBe('ter., 27/10');
    expect(formatDayLabel('2026-10-27', 'en-US')).toBe('Tue, 10/27');
  });

  it.each([
    'America/Los_Angeles',
    'Pacific/Kiritimati',
    'UTC',
  ])('preserva a data civil com o navegador em %s', (timezone) => {
    vi.stubEnv('TZ', timezone);
    expect(formatDayLabel('2026-01-01', 'pt-BR')).toBe('qui., 01/01');
    expect(formatDayLabel('2026-12-31', 'en-US')).toBe('Thu, 12/31');
  });
});
