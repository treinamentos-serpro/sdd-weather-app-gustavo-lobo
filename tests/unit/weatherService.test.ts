import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWithTimeout,
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const city: City = {
  id: 3390760,
  name: 'Recife',
  admin1: 'Pernambuco',
  country: 'Brasil',
  countryCode: 'BR',
  latitude: -8.05389,
  longitude: -34.88111,
};

function forecastResponse() {
  return {
    timezone: 'America/Recife',
    current: {
      time: 1793114100,
      temperature_2m: 28.4,
      relative_humidity_2m: 74,
      weather_code: 3,
      wind_speed_10m: 18.2,
      surface_pressure: 1011.6,
    },
    hourly: {
      time: [1793109600, 1793113200, 1793116800],
      precipitation: [0.2, 0.4, 9],
    },
    daily: {
      time: [1793070000, 1793156400, 1793242800, 1793329200, 1793415600, 1793502000],
      weather_code: [3, 61, 3, 2, 0, 0],
      temperature_2m_min: [24.1, 24, 24.3, 24.5, 24.2, 24],
      temperature_2m_max: [29.2, 28.7, 29.4, 30, 28.9, 29],
      precipitation_sum: [0.8, 4.2, 0.2, 0, 3.1, 0],
      precipitation_probability_max: [35, 80, 20, 10, 70, 0],
    },
  };
}

const fetchMock = vi.fn<typeof fetch>();
const respond = (data: unknown) => fetchMock.mockResolvedValue(Response.json(data));

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-27T15:20:00Z'));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  fetchMock.mockReset();
});

