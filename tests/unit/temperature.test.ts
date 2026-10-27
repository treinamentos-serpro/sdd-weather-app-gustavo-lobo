import { describe, expect, it } from 'vitest';
import { convertTemperature, formatTemperature, unitLabel } from '../../src/lib/temperature';

describe('convertTemperature', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
    [12.26, 54.068],
    [-12.26, 9.932],
  ])('converte %s °C para %s °F sem arredondamento', (celsius, fahrenheit) => {
    expect(convertTemperature(celsius, 'fahrenheit')).toBeCloseTo(fahrenheit, 10);
  });

  it.each([0, 100, -40, 12.26, -12.26])('preserva %s na unidade Celsius', (celsius) => {
    expect(convertTemperature(celsius, 'celsius')).toBe(celsius);
  });

  it.each(['celsius', 'fahrenheit'] as const)('preserva null em %s', (unit) => {
    expect(convertTemperature(null, unit)).toBeNull();
  });

  it('alterna unidades a partir do Celsius original sem acumular erro', () => {
    const celsius = -12.26;
    for (let index = 0; index < 100; index += 1) {
      expect(convertTemperature(celsius, 'fahrenheit')).toBeCloseTo(9.932, 10);
      expect(convertTemperature(celsius, 'celsius')).toBe(celsius);
    }
    expect(celsius).toBe(-12.26);
  });
});

describe('formatTemperature', () => {
  it.each([
    [0, 'celsius', '0 °C'],
    [0, 'fahrenheit', '32 °F'],
    [100, 'fahrenheit', '212 °F'],
    [-40, 'fahrenheit', '-40 °F'],
    [12.26, 'celsius', '12 °C'],
    [12.26, 'fahrenheit', '54 °F'],
    [-12.26, 'celsius', '-12 °C'],
    [19.96, 'celsius', '20 °C'],
    [12.6, 'celsius', '13 °C'],
    [-12.6, 'celsius', '-13 °C'],
  ] as const)('formata %s °C em %s com arredondamento e símbolo', (celsius, unit, expected) => {
    expect(formatTemperature(celsius, unit, 'en-US')).toBe(expected);
  });

  it('não exibe casas decimais em pt-BR', () => {
    expect(formatTemperature(12.26, 'celsius', 'pt-BR')).toBe('12 °C');
    expect(formatTemperature(12.26, 'fahrenheit', 'pt-BR')).toBe('54 °F');
  });

  it.each(['celsius', 'fahrenheit'] as const)('mostra ausência de medição em %s', (unit) => {
    expect(formatTemperature(null, unit, 'pt-BR')).toBe('Indisponível');
  });

  it('usa o locale do dispositivo quando omitido', () => {
    const expected = new Intl.NumberFormat(undefined, {
      useGrouping: false,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(12.26);
    expect(formatTemperature(12.26, 'celsius')).toBe(`${expected} °C`);
  });

  it('arredonda apenas a apresentação, preservando a conversão canônica', () => {
    expect(formatTemperature(12.26, 'fahrenheit', 'en-US')).toBe('54 °F');
    expect(convertTemperature(12.26, 'fahrenheit')).toBeCloseTo(54.068, 10);
    expect(convertTemperature(12.26, 'celsius')).toBe(12.26);
  });
});

describe('unitLabel', () => {
  it.each([
    ['celsius', '°C'],
    ['fahrenheit', '°F'],
  ] as const)('retorna o símbolo de %s', (unit, expected) => {
    expect(unitLabel(unit)).toBe(expected);
  });
});
