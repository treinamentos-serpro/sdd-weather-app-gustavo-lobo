import type { Unit } from '../types/weather';
import { formatMeasurement } from './weatherFormat';

export function convertTemperature(celsius: number | null, unit: Unit): number | null {
  if (celsius === null) return null;
  return unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius;
}

export function unitLabel(unit: Unit): string {
  return unit === 'celsius' ? '°C' : '°F';
}

export function formatTemperature(celsius: number | null, unit: Unit, locale?: string): string {
  return formatMeasurement(convertTemperature(celsius, unit), 0, unitLabel(unit), locale);
}
