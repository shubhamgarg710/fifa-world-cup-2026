import { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';

/** Prominent league code with copy + native-share. */
export function ShareCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/l/${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the code is visible to type manually */
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join my World Cup league', text: `Join my league — code ${code}`, url: shareUrl });
      } catch {
        /* user cancelled */
      }
    } else {
      copy();
    }
  }

  return (
    <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Share this code</p>
      <p className="nums my-1 font-display text-4xl font-bold uppercase tracking-[0.4em] text-gold">{code}</p>
      <div className="mt-2 flex justify-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800 active:scale-95"
        >
          {copied ? <Check className="h-4 w-4 text-verdict-worth" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <button
          type="button"
          onClick={share}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800 active:scale-95"
        >
          <Share2 className="h-4 w-4" aria-hidden />
          Share
        </button>
      </div>
    </div>
  );
}
