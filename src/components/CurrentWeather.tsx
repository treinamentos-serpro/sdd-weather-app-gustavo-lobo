import { useId } from 'react';
import { formatTemperature } from '../lib/temperature';
import { weatherIcons } from '../lib/weatherCodes';
import { formatMeasurement } from '../lib/weatherFormat';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

export interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const headingId = useId();
  const conditionLabel = current.condition?.labelPtBr ?? 'Condição indisponível';
  const iconKey = current.condition?.iconKey ?? 'unknown';
  const metrics = [
    { label: 'Umidade relativa', value: current.relativeHumidityPct, digits: 0, unit: '%' },
    { label: 'Vento', value: current.windSpeedKmh, digits: 1, unit: 'km/h' },
    {
      label: 'Precipitação da hora anterior',
      value: current.precipitationPreviousHourMm,
      digits: 1,
      unit: 'mm',
    },
    { label: 'Pressão na superfície', value: current.surfacePressureHpa, digits: 0, unit: 'hPa' },
  ];

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-glass backdrop-blur-md sm:p-8"
    >
      <p className="text-sm text-slate-300">Clima atual</p>
      <h2 id={headingId} className="mt-1 break-words text-2xl font-semibold sm:text-3xl">
        {city.name}
      </h2>
      <p className="mt-1 text-slate-300">
        {[city.admin1, city.country].filter(Boolean).join(', ')}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <span role="img" aria-label={conditionLabel} className="text-6xl text-sun">
          {weatherIcons[iconKey]}
        </span>
        <p
          className={
            current.temperatureC === null
              ? 'text-2xl font-semibold'
              : 'text-5xl font-semibold tracking-tight sm:text-7xl'
          }
        >
          <span className="sr-only">Temperatura: </span>
          {formatTemperature(current.temperatureC, unit)}
        </p>
      </div>
      <p className="mt-3 text-lg">{conditionLabel}</p>
      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-white/10 bg-night-900/60 p-4">
            <dt className="text-sm text-slate-300">{metric.label}</dt>
            <dd className="mt-1 text-xl font-semibold">
              {formatMeasurement(metric.value, metric.digits, metric.unit)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
