import type { Unit } from '../types/weather';

export interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 shadow-glass backdrop-blur-md"
    >
      {(['celsius', 'fahrenheit'] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={unit === value}
          onClick={() => onChange(value)}
          className={`min-h-11 min-w-11 rounded-lg px-4 py-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${
            unit === value
              ? 'bg-accent-400 text-night-900 underline decoration-2 underline-offset-4'
              : 'text-white hover:bg-white/10'
          }`}
        >
          {value === 'celsius' ? '°C' : '°F'}
        </button>
      ))}
    </div>
  );
}
