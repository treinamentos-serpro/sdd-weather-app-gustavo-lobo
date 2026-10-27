import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, ForecastDay, WeatherData, WeatherDataIssue } from '../types/weather';

export class WeatherServiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'WeatherServiceError';
  }
}

const REQUEST_TIMEOUT_MS = 10_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAbortError(value: unknown): boolean {
  return isRecord(value) && value.name === 'AbortError';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isTimestamp(value: unknown): value is number {
  return (
    isNumber(value) && Number.isInteger(value) && !Number.isNaN(new Date(value * 1000).getTime())
  );
}

async function requestWithTimeout<T>(
  url: string,
  operation: string,
  readResponse: (response: Response) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return await readResponse(response);
  } catch (cause) {
    if (cause instanceof WeatherServiceError) throw cause;

    const message = timedOut || isAbortError(cause)
      ? `A ${operation} excedeu o tempo limite de 10 segundos. Verifique sua conexão e tente novamente.`
      : `Não foi possível concluir a ${operation} por falha de rede. Verifique sua conexão e tente novamente.`;
    throw new WeatherServiceError(message, { cause });
  } finally {
    clearTimeout(timeout);
  }
}

export function fetchWithTimeout(url: string): Promise<Response> {
  return requestWithTimeout(url, 'requisição', async (response) => response);
}

async function fetchJson(url: string, operation: string): Promise<Record<string, unknown>> {
  const operationLabel = operation === 'buscar cidades' ? 'busca por cidades' : 'consulta do clima';
  return requestWithTimeout(url, operationLabel, async (response) => {
    if (!response.ok) {
      const message =
        response.status === 429
          ? `O serviço recebeu muitas solicitações durante a ${operationLabel}. Tente novamente em instantes.`
          : response.status >= 500
            ? `O serviço está temporariamente indisponível durante a ${operationLabel}. Tente novamente.`
            : `Não foi possível concluir a ${operationLabel} (erro HTTP ${response.status}). Tente novamente.`;
      throw new WeatherServiceError(message);
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch (cause) {
      if (isAbortError(cause)) throw cause;
      throw new WeatherServiceError(`A resposta recebida durante a ${operationLabel} é inválida.`, {
        cause,
      });
    }
    if (!isRecord(data)) {
      throw new WeatherServiceError(`A resposta recebida durante a ${operationLabel} é inválida.`);
    }
    return data;
  });
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
      !isNumber(result.latitude) ||
      !isNumber(result.longitude)
    ) {
      throw new WeatherServiceError('Resposta inválida ao buscar cidades.');
    }
    return {
      id: result.id,
      name:
        typeof result.name === 'string' && result.name.trim()
          ? result.name
          : 'Cidade indisponível',
      country: typeof result.country === 'string' && result.country.trim() ? result.country : null,
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
  const current = isRecord(data.current) ? data.current : {};
  const daily = isRecord(data.daily) ? data.daily : {};
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
  const issues: WeatherDataIssue[] = [];
  if (!isRecord(data.current)) issues.push({ path: 'current', kind: 'invalid-block' });
  if (!isRecord(data.daily)) issues.push({ path: 'daily', kind: 'invalid-block' });
  const measurement = (value: unknown, path: string): number | null => {
    if (isNumber(value)) return value;
    issues.push({ path, kind: 'invalid-field' });
    return null;
  };
  const condition = (value: unknown, path: string) => {
    const code = measurement(value, path);
    return code === null ? null : getWeatherCondition(code);
  };
  const dailyTimes = Array.isArray(daily.time) ? daily.time.slice(0, 5) : [];
  if (isRecord(data.daily) && (!Array.isArray(daily.time) || dailyTimes.length < 5)) {
    issues.push({ path: 'daily.time', kind: 'invalid-block' });
  }
  const forecast: ForecastDay[] = dailyTimes.flatMap((time: unknown, index: number) => {
    if (!isTimestamp(time)) {
      issues.push({ path: `daily.time[${index}]`, kind: 'invalid-field' });
      return [];
    }
    const parts = dateFormatter.formatToParts(new Date(time * 1000));
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((entry) => entry.type === type)?.value;
    const year = part('year');
    const month = part('month');
    const day = part('day');
    if (!year || !month || !day) {
      issues.push({ path: `daily.time[${index}]`, kind: 'invalid-field' });
      return [];
    }
    const value = (field: string) =>
      Array.isArray(daily[field]) ? daily[field][index] : undefined;
    return [{
      date: `${year}-${month}-${day}`,
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
    }];
  });
  const time = isTimestamp(current.time) ? current.time : null;
  if (time === null && isRecord(data.current)) {
    issues.push({ path: 'current.time', kind: 'invalid-field' });
  }
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
  const currentValue = (field: string) => measurement(current[field], `current.${field}`);
  return {
    city,
    timezone: data.timezone,
    fetchedAt: new Date().toISOString(),
    current: {
      referenceTime: time === null ? null : new Date(time * 1000).toISOString(),
      temperatureC: currentValue('temperature_2m'),
      condition: condition(current.weather_code, 'current.weather_code'),
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
