/** A data já é civil no fuso da cidade; UTC evita deslocá-la para outro dia. */
export function formatDayLabel(date: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}
