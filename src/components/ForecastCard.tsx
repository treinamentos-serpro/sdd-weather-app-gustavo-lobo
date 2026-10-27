import { useId } from 'react';
import { formatDayLabel } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
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
  const metrics = [
    {
      label: 'Máxima',
      value: formatTemperature(day.maxTemperatureC, unit),
    },
    {
      label: 'Mínima',
      value: formatTemperature(day.minTemperatureC, unit),
    },
    {
      label: 'Probabilidade de chuva',
      value: formatMeasurement(day.precipitationProbabilityMaxPct, 0, '%'),
    },
    { label: 'Precipitação diária', value: formatMeasurement(day.precipitationSumMm, 1, 'mm') },
  ];

  return (
    <article
      aria-labelledby={headingId}
      className="h-full min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-glass backdrop-blur-md"
    >
      <h3 id={headingId} className="font-semibold">
        <time dateTime={formatDayLabel(day.date) === '—' ? undefined : day.date}>
          {formatDayLabel(day.date)}
        </time>
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
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
