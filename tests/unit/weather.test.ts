import { describe, expect, expectTypeOf, it } from 'vitest';
import { mockWeatherData } from '../../src/mocks/weather';
import type { CurrentWeather, ForecastDay, Unit, WeatherData } from '../../src/types/weather';

describe('contratos meteorológicos', () => {
  it('mantém unidades e medições anuláveis conforme o plano', () => {
    expectTypeOf<Unit>().toEqualTypeOf<'celsius' | 'fahrenheit'>();
    expectTypeOf(mockWeatherData).toEqualTypeOf<WeatherData>();
    expectTypeOf<CurrentWeather['temperatureC']>().toEqualTypeOf<number | null>();
    expectTypeOf<ForecastDay['minTemperatureC']>().toEqualTypeOf<number | null>();
    expectTypeOf<ForecastDay['maxTemperatureC']>().toEqualTypeOf<number | null>();
  });
});

describe('mockWeatherData', () => {
  it('fornece cidade, condições atuais e contexto temporal coerente', () => {
    expect(mockWeatherData.city.name).toBe('São Paulo');
    expect(mockWeatherData.timezone).toBe('America/Sao_Paulo');
    expect(mockWeatherData.issues).toEqual([]);
    expect(mockWeatherData.current).toEqual({
      referenceTime: '2026-10-27T18:00:00Z',
      temperatureC: 25.34,
      condition: { code: 2, labelPtBr: 'Parcialmente nublado', iconKey: 'cloudy' },
      relativeHumidityPct: 63.4,
      windSpeedKmh: 12.34,
      surfacePressureHpa: 925.67,
      precipitationPreviousHourMm: 0.46,
      precipitationPeriod: {
        start: '2026-10-27T17:00:00Z',
        end: '2026-10-27T18:00:00Z',
      },
    });
    expect(Date.parse(mockWeatherData.fetchedAt)).toBeGreaterThanOrEqual(
      Date.parse('2026-10-27T18:00:00Z'),
    );
    const localDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: mockWeatherData.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(mockWeatherData.fetchedAt));
    expect(mockWeatherData.forecast[0].date).toBe(localDate);
  });

  it('fornece exatamente cinco dias consecutivos com todos os indicadores', () => {
    expect(mockWeatherData.forecast.map((day) => day.date)).toEqual([
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
    ]);
    for (const day of mockWeatherData.forecast) {
      expect(day.minTemperatureC).toBeTypeOf('number');
      expect(day.maxTemperatureC).toBeTypeOf('number');
      if (day.minTemperatureC === null || day.maxTemperatureC === null) {
        throw new Error(`Temperaturas ausentes no mock para ${day.date}`);
      }
      expect(day.minTemperatureC).toBeLessThanOrEqual(day.maxTemperatureC);
      expect(day.condition?.code).toBeTypeOf('number');
      expect(day.condition?.labelPtBr).toBeTruthy();
      expect(day.condition?.iconKey).toBeTruthy();
      expect(day.precipitationSumMm).toBeGreaterThanOrEqual(0);
      expect(day.precipitationProbabilityMaxPct).toBeGreaterThanOrEqual(0);
      expect(day.precipitationProbabilityMaxPct).toBeLessThanOrEqual(100);
    }
  });
});
