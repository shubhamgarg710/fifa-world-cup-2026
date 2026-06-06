import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { X, Heart, Eye } from 'lucide-react';
import {
  teamsByConfederation,
  teamFlag,
  type Confederation,
} from '@/data/static';
import { setMyTeams, useMyTeams } from '@/state/preferences';
import { cn } from './cn';

const CONFED_LABELS: Record<Confederation, string> = {
  UEFA: 'Europe (UEFA)',
  CONMEBOL: 'South America (CONMEBOL)',
  CONCACAF: 'North America (CONCACAF)',
  CAF: 'Africa (CAF)',
  AFC: 'Asia (AFC)',
  OFC: 'Oceania (OFC)',
};

export function TeamsPickerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const myTeams = useMyTeams();
  const groups = teamsByConfederation();

  /** Toggle a team into one of the two lists. A team can be in at most one. */
  const toggleSimple = (name: string, list: 'support' | 'follow') => {
    const inThis = myTeams[list].includes(name);
    const supportWithout = myTeams.support.filter((t) => t !== name);
    const followWithout = myTeams.follow.filter((t) => t !== name);
    setMyTeams({
      support: list === 'support' ? (inThis ? supportWithout : [...supportWithout, name]) : supportWithout,
      follow: list === 'follow' ? (inThis ? followWithout : [...followWithout, name]) : followWithout,
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-3xl border border-slate-800 bg-slate-950 shadow-2xl',
            'sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl',
          )}
        >
          <header className="flex items-center justify-between border-b border-slate-900 px-5 py-4 sm:px-7">
            <div>
              <Dialog.Title className="font-display text-xl font-bold uppercase tracking-wide text-slate-50">
                My teams
              </Dialog.Title>
              <Dialog.Description className="text-xs text-slate-400">
                Support is for your team(s). Follow is everyone else you're keeping an eye on.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:bg-slate-800"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
            </Dialog.Close>
          </header>

          <Tabs.Root defaultValue="support" className="flex min-h-0 flex-1 flex-col">
            <Tabs.List className="flex shrink-0 gap-1 border-b border-slate-900 px-3 sm:px-5">
              <TabTrigger value="support" icon={<Heart className="h-4 w-4" aria-hidden />} label={`Support (${myTeams.support.length})`} />
              <TabTrigger value="follow" icon={<Eye className="h-4 w-4" aria-hidden />} label={`Follow (${myTeams.follow.length})`} />
            </Tabs.List>

            {(['support', 'follow'] as const).map((list) => (
              <Tabs.Content
                key={list}
                value={list}
                className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5"
              >
                <p className="mb-3 text-xs text-slate-400">
                  {list === 'support'
                    ? 'Their games are always Must-watch for you.'
                    : 'Their games are surfaced first.'}
                </p>
                {(Object.keys(groups) as Confederation[]).map((conf) => (
                  <section key={conf} className="mb-5">
                    <h4 className="mb-2 font-display text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                      {CONFED_LABELS[conf]}
                    </h4>
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {groups[conf].map((name) => {
                        const selected = myTeams[list].includes(name);
                        const inOther = list === 'support'
                          ? myTeams.follow.includes(name)
                          : myTeams.support.includes(name);
                        return (
                          <li key={name}>
                            <button
                              type="button"
                              onClick={() => toggleSimple(name, list)}
                              className={cn(
                                'flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors min-h-[44px]',
                                selected
                                  ? 'border-gold/50 bg-gold/10'
                                  : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900',
                              )}
                              aria-pressed={selected}
                            >
                              <span className="text-xl leading-none" aria-hidden>
                                {teamFlag(name)}
                              </span>
                              <span className={cn('flex-1 font-display text-sm font-semibold uppercase tracking-wide', selected && 'text-gold')}>
                                {name}
                              </span>
                              {inOther && (
                                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                                  in {list === 'support' ? 'follow' : 'support'}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </Tabs.Content>
            ))}
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TabTrigger({ value, icon, label }: { value: string; icon: React.ReactNode; label: string }) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 border-b-2 border-transparent px-4 py-3 font-display text-sm font-semibold uppercase tracking-wide text-slate-400 transition-colors',
        'data-[state=active]:border-verdict-must data-[state=active]:text-slate-50',
        'hover:text-slate-200',
      )}
    >
      {icon}
      {label}
    </Tabs.Trigger>
  );
}
