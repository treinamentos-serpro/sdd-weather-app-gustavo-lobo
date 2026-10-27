export function formatMeasurement(
  value: number | null,
  fractionDigits: number,
  unit: string,
  locale?: string,
): string {
  if (value === null) return 'Indisponível';
  const formatted = new Intl.NumberFormat(locale, {
    useGrouping: false,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
  return `${formatted}${unit === '%' ? '' : ' '}${unit}`;
}
