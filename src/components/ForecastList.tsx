import { useId } from 'react';
import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';

export interface ForecastListProps {
  forecast: ForecastDay[];
  unit: Unit;
}

export default function ForecastList({ forecast, unit }: ForecastListProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="text-white">
      <h2 id={headingId} className="mb-4 text-2xl font-semibold">
        Previsão de 5 dias
      </h2>
      {forecast.length === 0 ? (
        <p
          role="status"
          className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
        >
          Previsão indisponível
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {forecast.map((day) => (
            <li key={day.date} className="min-w-0">
              <ForecastCard day={day} unit={unit} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
