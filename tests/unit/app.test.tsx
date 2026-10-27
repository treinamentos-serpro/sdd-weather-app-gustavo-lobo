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
