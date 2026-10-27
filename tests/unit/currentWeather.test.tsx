import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import { mockWeatherData } from '../../src/mocks/weather';
import type { CurrentWeather as CurrentWeatherData } from '../../src/types/weather';

afterEach(cleanup);

const current: CurrentWeatherData = {
  ...mockWeatherData.current,
  temperatureC: 20.04,
  condition: { code: 0, labelPtBr: 'Céu limpo', iconKey: 'clear' },
  surfacePressureHpa: 1013.67,
};

function formatted(value: number, digits: number) {
  return new Intl.NumberFormat(undefined, {
    useGrouping: false,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

describe('CurrentWeather', () => {
  it('apresenta cidade, ícone acessível e indicadores com precisão e unidades corretas', () => {
    render(<CurrentWeather city={mockWeatherData.city} current={current} unit="celsius" />);

    expect(screen.getByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Céu limpo' })).toHaveTextContent('☀️');
    expect(screen.getByText('Céu limpo')).toBeInTheDocument();
    for (const text of [
      `${formatted(20.04, 1)} °C`,
      `${formatted(63.4, 0)}%`,
      `${formatted(12.34, 1)} km/h`,
      `${formatted(0.46, 1)} mm`,
      `${formatted(1013.67, 0)} hPa`,
    ]) {
      expect(screen.getByText(text, { exact: false })).toBeInTheDocument();
    }
    expect(screen.getByText('Precipitação da hora anterior')).toBeInTheDocument();
    expect(screen.getByText('Pressão na superfície')).toBeInTheDocument();
  });

  it('alterna somente a temperatura sem alterar dados ou acumular arredondamento', () => {
    const snapshot = structuredClone(current);
    const { rerender } = render(
      <CurrentWeather city={mockWeatherData.city} current={current} unit="fahrenheit" />,
    );
    expect(screen.getByText(`${formatted(68.072, 1)} °F`, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(`${formatted(12.34, 1)} km/h`)).toBeInTheDocument();

    rerender(<CurrentWeather city={mockWeatherData.city} current={current} unit="celsius" />);
    expect(screen.getByText(`${formatted(20.04, 1)} °C`, { exact: false })).toBeInTheDocument();
    expect(current).toEqual(snapshot);
  });

  it('distingue medições ausentes de zero e apresenta condição indisponível', () => {
    const empty: CurrentWeatherData = {
      referenceTime: null,
      temperatureC: null,
      condition: null,
      relativeHumidityPct: null,
      windSpeedKmh: null,
      surfacePressureHpa: null,
      precipitationPreviousHourMm: 0,
      precipitationPeriod: null,
    };
    render(<CurrentWeather city={mockWeatherData.city} current={empty} unit="fahrenheit" />);

    expect(screen.getAllByText('Indisponível', { exact: true })).toHaveLength(4);
    expect(screen.getByRole('img', { name: 'Condição indisponível' })).toHaveTextContent('❔');
    expect(screen.getByText(`${formatted(0, 1)} mm`)).toBeInTheDocument();
    expect(screen.queryByText(/°F/)).not.toBeInTheDocument();
  });
});
