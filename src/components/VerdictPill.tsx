import type { Label } from '@/logic/verdict';
import { cn } from './cn';

const STYLES: Record<Label, { label: string; cls: string }> = {
  'must-watch': {
    label: 'Must-watch',
    cls: 'bg-verdict-must text-white',
  },
  'worth-a-look': {
    label: 'Worth a look',
    cls: 'bg-verdict-worth/90 text-slate-950',
  },
  skip: {
    label: 'Skip',
    cls: 'bg-slate-800 text-slate-300',
  },
};

export function VerdictPill({ label, className }: { label: Label; className?: string }) {
  const s = STYLES[label];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
        s.cls,
        className,
      )}
    >
      {s.label}
    </span>
  );
}
