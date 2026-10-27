export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id: number;
  name: string;
  admin1: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
}

export type WeatherIconKey =
  | 'clear'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'unknown';

export interface WeatherCondition {
  code: number;
  labelPtBr: string;
  iconKey: WeatherIconKey;
}

export interface CurrentWeather {
  /** Instante meteorológico em ISO-8601 UTC, com Z; não é o horário da consulta. */
  referenceTime: string | null;
  temperatureC: number | null;
  condition: WeatherCondition | null;
  relativeHumidityPct: number | null;
  windSpeedKmh: number | null;
  surfacePressureHpa: number | null;
  precipitationPreviousHourMm: number | null;
  /** Janela da precipitação em ISO-8601 UTC, com Z. */
  precipitationPeriod: {
    start: string;
    end: string;
  } | null;
}

export interface ForecastDay {
  /** Data civil YYYY-MM-DD no fuso da cidade. */
  date: string;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  condition: WeatherCondition | null;
  precipitationSumMm: number | null;
  precipitationProbabilityMaxPct: number | null;
}

export interface WeatherDataIssue {
  path: string;
  kind: 'invalid-field' | 'invalid-block';
}

export interface WeatherData {
  city: City;
  /** Identificador de fuso IANA. */
  timezone: string;
  /** Instante da consulta em ISO-8601 UTC. */
  fetchedAt: string;
  current: CurrentWeather;
  /** Cinco datas locais; vazio quando o bloco diário estiver indisponível. */
  forecast: ForecastDay[];
  issues: WeatherDataIssue[];
}
