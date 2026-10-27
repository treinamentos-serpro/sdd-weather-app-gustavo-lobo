import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('App com dados fictícios', () => {
  it('inicia com orientação, busca acessível e Celsius selecionado', () => {
    render(<App />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Nome da cidade' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '°C' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('main')).toHaveTextContent('Como está o clima por aí?');
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      'Não utilize estes dados como previsão real.',
    );
    expect(screen.queryByRole('region', { name: 'São Paulo' })).not.toBeInTheDocument();
  });

  it('exibe o mock ao buscar sem acessar a API nem trocar a cidade pela entrada', async () => {
    const user = userEvent.setup();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);

    await user.type(screen.getByRole('searchbox'), 'Recife{Enter}');

    expect(screen.getByText('Busca digitada: Recife. Exibindo o exemplo.')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByText(/Consultado em:/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('alterna todos os estados sem deixar dados de sucesso visíveis nos demais', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Sucesso' }));
    expect(screen.getAllByRole('article')).toHaveLength(5);
    await user.click(screen.getByRole('button', { name: 'Carregando' }));
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent(
      'Consultando o clima',
    );
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sem resultados' }));
    expect(screen.getByRole('searchbox')).toBeEnabled();
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent(
      'Nenhuma cidade encontrada',
    );

    await user.click(screen.getByRole('button', { name: 'Erro' }));
    expect(screen.getByRole('alert')).toHaveTextContent('erro simulado');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Inicial' }));
    expect(screen.getByRole('main')).toHaveTextContent('Como está o clima por aí?');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('converte as onze temperaturas apenas na renderização e preserva a preferência entre estados', async () => {
    const user = userEvent.setup();
    const snapshot = structuredClone(mockWeatherData);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Sucesso' }));
    expect(screen.getAllByText(/°C/)).toHaveLength(12);

    await user.click(screen.getByRole('button', { name: '°F' }));
    expect(within(screen.getByRole('main')).getAllByText(/°F/)).toHaveLength(11);
    expect(within(screen.getByRole('main')).queryByText(/°C/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Inicial' }));
    await user.click(screen.getByRole('button', { name: 'Sucesso' }));
    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: '°C' }));
    expect(within(screen.getByRole('main')).getAllByText(/°C/)).toHaveLength(11);
    expect(mockWeatherData).toEqual(snapshot);
    expect(fetch).not.toHaveBeenCalled();
  });
});
