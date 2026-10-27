export interface EmptyStateProps {
  title?: string;
  hint?: string;
}

export default function EmptyState({
  title = 'Nenhum resultado encontrado',
  hint = 'Tente buscar por outra cidade.',
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-glass backdrop-blur-md"
    >
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-slate-300">{hint}</p>
    </div>
  );
}
