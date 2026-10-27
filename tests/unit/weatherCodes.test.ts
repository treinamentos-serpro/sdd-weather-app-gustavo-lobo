import { describe, expect, it } from 'vitest';
import { getWeatherCondition, weatherIcons } from '../../src/lib/weatherCodes';

describe('getWeatherCondition', () => {
  it.each([
    [0, 'Céu limpo', 'clear'],
    [3, 'Nublado', 'cloudy'],
    [45, 'Nevoeiro', 'fog'],
    [51, 'Garoa fraca', 'drizzle'],
    [61, 'Chuva fraca', 'rain'],
    [71, 'Neve fraca', 'snow'],
    [77, 'Grãos de neve', 'snow'],
    [95, 'Trovoada', 'thunderstorm'],
    [99, 'Trovoada com granizo forte', 'thunderstorm'],
  ] as const)('mapeia código conhecido %s para descrição e ícone', (code, labelPtBr, iconKey) => {
    expect(getWeatherCondition(code)).toEqual({ code, labelPtBr, iconKey });
    expect(weatherIcons[iconKey]).toBeTruthy();
  });

  it.each([999, -1, 4])('preserva código desconhecido %s e retorna fallback', (code) => {
    expect(getWeatherCondition(code)).toEqual({
      code,
      labelPtBr: 'Condição indisponível',
      iconKey: 'unknown',
    });
    expect(weatherIcons.unknown).toBe('❔');
  });
});
