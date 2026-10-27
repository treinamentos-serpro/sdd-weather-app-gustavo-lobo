import { describe, expect, it } from 'vitest';
import { convertTemperature } from '../../src/lib/temperature';
import { getWeatherCondition, weatherIcons } from '../../src/lib/weatherCodes';
import { formatMeasurement } from '../../src/lib/weatherFormat';

describe('convertTemperature', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
    [12.26, 54.068],
  ])('converte %s °C sem arredondamento', (celsius, fahrenheit) => {
    expect(convertTemperature(celsius, 'fahrenheit')).toBeCloseTo(fahrenheit, 10);
    expect(convertTemperature(celsius, 'celsius')).toBe(celsius);
  });

  it('preserva null nas duas unidades', () => {
    expect(convertTemperature(null, 'celsius')).toBeNull();
    expect(convertTemperature(null, 'fahrenheit')).toBeNull();
  });
});

describe('formatMeasurement', () => {
  it('localiza separadores e arredonda somente na apresentação', () => {
    expect(formatMeasurement(20.04, 1, '°C', 'en-US')).toBe('20.0 °C');
    expect(formatMeasurement(12.26, 1, 'km/h', 'pt-BR')).toBe('12,3 km/h');
    expect(formatMeasurement(63.4, 0, '%', 'en-US')).toBe('63%');
    expect(formatMeasurement(1013.67, 0, 'hPa', 'en-US')).toBe('1014 hPa');
    expect(formatMeasurement(null, 1, 'mm', 'pt-BR')).toBe('Indisponível');
    expect(formatMeasurement(0, 1, 'mm', 'pt-BR')).toBe('0,0 mm');
  });
});

describe('getWeatherCondition', () => {
  it.each([
    [0, 'Céu limpo', 'clear'],
    [3, 'Nublado', 'cloudy'],
    [45, 'Nevoeiro', 'fog'],
    [51, 'Garoa fraca', 'drizzle'],
    [61, 'Chuva fraca', 'rain'],
    [71, 'Neve fraca', 'snow'],
    [95, 'Trovoada', 'thunderstorm'],
    [999, 'Condição indisponível', 'unknown'],
  ] as const)('mapeia código %s para descrição e ícone', (code, labelPtBr, iconKey) => {
    expect(getWeatherCondition(code)).toEqual({ code, labelPtBr, iconKey });
    expect(weatherIcons[iconKey]).toBeTruthy();
  });
});
