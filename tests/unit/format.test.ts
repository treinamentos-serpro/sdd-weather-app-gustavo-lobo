import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatDayLabel } from '../../src/lib/format';

afterEach(() => vi.unstubAllEnvs());

describe('formatDayLabel', () => {
  it('formata o rótulo de dia na localidade solicitada', () => {
    expect(formatDayLabel('2026-10-27', 'pt-BR')).toBe('ter., 27/10');
    expect(formatDayLabel('2026-10-27', 'en-US')).toBe('Tue, 10/27');
  });

  it.each([null, undefined, '', 'not-a-date', '2026-02-30'])(
    'usa fallback para data ausente ou inválida: %s',
    (date) => {
      expect(formatDayLabel(date)).toBe('—');
    },
  );

  it.each([
    ['2026-10-25', 'dom., 25/10'],
    ['2026-10-26', 'seg., 26/10'],
    ['2026-10-27', 'ter., 27/10'],
    ['2026-10-28', 'qua., 28/10'],
    ['2026-10-29', 'qui., 29/10'],
    ['2026-10-30', 'sex., 30/10'],
    ['2026-10-31', 'sáb., 31/10'],
    ['2028-02-29', 'ter., 29/02'],
  ])('formata dia da semana e data curta para %s', (date, expected) => {
    expect(formatDayLabel(date, 'pt-BR')).toBe(expected);
  });

  it('usa a localidade do dispositivo quando omitida', () => {
    const expected = new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      timeZone: 'UTC',
    }).format(new Date('2026-10-27T00:00:00Z'));
    expect(formatDayLabel('2026-10-27')).toBe(expected);
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
