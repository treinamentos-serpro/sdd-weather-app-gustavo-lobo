import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import LoadingState from '../../src/components/states/LoadingState';

afterEach(cleanup);

describe('LoadingState', () => {
  it('anuncia carregamento com role status', () => {
    render(<LoadingState />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando dados…');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('permite identificar a operação em andamento', () => {
    render(<LoadingState message="Buscando cidades…" />);

    expect(screen.getByRole('status')).toHaveTextContent('Buscando cidades…');
  });
});

describe('ErrorState', () => {
  it('anuncia a mensagem e permite nova tentativa por clique', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Não foi possível buscar cidades." onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível buscar cidades.');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it.each(['{Enter}', ' '])('permite nova tentativa por teclado usando %s', async (key) => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Não foi possível consultar o clima." onRetry={onRetry} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveFocus();
    await user.keyboard(key);

    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it('respeita bloqueio da nova tentativa recebido por prop', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(
      <ErrorState message="Aguarde para tentar novamente." onRetry={onRetry} disabled />,
    );

    const button = screen.getByRole('button', { name: 'Tentar novamente' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onRetry).not.toHaveBeenCalled();

    rerender(<ErrorState message="Tente novamente." onRetry={onRetry} />);
    expect(button).toBeEnabled();
    await user.click(button);
    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it('não envia um formulário ao tentar novamente', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <ErrorState message="Não foi possível buscar cidades." onRetry={onRetry} />
      </form>,
    );

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('apresenta título e dica distintos de um erro', () => {
    render(<EmptyState />);

    expect(screen.getByRole('status')).toHaveTextContent('Nenhum resultado encontrado');
    expect(
      screen.getByRole('heading', { name: 'Nenhum resultado encontrado' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Tente buscar por outra cidade.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('permite preservar o contexto de uma consulta sem medições', () => {
    render(
      <EmptyState
        title="Medições indisponíveis para São Paulo"
        hint="Não há medições para o período consultado. Tente consultar novamente."
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Medições indisponíveis para São Paulo' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Não há medições para o período consultado.',
    );
  });
});
