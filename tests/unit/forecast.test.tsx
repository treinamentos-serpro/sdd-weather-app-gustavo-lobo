import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ForecastCard from '../../src/components/ForecastCard';
import ForecastList from '../../src/components/ForecastList';
import { formatDayLabel } from '../../src/lib/format';
import { mockWeatherData } from '../../src/mocks/weather';
import type { ForecastDay } from '../../src/types/weather';

afterEach(cleanup);

const day: ForecastDay = {
  date: '2026-10-27',
  minTemperatureC: 12.26,
  maxTemperatureC: 19.96,
  condition: { code: 3, labelPtBr: 'Nublado', iconKey: 'cloudy' },
  precipitationSumMm: 2.26,
  precipitationProbabilityMaxPct: 67.4,
};

function formatted(value: number, digits: number) {
  return new Intl.NumberFormat(undefined, {
    useGrouping: false,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

describe('ForecastCard', () => {
  it('apresenta data semântica, condição acessível e indicadores na precisão correta', () => {
    render(<ForecastCard day={day} unit="celsius" />);

    expect(screen.getByRole('article', { name: formatDayLabel(day.date) })).toBeInTheDocument();
    expect(screen.getByText(formatDayLabel(day.date))).toHaveAttribute('datetime', day.date);
    expect(screen.getByRole('img', { name: 'Nublado' })).toHaveTextContent('☁️');
    expect(screen.getByText('Nublado')).toBeInTheDocument();
    expect(screen.getByText('Máxima')).toBeInTheDocument();
    expect(screen.getByText('Mínima')).toBeInTheDocument();
    expect(screen.getByText(`${formatted(19.96, 0)} °C`)).toBeInTheDocument();
    expect(screen.getByText(`${formatted(12.26, 0)} °C`)).toBeInTheDocument();
    expect(screen.getByText(`${formatted(2.26, 1)} mm`)).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('converte máxima e mínima sem alterar probabilidade, acumulado ou dados originais', () => {
    const snapshot = structuredClone(day);
    const { rerender } = render(<ForecastCard day={day} unit="celsius" />);
    rerender(<ForecastCard day={day} unit="fahrenheit" />);

    expect(screen.getByText(`${formatted(67.928, 0)} °F`)).toBeInTheDocument();
    expect(screen.getByText(`${formatted(54.068, 0)} °F`)).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument();
    expect(screen.getByText(`${formatted(2.26, 1)} mm`)).toBeInTheDocument();

    rerender(<ForecastCard day={day} unit="celsius" />);
    expect(screen.getByText(`${formatted(19.96, 0)} °C`)).toBeInTheDocument();
    expect(day).toEqual(snapshot);
  });

  it('distingue ausências de zero sem inventar condição meteorológica', () => {
    render(
      <ForecastCard
        day={{
          ...day,
          minTemperatureC: null,
          maxTemperatureC: null,
          condition: null,
          precipitationSumMm: null,
          precipitationProbabilityMaxPct: 0,
        }}
        unit="fahrenheit"
      />,
    );

    expect(screen.getAllByText('Indisponível', { exact: true })).toHaveLength(3);
    expect(screen.getByRole('img', { name: 'Condição indisponível' })).toHaveTextContent('❔');
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.queryByText(/°F/)).not.toBeInTheDocument();
  });
});

describe('ForecastList', () => {
  it('renderiza os cinco dias em ordem e propaga a unidade a todos os cartões', () => {
    const { rerender } = render(
      <ForecastList forecast={mockWeatherData.forecast} unit="celsius" />,
    );
    const region = screen.getByRole('region', { name: 'Previsão de 5 dias' });
    expect(within(region).getAllByRole('listitem')).toHaveLength(5);
    expect(
      within(region)
        .getAllByRole('heading', { level: 3 })
        .map((node) => node.textContent),
    ).toEqual(mockWeatherData.forecast.map((forecastDay) => formatDayLabel(forecastDay.date)));
    expect(within(region).getAllByText(/°C/)).toHaveLength(10);

    rerender(<ForecastList forecast={mockWeatherData.forecast} unit="fahrenheit" />);
    expect(within(region).getAllByText(/°F/)).toHaveLength(10);
    expect(within(region).queryByText(/°C/)).not.toBeInTheDocument();
  });

  it('informa previsão vazia sem inventar cartões ou datas', () => {
    render(<ForecastList forecast={[]} unit="celsius" />);

    expect(screen.getByRole('status')).toHaveTextContent('Previsão indisponível');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
