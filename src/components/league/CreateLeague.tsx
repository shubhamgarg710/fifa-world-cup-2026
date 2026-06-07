import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import { createLeague } from '@/data/league/api';

export function CreateLeague() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && displayName.trim().length > 0 && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const code = await createLeague(name, displayName);
      navigate(`/l/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the league.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-slate-50">
        Create a league
      </h2>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="league-name">
        League name
      </label>
      <input
        id="league-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="The Office Sweepstake"
        maxLength={40}
        className="mb-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-base text-slate-100 outline-none focus:border-verdict-must"
      />
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="creator-name">
        Your display name
      </label>
      <input
        id="creator-name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="e.g. Shubham"
        maxLength={24}
        className="mb-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-base text-slate-100 outline-none focus:border-verdict-must"
      />
      {error && <p className="mb-3 text-sm text-verdict-must">{error}</p>}
      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-verdict-must px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-verdict-must/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
        Create &amp; join
      </button>
    </form>
  );
}
