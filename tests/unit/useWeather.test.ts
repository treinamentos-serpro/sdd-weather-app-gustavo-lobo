import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/weatherService')>()),
  searchCities: vi.fn(),
  getWeather: vi.fn(),
}));

const city = mockWeatherData.city;
const otherCity: City = { ...city, id: 2, name: 'Recife' };
const searchMock = vi.mocked(searchCities);
const weatherMock = vi.mocked(getWeather);

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.resetAllMocks();
  searchMock.mockResolvedValue([city, otherCity]);
  weatherMock.mockResolvedValue(mockWeatherData);
});
afterEach(cleanup);

describe('useWeather', () => {
  it('inicia idle e retry sem operação não faz chamadas', async () => {
    const { result } = renderHook(() => useWeather());
    expect(result.current).toMatchObject({
      status: 'idle',
      data: null,
      cities: [],
      error: null,
      query: '',
    });
    await act(() => result.current.retry());
    expect(searchMock).not.toHaveBeenCalled();
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('busca e carrega automaticamente a primeira cidade', async () => {
    const pending = deferred<City[]>();
    searchMock.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useWeather());
    let request: Promise<void>;
    act(() => {
      request = result.current.search(' São Paulo ');
    });
    expect(result.current.status).toBe('loading');
    expect(result.current.query).toBe('São Paulo');
    await act(async () => {
      pending.resolve([city, otherCity]);
      await request;
    });
    expect(weatherMock).toHaveBeenCalledExactlyOnceWith(city);
    expect(result.current).toMatchObject({
      status: 'success',
      cities: [city, otherCity],
      data: mockWeatherData,
      error: null,
    });
  });

  it('não consulta clima se a busca não tem resultados', async () => {
    searchMock.mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('Atlantis'));
    expect(result.current).toMatchObject({ status: 'empty', data: null, cities: [] });
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('repete o termo enviado quando a busca falha', async () => {
    searchMock.mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('Recife'));
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'Falha de rede.',
      query: 'Recife',
    });
    await act(() => result.current.retry());
    expect(searchMock.mock.calls).toEqual([['Recife'], ['Recife']]);
    expect(result.current.status).toBe('success');
    expect(result.current.error).toBeNull();
  });

  it('repete somente forecast após falha do carregamento automático', async () => {
    weatherMock.mockRejectedValueOnce(new WeatherServiceError('A requisição demorou demais.'));
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    expect(result.current.status).toBe('error');
    await act(() => result.current.retry());
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(weatherMock.mock.calls).toEqual([[city], [city]]);
    expect(result.current.status).toBe('success');
  });

  it('seleciona outra cidade e preserva a cidade para retry', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    weatherMock.mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    await act(() => result.current.selectCity(otherCity));
    expect(result.current.data).toBeNull();
    weatherMock.mockResolvedValue({ ...mockWeatherData, city: otherCity });
    await act(() => result.current.retry());
    expect(weatherMock).toHaveBeenLastCalledWith(otherCity);
    expect(result.current.data?.city).toEqual(otherCity);
  });

  it('descarta uma busca antiga antes de iniciar forecast', async () => {
    const old = deferred<City[]>();
    searchMock.mockReturnValueOnce(old.promise);
    const { result } = renderHook(() => useWeather());
    let request: Promise<void>;
    act(() => {
      request = result.current.search('Antiga');
    });
    await act(() => result.current.search('Nova'));
    await act(async () => {
      old.resolve([otherCity]);
      await request;
    });
    expect(result.current.query).toBe('Nova');
    expect(result.current.data).toBe(mockWeatherData);
    expect(weatherMock).toHaveBeenCalledTimes(1);
  });

  it('descarta forecast antigo', async () => {
    const old = deferred<WeatherData>();
    weatherMock.mockReturnValueOnce(old.promise);
    const { result } = renderHook(() => useWeather());
    let request: Promise<void>;
    act(() => {
      request = result.current.selectCity(city);
    });
    weatherMock.mockResolvedValue({ ...mockWeatherData, city: otherCity });
    await act(() => result.current.selectCity(otherCity));
    await act(async () => {
      old.resolve(mockWeatherData);
      await request;
    });
    expect(result.current.data?.city).toEqual(otherCity);
  });

  it('descarta erro antigo sem sobrescrever o sucesso mais recente', async () => {
    let reject!: (cause: Error) => void;
    weatherMock.mockReturnValueOnce(
      new Promise((_resolve, fail) => {
        reject = fail;
      }),
    );
    const { result } = renderHook(() => useWeather());
    let request: Promise<void>;
    act(() => {
      request = result.current.selectCity(city);
    });
    await act(() => result.current.selectCity(otherCity));
    await act(async () => {
      reject(new WeatherServiceError('Falha de rede.'));
      await request;
    });
    expect(result.current.status).toBe('success');
    expect(result.current.error).toBeNull();
  });

  it('não inicia forecast se a busca termina após desmontagem', async () => {
    const pending = deferred<City[]>();
    searchMock.mockReturnValue(pending.promise);
    const { result, unmount } = renderHook(() => useWeather());
    let request: Promise<void>;
    act(() => {
      request = result.current.search('Recife');
    });
    unmount();
    await act(async () => {
      pending.resolve([city]);
      await request;
    });
    expect(weatherMock).not.toHaveBeenCalled();
  });
});
