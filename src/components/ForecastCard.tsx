import { useId } from 'react';
import { formatDayLabel } from '../lib/format';
import { convertTemperature } from '../lib/temperature';
import { weatherIcons } from '../lib/weatherCodes';
import { formatMeasurement } from '../lib/weatherFormat';
import type { ForecastDay, Unit } from '../types/weather';

export interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  const headingId = useId();
  const conditionLabel = day.condition?.labelPtBr ?? 'Condição indisponível';
  const temperatureSymbol = unit === 'celsius' ? '°C' : '°F';
  const metrics = [
    {
      label: 'Máxima',
      value: convertTemperature(day.maxTemperatureC, unit),
      digits: 1,
      unit: temperatureSymbol,
    },
    {
      label: 'Mínima',
      value: convertTemperature(day.minTemperatureC, unit),
      digits: 1,
      unit: temperatureSymbol,
    },
    {
      label: 'Probabilidade de chuva',
      value: day.precipitationProbabilityMaxPct,
      digits: 0,
      unit: '%',
    },
    { label: 'Precipitação diária', value: day.precipitationSumMm, digits: 1, unit: 'mm' },
  ];

  return (
    <article
      aria-labelledby={headingId}
      className="h-full min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-glass backdrop-blur-md"
    >
      <h3 id={headingId} className="font-semibold">
        <time dateTime={day.date}>{formatDayLabel(day.date)}</time>
      </h3>
      <span role="img" aria-label={conditionLabel} className="mt-4 block text-4xl text-sun">
        {weatherIcons[day.condition?.iconKey ?? 'unknown']}
      </span>
      <p className="mt-2 text-sm text-slate-300">{conditionLabel}</p>
      <dl className="mt-4 space-y-3">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <dt className="text-sm text-slate-300">{metric.label}</dt>
            <dd className="font-semibold">
              {formatMeasurement(metric.value, metric.digits, metric.unit)}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
