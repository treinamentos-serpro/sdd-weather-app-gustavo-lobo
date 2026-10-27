import type { Unit } from '../types/weather';

export function convertTemperature(celsius: number | null, unit: Unit): number | null {
  if (celsius === null) return null;
  return unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius;
}
