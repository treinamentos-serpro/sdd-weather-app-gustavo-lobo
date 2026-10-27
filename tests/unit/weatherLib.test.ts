import { describe, expect, it } from 'vitest';
import { formatMeasurement } from '../../src/lib/weatherFormat';

describe('formatMeasurement', () => {
  it('localiza separadores e arredonda somente na apresentação', () => {
    expect(formatMeasurement(20.04, 1, '°C', 'en-US')).toBe('20.0 °C');
    expect(formatMeasurement(12.26, 1, 'km/h', 'pt-BR')).toBe('12,3 km/h');
    expect(formatMeasurement(63.4, 0, '%', 'en-US')).toBe('63%');
    expect(formatMeasurement(1013.67, 0, 'hPa', 'en-US')).toBe('1014 hPa');
    expect(formatMeasurement(null, 1, 'mm', 'pt-BR')).toBe('—');
    expect(formatMeasurement(Number.NaN, 1, 'mm', 'pt-BR')).toBe('—');
    expect(formatMeasurement(Number.POSITIVE_INFINITY, 1, 'mm', 'pt-BR')).toBe('—');
    expect(formatMeasurement(undefined, 1, 'mm', 'pt-BR')).toBe('—');
    expect(formatMeasurement(0, 1, 'mm', 'pt-BR')).toBe('0,0 mm');
  });
});
