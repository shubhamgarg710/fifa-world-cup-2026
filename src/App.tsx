import { useState } from 'react';
import type { Match } from '@/data/sources/types';
import { HomeScreen } from './components/HomeScreen';
import { MatchDetailDialog } from './components/MatchDetailDialog';
import { TeamsPickerDialog } from './components/TeamsPickerDialog';

export default function App() {
  const [selected, setSelected] = useState<Match | null>(null);
  const [teamsOpen, setTeamsOpen] = useState(false);
  return (
    <main className="min-h-dvh safe-bottom">
      <HomeScreen
        onOpenMatch={(m) => setSelected(m)}
        onOpenTeams={() => setTeamsOpen(true)}
      />
      <MatchDetailDialog
        match={selected}
        open={!!selected}
        onOpenChange={(next) => !next && setSelected(null)}
      />
      <TeamsPickerDialog open={teamsOpen} onOpenChange={setTeamsOpen} />
    </main>
  );
}
