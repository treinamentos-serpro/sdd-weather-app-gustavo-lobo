import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, ForecastDay, WeatherData, WeatherDataIssue } from '../types/weather';

export class WeatherServiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'WeatherServiceError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isTimestamp(value: unknown): value is number {
  return (
    isNumber(value) && Number.isInteger(value) && !Number.isNaN(new Date(value * 1000).getTime())
  );
}

export async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (cause) {
    const message =
      isRecord(cause) && cause.name === 'AbortError'
        ? 'A requisição demorou demais.'
        : 'Falha de rede.';
    throw new WeatherServiceError(message, { cause });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url: string, operation: string): Promise<Record<string, unknown>> {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new WeatherServiceError(
      `Erro ao ${operation} (HTTP ${response.status}). Tente novamente.`,
    );
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch (cause) {
    throw new WeatherServiceError(`Resposta inválida ao ${operation}.`, { cause });
  }
  if (!isRecord(data)) {
    throw new WeatherServiceError(`Resposta inválida ao ${operation}.`);
  }
  return data;
}

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const data = await fetchJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=pt&format=json`,
    'buscar cidades',
  );
  if (data.results === undefined) return [];
  if (!Array.isArray(data.results)) {
    throw new WeatherServiceError('Resposta inválida ao buscar cidades.');
  }
  return data.results.map((result: unknown): City => {
    if (
      !isRecord(result) ||
      !isNumber(result.id) ||
      typeof result.name !== 'string' ||
      typeof result.country !== 'string' ||
      !isNumber(result.latitude) ||
      !isNumber(result.longitude)
    ) {
      throw new WeatherServiceError('Resposta inválida ao buscar cidades.');
    }
    return {
      id: result.id,
      name: result.name,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
      admin1: typeof result.admin1 === 'string' ? result.admin1 : null,
      countryCode: typeof result.country_code === 'string' ? result.country_code : null,
    };
  });
}

export async function getWeather(city: City): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure',
    hourly: 'precipitation',
    daily:
      'weather_code,temperature_2m_min,temperature_2m_max,precipitation_sum,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '5',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    timeformat: 'unixtime',
  });
  const data = await fetchJson(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    'consultar o clima',
  );
  if (!isRecord(data.current) || !isRecord(data.daily)) {
    throw new WeatherServiceError(
      'Resposta incompleta ao consultar o clima: current ou daily ausente.',
    );
  }
  const { current, daily } = data;
  if (typeof data.timezone !== 'string') {
    throw new WeatherServiceError(
      'Resposta incompleta ao consultar o clima: fuso horário ausente.',
    );
  }
  let dateFormatter: Intl.DateTimeFormat;
  try {
    dateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: data.timezone,
      calendar: 'gregory',
      numberingSystem: 'latn',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (cause) {
    throw new WeatherServiceError(
      'Resposta inválida ao consultar o clima: fuso horário inválido.',
      {
        cause,
      },
    );
  }
  if (!Array.isArray(daily.time) || daily.time.length < 5) {
    throw new WeatherServiceError(
      'Resposta incompleta ao consultar o clima: previsão de cinco dias ausente.',
    );
  }
  const issues: WeatherDataIssue[] = [];
  const measurement = (value: unknown, path: string): number | null => {
    if (isNumber(value)) return value;
    issues.push({ path, kind: 'invalid-field' });
    return null;
  };
  const condition = (value: unknown, path: string) => {
    const code = measurement(value, path);
    return code === null ? null : getWeatherCondition(code);
  };
  const forecast: ForecastDay[] = daily.time.slice(0, 5).map((time: unknown, index: number) => {
    if (!isTimestamp(time)) {
      throw new WeatherServiceError(
        'Resposta inválida ao consultar o clima: data diária inválida.',
      );
    }
    const parts = dateFormatter.formatToParts(new Date(time * 1000));
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((entry) => entry.type === type)?.value;
    const value = (field: string) =>
      Array.isArray(daily[field]) ? daily[field][index] : undefined;
    return {
      date: `${part('year')}-${part('month')}-${part('day')}`,
      minTemperatureC: measurement(
        value('temperature_2m_min'),
        `daily.temperature_2m_min[${index}]`,
      ),
      maxTemperatureC: measurement(
        value('temperature_2m_max'),
        `daily.temperature_2m_max[${index}]`,
      ),
      condition: condition(value('weather_code'), `daily.weather_code[${index}]`),
      precipitationSumMm: measurement(
        value('precipitation_sum'),
        `daily.precipitation_sum[${index}]`,
      ),
      precipitationProbabilityMaxPct: measurement(
        value('precipitation_probability_max'),
        `daily.precipitation_probability_max[${index}]`,
      ),
    };
  });
  const time = isTimestamp(current.time) ? current.time : null;
  if (time === null) issues.push({ path: 'current', kind: 'invalid-block' });
  let precipitationPreviousHourMm: number | null = null;
  let precipitationPeriod: WeatherData['current']['precipitationPeriod'] = null;
  if (time !== null && isRecord(data.hourly) && Array.isArray(data.hourly.time)) {
    let latest: number | null = null;
    let selectedIndex = -1;
    data.hourly.time.forEach((hour: unknown, index: number) => {
      if (isTimestamp(hour) && hour <= time && (latest === null || hour > latest)) {
        latest = hour;
        selectedIndex = index;
      }
    });
    if (latest !== null && Array.isArray(data.hourly.precipitation)) {
      precipitationPreviousHourMm = measurement(
        data.hourly.precipitation[selectedIndex],
        `hourly.precipitation[${selectedIndex}]`,
      );
      if (precipitationPreviousHourMm !== null) {
        precipitationPeriod = {
          start: new Date((latest - 3600) * 1000).toISOString(),
          end: new Date(latest * 1000).toISOString(),
        };
      }
    }
  }
  if (precipitationPeriod === null) issues.push({ path: 'hourly', kind: 'invalid-block' });
  const currentValue = (field: string) =>
    time === null ? null : measurement(current[field], `current.${field}`);
  return {
    city,
    timezone: data.timezone,
    fetchedAt: new Date().toISOString(),
    current: {
      referenceTime: time === null ? null : new Date(time * 1000).toISOString(),
      temperatureC: currentValue('temperature_2m'),
      condition: time === null ? null : condition(current.weather_code, 'current.weather_code'),
      relativeHumidityPct: currentValue('relative_humidity_2m'),
      windSpeedKmh: currentValue('wind_speed_10m'),
      surfacePressureHpa: currentValue('surface_pressure'),
      precipitationPreviousHourMm,
      precipitationPeriod,
    },
    forecast,
    issues,
  };
}
