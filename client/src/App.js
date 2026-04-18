import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider, useGame } from './context/GameContext';
import MainMenu from './components/MainMenu';
import Game from './components/Game';
import Leaderboard from './components/Leaderboard';

function AppInner() {
  const { state, dispatch } = useGame();
  const { phase } = state;

  const goToMenu = () => dispatch({ type: 'SET_PHASE', phase: 'menu' });
  const goToPlay = () => dispatch({ type: 'SET_PHASE', phase: 'playing' });
  const goToLeaderboard = () => dispatch({ type: 'SET_PHASE', phase: 'leaderboard' });

  return (
    <AnimatePresence mode="wait">
      {phase === 'menu' && (
        <MainMenu key="menu" onStart={goToPlay} onLeaderboard={goToLeaderboard} />
      )}
      {(phase === 'playing' || phase === 'game_over') && (
        <Game key="game" onMenu={goToMenu} onLeaderboard={goToLeaderboard} />
      )}
      {phase === 'leaderboard' && (
        <Leaderboard key="leaderboard" onBack={goToMenu} />
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <AppInner />
      </GameProvider>
    </AuthProvider>
  );
}
