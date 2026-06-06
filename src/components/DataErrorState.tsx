import { AlertTriangle, RefreshCw } from 'lucide-react';

export function DataErrorState({ onRetry, error }: { onRetry: () => void; error?: Error | null }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
      <AlertTriangle className="mx-auto mb-2 h-7 w-7 text-verdict-must" aria-hidden />
      <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-slate-100">
        Couldn't load the schedule
      </h3>
      <p className="mt-1 text-sm text-slate-400">
        {error?.message || 'The data feed is unreachable. Try again in a moment.'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-verdict-must px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-verdict-must/90 active:scale-[0.98]"
      >
        <RefreshCw className="h-4 w-4" aria-hidden />
        Retry
      </button>
    </div>
  );
}