describe('searchCities', () => {
  it.each(['', '   ', '\n\t'])('não chama a rede para input vazio %j', async (name) => {
    await expect(searchCities(name)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('codifica o nome e mapeia somente os campos de City', async () => {
    respond({
      results: [
        {
          ...city,
          country_code: 'BR',
          timezone: 'America/Recife',
        },
        { id: 2, name: 'Outra cidade', country: 'Brasil', latitude: 0, longitude: 0 },
      ],
    });
    const name = "São João-d'Oeste & região";
    await expect(searchCities(` ${name} `)).resolves.toEqual([
      city,
      {
        id: 2,
        name: 'Outra cidade',
        country: 'Brasil',
        latitude: 0,
        longitude: 0,
        admin1: null,
        countryCode: null,
      },
    ]);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=pt&format=json`,
      { signal: expect.any(AbortSignal) },
    );
  });

  it('mapeia país e nome ausentes para fallbacks seguros', async () => {
    respond({
      results: [
        { id: 2, latitude: 0, longitude: 0 },
      ],
    });

    await expect(searchCities('Local desconhecido')).resolves.toEqual([
      {
        id: 2,
        name: 'Cidade indisponível',
        country: null,
        latitude: 0,
        longitude: 0,
        admin1: null,
        countryCode: null,
      },
    ]);
  });

  it.each([{}, { results: [] }])('retorna lista vazia quando não há resultados', async (data) => {
    respond(data);
    await expect(searchCities('Recife')).resolves.toEqual([]);
  });

  it.each([
    { results: null },
    { results: [{}] },
  ])('rejeita resultados malformados', async (data) => {
    respond(data);
    await expect(searchCities('Recife')).rejects.toBeInstanceOf(WeatherServiceError);
  });
});

describe('getWeather', () => {
  it.each([
    null,
    '28.4',
    undefined,
  ])('isola temperatura atual inválida %j sem perder campos válidos', async (value) => {
    const data = forecastResponse();
    respond({ ...data, current: { ...data.current, temperature_2m: value } });
    const result = await getWeather(city);
    expect(result.current.temperatureC).toBeNull();
    expect(result.current.relativeHumidityPct).toBe(74);
    expect(result.current.windSpeedKmh).toBe(18.2);
    expect(result.forecast).toHaveLength(5);
    expect(result.issues).toEqual([{ path: 'current.temperature_2m', kind: 'invalid-field' }]);
  });

  it('preserva os demais arrays quando temperaturas diárias têm tipos inválidos ou faltam', async () => {
    const data = forecastResponse();
    respond({
      ...data,
      daily: { ...data.daily, temperature_2m_min: [null, '24', 0], temperature_2m_max: undefined },
    });
    const result = await getWeather(city);
    expect(result.forecast.map((day) => day.minTemperatureC)).toEqual([null, null, 0, null, null]);
    expect(result.forecast.map((day) => day.maxTemperatureC)).toEqual([
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(result.forecast.map((day) => day.precipitationSumMm)).toEqual([0.8, 4.2, 0.2, 0, 3.1]);
    expect(result.forecast[0].condition?.code).toBe(3);
    expect(result.issues).toHaveLength(9);
  });

  it.each([
    undefined,
    { time: [1793116800], precipitation: [9] },
  ])('não usa precipitação futura nem inventa valores quando hourly é %j', async (hourly) => {
    respond({ ...forecastResponse(), hourly });
    const result = await getWeather(city);
    expect(result.current.precipitationPreviousHourMm).toBeNull();
    expect(result.current.precipitationPeriod).toBeNull();
    expect(result.current.temperatureC).toBe(28.4);
    expect(result.forecast).toHaveLength(5);
    expect(result.issues).toContainEqual({ path: 'hourly', kind: 'invalid-block' });
  });

  it.each([
    {
      timezone: 'Pacific/Kiritimati',
      times: [
        '2026-12-30T10:00:00Z',
        '2026-12-31T10:00:00Z',
        '2027-01-01T10:00:00Z',
        '2027-01-02T10:00:00Z',
        '2027-01-03T10:00:00Z',
      ],
      dates: ['2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03', '2027-01-04'],
    },
    {
      timezone: 'America/New_York',
      times: [
        '2026-10-31T04:00:00Z',
        '2026-11-01T04:00:00Z',
        '2026-11-02T05:00:00Z',
        '2026-11-03T05:00:00Z',
        '2026-11-04T05:00:00Z',
      ],
      dates: ['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'],
    },
  ])('preserva cinco datas locais em $timezone, inclusive transições de calendário/offset', async ({
    timezone,
    times,
    dates,
  }) => {
    const data = forecastResponse();
    respond({
      ...data,
      timezone,
      daily: { ...data.daily, time: times.map((time) => Date.parse(time) / 1000) },
    });
    const result = await getWeather(city);
    expect(result.forecast.map((day) => day.date)).toEqual(dates);
    expect(result.city).toBe(city);
  });

  it('solicita unidades canônicas e mapeia current e exatamente cinco índices diários', async () => {
    respond(forecastResponse());
    const result = await getWeather(city);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(Object.fromEntries(url.searchParams)).toEqual({
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
    expect(result.city).toBe(city);
    expect(result.timezone).toBe('America/Recife');
    expect(result.fetchedAt).toBe('2026-10-27T15:20:00.000Z');
    expect(result.issues).toEqual([]);
    expect(result.current).toEqual({
      referenceTime: '2026-10-27T15:15:00.000Z',
      temperatureC: 28.4,
      relativeHumidityPct: 74,
      condition: { code: 3, labelPtBr: 'Nublado', iconKey: 'cloudy' },
      windSpeedKmh: 18.2,
      surfacePressureHpa: 1011.6,
      precipitationPreviousHourMm: 0.4,
      precipitationPeriod: {
        start: '2026-10-27T14:00:00.000Z',
        end: '2026-10-27T15:00:00.000Z',
      },
    });
    expect(result.forecast.map((day) => day.date)).toEqual([
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
    ]);
    result.forecast.forEach((day, index) => {
      const daily = forecastResponse().daily;
      expect(day).toEqual({
        date: `2026-10-${27 + index}`,
        minTemperatureC: daily.temperature_2m_min[index],
        maxTemperatureC: daily.temperature_2m_max[index],
        condition: expect.objectContaining({ code: daily.weather_code[index] }),
        precipitationSumMm: daily.precipitation_sum[index],
        precipitationProbabilityMaxPct: daily.precipitation_probability_max[index],
      });
    });
  });

  it.each(['current', 'daily'])('mapeia bloco %s ausente ou nulo sem expor valores indefinidos', async (block) => {
    for (const value of [undefined, null]) {
      respond({ ...forecastResponse(), [block]: value });
      const result = await getWeather(city);
      if (block === 'current') {
        expect(result.current.temperatureC).toBeNull();
        expect(result.current.relativeHumidityPct).toBeNull();
        expect(result.current.windSpeedKmh).toBeNull();
        expect(result.current.surfacePressureHpa).toBeNull();
        expect(result.current.condition).toBeNull();
      } else {
        expect(result.forecast).toEqual([]);
      }
      expect(JSON.stringify(result)).not.toContain('undefined');
      expect(result.issues).toContainEqual({ path: block, kind: 'invalid-block' });
    }
  });

  it.each([
    ['precipitation_probability_max', 'precipitationProbabilityMaxPct'],
    ['precipitation_sum', 'precipitationSumMm'],
  ] as const)('distingue null de zero no campo diário %s', async (field, property) => {
    const data = forecastResponse();
    respond({
      ...data,
      daily: { ...data.daily, [field]: [null, 0] },
    });
    const result = await getWeather(city);
    expect(result.forecast.map((day) => day[property])).toEqual([null, 0, null, null, null]);
    expect(result.issues).toEqual(
      [0, 2, 3, 4].map((index) => ({
        path: `daily.${field}[${index}]`,
        kind: 'invalid-field',
      })),
    );
  });

  it.each([
    null,
    0,
  ])('preserva precipitação horária %j sem confundir ausência com zero', async (value) => {
    const data = forecastResponse();
    respond({
      ...data,
      hourly: { ...data.hourly, precipitation: [0.2, value, 9] },
    });
    const result = await getWeather(city);
    expect(result.current.precipitationPreviousHourMm).toBe(value);
    if (value === null) {
      expect(result.current.precipitationPeriod).toBeNull();
      expect(result.issues).toEqual([
        { path: 'hourly.precipitation[1]', kind: 'invalid-field' },
        { path: 'hourly', kind: 'invalid-block' },
      ]);
    } else {
      expect(result.current.precipitationPeriod).toEqual({
        start: '2026-10-27T14:00:00.000Z',
        end: '2026-10-27T15:00:00.000Z',
      });
      expect(result.issues).toEqual([]);
    }
  });

  it('preserva medições atuais mesmo quando o instante atual é inválido', async () => {
    const data = forecastResponse();
    respond({ ...data, current: { ...data.current, time: null } });
    const result = await getWeather(city);
    expect(result.current.referenceTime).toBeNull();
    expect(result.current.temperatureC).toBe(data.current.temperature_2m);
    expect(result.current.relativeHumidityPct).toBe(data.current.relative_humidity_2m);
    expect(result.current.condition?.code).toBe(data.current.weather_code);
    expect(result.forecast).toHaveLength(5);
    expect(result.issues).toContainEqual({ path: 'current.time', kind: 'invalid-field' });
  });

  it('preserva dias com datas válidas e ignora datas diárias ausentes ou inválidas', async () => {
    respond({
      ...forecastResponse(),
      daily: { ...forecastResponse().daily, time: [1793070000, null, 1793242800] },
    });
    const result = await getWeather(city);
    expect(result.forecast.map((day) => day.date)).toEqual(['2026-10-27', '2026-10-29']);
    expect(result.issues).toContainEqual({ path: 'daily.time[1]', kind: 'invalid-field' });
    expect(result.issues).toContainEqual({ path: 'daily.time', kind: 'invalid-block' });
  });

  it.each([
    { timezone: 'invalid/timezone' },
    { timezone: null },
  ])('rejeita fuso horário ausente ou inválido', async (override) => {
    respond({ ...forecastResponse(), ...override });
    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });
});

describe.each([
  ['busca', () => searchCities('Recife')],
  ['forecast', () => getWeather(city)],
] as const)('erros de %s', (_name, operation) => {
  it.each([
    400, 429, 500, 503,
  ])('lança erro tipado para HTTP %s, sem retry automático', async (status) => {
    fetchMock.mockResolvedValue(new Response(null, { status }));
    await expect(operation()).rejects.toBeInstanceOf(WeatherServiceError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserva a causa da falha de rede', async () => {
    const cause = new TypeError('Failed to fetch');
    fetchMock.mockRejectedValue(cause);
    await expect(operation()).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: expect.stringContaining('falha de rede.'),
      cause,
    });
  });

  it('rejeita JSON inválido', async () => {
    fetchMock.mockImplementation(async () => new Response('{'));
    await expect(operation()).rejects.toBeInstanceOf(WeatherServiceError);
  });
});

describe('fetchWithTimeout', () => {
  it('aborta em exatamente 10 segundos e limpa o timer', async () => {
    let signal: AbortSignal | undefined;
    fetchMock.mockImplementation((_url, options) => {
      signal = options?.signal ?? undefined;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    });
    const request = fetchWithTimeout('https://example.test');
    const rejection = expect(request).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message:
        'A requisição excedeu o tempo limite de 10 segundos. Verifique sua conexão e tente novamente.',
    });
    await vi.advanceTimersByTimeAsync(9999);
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await rejection;
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('limpa o timer em sucesso e falha de rede', async () => {
    respond({});
    await fetchWithTimeout('https://example.test');
    expect(vi.getTimerCount()).toBe(0);
    fetchMock.mockRejectedValue(new TypeError('Network'));
    await expect(fetchWithTimeout('https://example.test')).rejects.toThrow(
      'por falha de rede. Verifique sua conexão e tente novamente.',
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it('mantém o timeout ativo durante a leitura do corpo JSON', async () => {
    let signal: AbortSignal | undefined;
    const response = Response.json({});
    Object.defineProperty(response, 'json', {
      value: () =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    });
    fetchMock.mockImplementation((_url, options) => {
      signal = options?.signal ?? undefined;
      return Promise.resolve(response);
    });

    const request = searchCities('Recife');
    const rejection = expect(request).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message:
        'A busca por cidades excedeu o tempo limite de 10 segundos. Verifique sua conexão e tente novamente.',
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await rejection;
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
