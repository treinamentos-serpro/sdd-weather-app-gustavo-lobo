import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';

vi.mock('../../src/services/weatherService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/weatherService')>()),
  searchCities: vi.fn(),
  getWeather: vi.fn(),
}));

const searchMock = vi.mocked(searchCities);
const weatherMock = vi.mocked(getWeather);
const city = mockWeatherData.city;

beforeEach(() => {
  vi.resetAllMocks();
  searchMock.mockResolvedValue([city]);
  weatherMock.mockResolvedValue(mockWeatherData);
});
afterEach(cleanup);

describe('App integrado', () => {
  it.each([
    [0, '32'],
    [100, '212'],
    [-40, '-40'],
  ] as const)('converte as onze temperaturas de %s °C para %s °F sem refazer consultas', async (celsius, fahrenheit) => {
    const data = {
      ...mockWeatherData,
      current: { ...mockWeatherData.current, temperatureC: celsius },
      forecast: mockWeatherData.forecast.map((day) => ({
        ...day,
        minTemperatureC: celsius,
        maxTemperatureC: celsius,
      })),
    };
    const snapshot = structuredClone(data);
    weatherMock.mockResolvedValue(data);
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox', { name: 'Nome da cidade' }), 'São Paulo{Enter}');
    await screen.findByRole('region', { name: 'São Paulo' });
    const main = within(screen.getByRole('main'));
    for (let index = 0; index < 3; index += 1) {
      await user.click(screen.getByRole('button', { name: '°F' }));
      expect(main.getAllByText(`${fahrenheit} °F`, { exact: false })).toHaveLength(11);
      expect(main.queryByText(/°C/)).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: '°C' }));
      expect(main.getAllByText(`${celsius} °C`, { exact: false })).toHaveLength(11);
    }
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(weatherMock).toHaveBeenCalledTimes(1);
    expect(data).toEqual(snapshot);
  });

  it('remove dados anteriores se uma nova consulta falhar, sem fallback para sucesso', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    await screen.findByRole('region', { name: 'São Paulo' });
    weatherMock.mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede.');
    expect(screen.queryByRole('region', { name: 'São Paulo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
  });

  it('inicia idle com Celsius e orientação sem consultar a rede', () => {
    render(<App />);
    expect(screen.getByRole('main')).toHaveTextContent('Como está o clima por aí?');
    expect(screen.getByRole('button', { name: '°C' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Open-Meteo');
    expect(searchMock).not.toHaveBeenCalled();
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('mostra loading e sucesso com cinco dias; unidade não refaz consultas', async () => {
    const user = userEvent.setup();
    let resolve!: (value: typeof mockWeatherData) => void;
    weatherMock.mockReturnValue(
      new Promise((complete) => {
        resolve = complete;
      }),
    );
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('Consultando');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    resolve(mockWeatherData);
    expect(await screen.findByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByText(/Consultado em:/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '°F' }));
    expect(within(screen.getByRole('main')).getAllByText(/°F/)).toHaveLength(11);
    await user.click(screen.getByRole('button', { name: '°C' }));
    expect(within(screen.getByRole('main')).getAllByText(/°C/)).toHaveLength(11);
    expect(searchMock).toHaveBeenCalledExactlyOnceWith('São Paulo');
    expect(weatherMock).toHaveBeenCalledExactlyOnceWith(city);
  });

  it('apresenta vazio sem consultar forecast', async () => {
    searchMock.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'Atlantis{Enter}');
    expect(await screen.findByText('Nenhuma cidade encontrada')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('Atlantis');
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('repete a operação que falhou ao acionar ErrorState e preserva unidade', async () => {
    weatherMock.mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '°F' }));
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede.');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(weatherMock).toHaveBeenCalledTimes(2);
  });

  it('permite selecionar outra cidade encontrada por teclado', async () => {
    const otherCity = { ...city, id: 2, name: 'Recife' };
    searchMock.mockResolvedValue([city, otherCity]);
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    const button = await screen.findByRole('button', { name: /Recife/ });
    weatherMock.mockResolvedValue({ ...mockWeatherData, city: otherCity });
    button.focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('region', { name: 'Recife' })).toBeInTheDocument();
    expect(weatherMock).toHaveBeenLastCalledWith(otherCity);
  });
});
