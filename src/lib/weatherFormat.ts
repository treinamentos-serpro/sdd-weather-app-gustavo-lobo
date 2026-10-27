export function formatMeasurement(
  value: number | null | undefined,
  fractionDigits: number,
  unit: string,
  locale?: string,
): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  const formatted = new Intl.NumberFormat(locale, {
    useGrouping: false,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
  return `${formatted}${unit === '%' ? '' : ' '}${unit}`;
}
