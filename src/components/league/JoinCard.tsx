import { useState } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { joinLeague, NameTakenError } from '@/data/league/api';

/** Name prompt shown when this device isn't yet a member of the league. */
export function JoinCard({ code, leagueName, onJoined }: { code: string; leagueName: string; onJoined: () => void }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = name.trim().length > 0 && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await joinLeague(code, name);
      onJoined();
    } catch (err) {
      setError(
        err instanceof NameTakenError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not join.',
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="font-display text-xl font-bold uppercase tracking-wide text-slate-50">
        Join “{leagueName}”
      </h2>
      <p className="mb-4 mt-1 text-sm text-slate-400">Pick a display name your friends will recognize.</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        maxLength={24}
        aria-label="Display name"
        className="mb-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-base text-slate-100 outline-none focus:border-verdict-must"
      />
      {error && <p className="mb-3 text-sm text-verdict-must">{error}</p>}
      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-verdict-must px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-verdict-must/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LogIn className="h-4 w-4" aria-hidden />}
        Join league
      </button>
    </form>
  );
}
