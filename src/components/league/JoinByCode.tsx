import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { isWellFormedCode, normalizeCode } from '@/data/league/codes';

/** Code-entry form. Routes to /l/CODE (the league screen handles join/membership). */
export function JoinByCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const normalized = normalizeCode(code);
  const valid = isWellFormedCode(normalized);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (valid) navigate(`/l/${normalized}`);
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-slate-50">
        Join with a code
      </h2>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="join-code">
        League code
      </label>
      <div className="flex gap-2">
        <input
          id="join-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="WC2ABC"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={8}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 font-display text-lg uppercase tracking-[0.3em] text-slate-100 outline-none focus:border-verdict-must"
        />
        <button
          type="submit"
          disabled={!valid}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl bg-verdict-must px-4 text-white transition-colors hover:bg-verdict-must/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Go to league"
        >
          <ArrowRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </form>
  );
}
