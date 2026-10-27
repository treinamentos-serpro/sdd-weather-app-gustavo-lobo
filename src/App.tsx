import { useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { mockWeatherData } from './mocks/weather';
import type { Unit } from './types/weather';

const demoStates = [
  { value: 'idle', label: 'Inicial' },
  { value: 'loading', label: 'Carregando' },
  { value: 'empty', label: 'Sem resultados' },
  { value: 'error', label: 'Erro' },
  { value: 'success', label: 'Sucesso' },
] as const;

type DemoStatus = (typeof demoStates)[number]['value'];

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const [status, setStatus] = useState<DemoStatus>('idle');
  const [searchTerm, setSearchTerm] = useState('');
  const mainRef = useRef<HTMLElement>(null);
  const data = mockWeatherData;

  function handleSearch(city: string) {
    setSearchTerm(city);
    setStatus('success');
  }

  function formatTime(instant: string | null): string {
    if (instant === null) return 'Indisponível';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: data.timezone,
    }).format(new Date(instant));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-night-900 via-night-800 to-night-900 text-white">
      <a
        href="#main-content"
        className="sr-only rounded-lg bg-accent-400 p-3 text-night-900 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10"
      >
        Ir para o conteúdo
      </a>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent-400">
                WeatherView
              </p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
                O clima, de um jeito simples
              </h1>
            </div>
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
          <SearchBar onSearch={handleSearch} disabled={status === 'loading'} />
        </header>

        <aside aria-label="Demonstração com dados fictícios" className="my-6 space-y-3">
          <p className="text-sm text-slate-300">
            Modo demonstração: dados fictícios e fixos de São Paulo, de 27 a 31 de outubro de 2026.
            Nenhuma busca consulta a API ou altera a cidade do exemplo.
          </p>
          {searchTerm && (
            <p className="text-sm text-slate-300">
              Busca digitada: {searchTerm}. Exibindo o exemplo.
            </p>
          )}
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Estado de demonstração</legend>
            <div className="flex flex-wrap gap-2">
              {demoStates.map((state) => (
                <button
                  key={state.value}
                  type="button"
                  aria-pressed={status === state.value}
                  onClick={() => setStatus(state.value)}
                  className={`min-h-11 rounded-lg border border-white/10 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${
                    status === state.value
                      ? 'bg-accent-400 font-semibold text-night-900 underline decoration-2 underline-offset-4'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {state.label}
                </button>
              ))}
            </div>
          </fieldset>
        </aside>

        <p aria-live="polite" aria-atomic="true" className="sr-only">
          {status === 'success'
            ? `Exemplo de ${data.city.name} disponível com previsão de cinco dias. Temperaturas em ${unit === 'celsius' ? 'Celsius' : 'Fahrenheit'}.`
            : ''}
        </p>
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          className="space-y-6 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-400"
        >
          {status === 'idle' && (
            <EmptyState
              title="Como está o clima por aí?"
              hint="Digite uma cidade para abrir o exemplo ou escolha um estado de demonstração."
            />
          )}
          {status === 'loading' && <LoadingState message="Consultando o clima (demonstração)…" />}
          {status === 'empty' && (
            <EmptyState
              title="Nenhuma cidade encontrada nesta demonstração"
              hint="Edite a busca ou escolha Sucesso para visualizar os dados fictícios."
            />
          )}
          {status === 'error' && (
            <ErrorState
              message="Não foi possível consultar o clima (erro simulado)."
              onRetry={() => {
                setStatus('success');
                mainRef.current?.focus();
              }}
            />
          )}
          {status === 'success' && (
            <>
              <CurrentWeather city={data.city} current={data.current} unit={unit} />
              <div className="space-y-1 text-sm text-slate-300">
                <p>Consultado em: {formatTime(data.fetchedAt)}</p>
                <p>Dados referentes a: {formatTime(data.current.referenceTime)}</p>
                <p>
                  Intervalo da precipitação:{' '}
                  {data.current.precipitationPeriod
                    ? `${formatTime(data.current.precipitationPeriod.start)} – ${formatTime(data.current.precipitationPeriod.end)}`
                    : 'Indisponível'}
                </p>
                <p>Fuso horário: {data.timezone}</p>
              </div>
              <ForecastList forecast={data.forecast} unit={unit} />
            </>
          )}
        </main>
        <footer className="mt-10 border-t border-white/10 pt-4 text-sm text-slate-400">
          WeatherView · Interface de demonstração · Não utilize estes dados como previsão real.
        </footer>
      </div>
    </div>
  );
}
