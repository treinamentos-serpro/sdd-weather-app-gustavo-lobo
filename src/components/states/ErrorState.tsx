export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  disabled?: boolean;
}

export default function ErrorState({ message, onRetry, disabled = false }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-glass backdrop-blur-md">
      <p role="alert">{message}</p>
      <button
        type="button"
        onClick={() => onRetry()}
        disabled={disabled}
        className="mt-4 rounded-xl bg-accent-400 px-5 py-3 font-semibold text-night-900 hover:bg-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Tentar novamente
      </button>
    </div>
  );
}
