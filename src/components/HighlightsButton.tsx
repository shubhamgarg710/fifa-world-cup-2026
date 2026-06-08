import { Play } from 'lucide-react';
import { track } from '@vercel/analytics';
import type { Match } from '@/data/sources/types';
import { buildHighlightsUrl } from '@/logic/youtube';

export function HighlightsButton({ match }: { match: Match }) {
  const href = buildHighlightsUrl(match);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('highlights_clicked')}
      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-verdict-must px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-verdict-must/90 active:scale-[0.98]"
    >
      <Play className="h-4 w-4 fill-current" aria-hidden />
      Watch highlights on YouTube
    </a>
  );
}
