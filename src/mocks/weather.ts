import type { WeatherData } from '../types/weather';

/** Dados fictícios e fixos para desenvolvimento da UI, sem acesso à API. */
export const mockWeatherData: WeatherData = {
  city: {
    id: 3448439,
    name: 'São Paulo',
    admin1: 'São Paulo',
    country: 'Brasil',
    countryCode: 'BR',
    latitude: -23.5475,
    longitude: -46.6361,
  },
  timezone: 'America/Sao_Paulo',
  fetchedAt: '2026-10-27T18:02:00Z',
  current: {
    referenceTime: '2026-10-27T18:00:00Z',
    temperatureC: 25.34,
    condition: {
      code: 2,
      labelPtBr: 'Parcialmente nublado',
      iconKey: 'cloudy',
    },
    relativeHumidityPct: 63.4,
    windSpeedKmh: 12.34,
    surfacePressureHpa: 925.67,
    precipitationPreviousHourMm: 0.46,
    precipitationPeriod: {
      start: '2026-10-27T17:00:00Z',
      end: '2026-10-27T18:00:00Z',
    },
  },
  forecast: [
    {
      date: '2026-10-27',
      minTemperatureC: 18.25,
      maxTemperatureC: 27.64,
      condition: { code: 2, labelPtBr: 'Parcialmente nublado', iconKey: 'cloudy' },
      precipitationSumMm: 0.46,
      precipitationProbabilityMaxPct: 25,
    },
    {
      date: '2026-10-28',
      minTemperatureC: 19.12,
      maxTemperatureC: 28.83,
      condition: { code: 0, labelPtBr: 'Céu limpo', iconKey: 'clear' },
      precipitationSumMm: 0,
      precipitationProbabilityMaxPct: 5,
    },
    {
      date: '2026-10-29',
      minTemperatureC: 18.78,
      maxTemperatureC: 25.46,
      condition: { code: 61, labelPtBr: 'Chuva fraca', iconKey: 'rain' },
      precipitationSumMm: 4.26,
      precipitationProbabilityMaxPct: 75,
    },
    {
      date: '2026-10-30',
      minTemperatureC: 17.45,
      maxTemperatureC: 23.82,
      condition: { code: 95, labelPtBr: 'Trovoada', iconKey: 'thunderstorm' },
      precipitationSumMm: 12.38,
      precipitationProbabilityMaxPct: 90,
    },
    {
      date: '2026-10-31',
      minTemperatureC: 16.63,
      maxTemperatureC: 24.57,
      condition: { code: 3, labelPtBr: 'Nublado', iconKey: 'cloudy' },
      precipitationSumMm: 0,
      precipitationProbabilityMaxPct: 15,
    },
  ],
  issues: [],
};
