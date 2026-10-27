import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import UnitToggle from '../../src/components/UnitToggle';
import { mockWeatherData } from '../../src/mocks/weather';
import type { Unit } from '../../src/types/weather';

afterEach(cleanup);

describe('UnitToggle', () => {
  it('atualiza o clima de 0 °C para 32 °F ao clicar e permite retornar a Celsius', async () => {
    const user = userEvent.setup();
    const current = { ...mockWeatherData.current, temperatureC: 0 };
    const snapshot = structuredClone(current);

    function WeatherWithUnitToggle() {
      const [unit, setUnit] = useState<Unit>('celsius');
      return (
        <>
          <UnitToggle unit={unit} onChange={setUnit} />
          <CurrentWeather city={mockWeatherData.city} current={current} unit={unit} />
        </>
      );
    }

    render(<WeatherWithUnitToggle />);
    const weather = screen.getByRole('region', { name: mockWeatherData.city.name });
    expect(weather).toHaveTextContent(/Temperatura:\s*0 °C/);

    await user.click(screen.getByRole('button', { name: '°F' }));

    expect(weather).toHaveTextContent(/Temperatura:\s*32 °F/);
    expect(weather).not.toHaveTextContent('0 °C');
    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: '°C' }));

    expect(weather).toHaveTextContent(/Temperatura:\s*0 °C/);
    expect(weather).not.toHaveTextContent('32 °F');
    expect(current).toEqual(snapshot);
  });

  it.each<Unit>([
    'celsius',
    'fahrenheit',
  ])('expõe um grupo rotulado com a unidade %s ativa', (unit) => {
    render(<UnitToggle unit={unit} onChange={vi.fn()} />);
    const group = screen.getByRole('group', { name: 'Unidade de temperatura' });

    expect(within(group).getAllByRole('button')).toHaveLength(2);
    expect(within(group).getByRole('button', { name: '°C' })).toHaveAttribute(
      'aria-pressed',
      String(unit === 'celsius'),
    );
    expect(within(group).getByRole('button', { name: '°F' })).toHaveAttribute(
      'aria-pressed',
      String(unit === 'fahrenheit'),
    );
  });

  it('emite a unidade por clique e reflete apenas a prop recebida', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '°F' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');
    expect(screen.getByRole('button', { name: '°C' })).toHaveAttribute('aria-pressed', 'true');

    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);
    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '°C' })).toHaveAttribute('aria-pressed', 'false');

    onChange.mockClear();
    await user.click(screen.getByRole('button', { name: '°C' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('celsius');
  });

  it('permite navegação com Tab/Shift+Tab e ativação com Enter/Espaço', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole('button', { name: '°C' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: '°F' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');

    onChange.mockClear();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: '°C' })).toHaveFocus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('celsius');
  });

  it('não envia um formulário ao ativar os botões', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());
    const onChange = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <UnitToggle unit="celsius" onChange={onChange} />
      </form>,
    );

    await user.click(screen.getByRole('button', { name: '°F' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
