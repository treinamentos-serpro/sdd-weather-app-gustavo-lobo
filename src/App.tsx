import { useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import useWeather from './hooks/useWeather';
import type { Unit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { status, data, cities, error, query, search, selectCity, retry } = useWeather();
  const mainRef = useRef<HTMLElement>(null);

  async function handleRetry() {
    await retry();
    mainRef.current?.focus();
  }

  function formatTime(instant: string | null): string {
    if (instant === null || data === null) return 'Indisponível';
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
          <SearchBar onSearch={search} disabled={status === 'loading'} />
        </header>

        {cities.length > 1 && (
          <section aria-label="Cidades encontradas" className="my-6">
            <h2 className="mb-2 text-sm font-medium">Cidades encontradas</h2>
            <div className="flex flex-wrap gap-2">
              {cities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  disabled={status === 'loading'}
                  aria-pressed={data?.city.id === city.id}
                  onClick={() => selectCity(city)}
                  className={`min-h-11 rounded-lg border border-white/10 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${
                    data?.city.id === city.id
                      ? 'bg-accent-400 font-semibold text-night-900 underline decoration-2 underline-offset-4'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {[city.name, city.admin1, city.country].filter(Boolean).join(', ')}
                </button>
              ))}
            </div>
          </section>
        )}

        <p aria-live="polite" aria-atomic="true" className="sr-only">
          {status === 'success' && data
            ? `Clima de ${data.city.name} disponível com previsão de cinco dias. Temperaturas em ${unit === 'celsius' ? 'Celsius' : 'Fahrenheit'}.`
            : ''}
        </p>
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          className="mt-6 space-y-6 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-400"
        >
          {status === 'idle' && (
            <EmptyState
              title="Como está o clima por aí?"
              hint="Digite o nome de uma cidade para consultar o clima."
            />
          )}
          {status === 'loading' && <LoadingState message="Consultando o clima…" />}
          {status === 'empty' && (
            <EmptyState
              title="Nenhuma cidade encontrada"
              hint={
                query
                  ? `Nenhum resultado para “${query}”. Tente outra cidade.`
                  : 'Digite o nome de uma cidade.'
              }
            />
          )}
          {status === 'error' && (
            <ErrorState
              message={error ?? 'Não foi possível consultar o clima.'}
              onRetry={handleRetry}
            />
          )}
          {status === 'success' && data && (
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
              {data.issues.length > 0 && (
                <p role="status" className="text-sm text-slate-300">
                  Alguns dados meteorológicos estão indisponíveis.
                </p>
              )}
            </>
          )}
        </main>
        <footer className="mt-10 border-t border-white/10 pt-4 text-sm text-slate-400">
          WeatherView · Dados meteorológicos por{' '}
          <a className="underline" href="https://open-meteo.com/">
            Open-Meteo
          </a>
        </footer>
      </div>
    </div>
  );
}
