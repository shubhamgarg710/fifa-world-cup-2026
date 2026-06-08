import { useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import type { Match } from '@/data/sources/types';
import { HomeScreen } from './components/HomeScreen';
import { MatchDetailDialog } from './components/MatchDetailDialog';
import { TeamsPickerDialog } from './components/TeamsPickerDialog';
import { LeagueHub } from './components/league/LeagueHub';
import { JoinLeague } from './components/league/JoinLeague';
import { LeagueScreen } from './components/league/LeagueScreen';

function WatchPage() {
  const [selected, setSelected] = useState<Match | null>(null);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <main className="min-h-dvh safe-bottom">
      <HomeScreen
        onOpenMatch={(m) => setSelected(m)}
        onOpenTeams={() => setTeamsOpen(true)}
        onOpenLeague={() => navigate('/league')}
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

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<WatchPage />} />
        <Route path="/league" element={<LeagueHub />} />
        <Route path="/join" element={<JoinLeague />} />
        <Route path="/l/:code" element={<LeagueScreen />} />
      </Routes>
      <Analytics />
    </>
  );
}
