import React, { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
import CaveMap from './CaveMap';
import HUD from './HUD';
import NarratorPanel from './NarratorPanel';
import ActionControls from './ActionControls';
import HallucinationOverlay from './HallucinationOverlay';
import GameOver from './GameOver';
import HowToPlay from './HowToPlay';

export default function Game({ onMenu, onLeaderboard }) {
  const { state, dispatch, setSend } = useGame();
  const { user } = useAuth();
  const { gameState, shootMode, selectedPowerup } = state;
  const hasStarted = useRef(false);
  const [showHowTo, setShowHowTo] = useState(false);

  // Handle all incoming WS messages
  const handleMessage = useCallback((msg) => {
    if (msg.type === 'game_state') {
      dispatch({
        type: 'GAME_STATE_UPDATE',
        gameState: msg.state,
        narrator: msg.narrator,
        roomDescription: msg.roomDescription,
        clues: msg.clues || [],
        events: msg.events || [],
        hallucination: msg.hallucination,
        over: msg.over,
        ending: msg.ending,
      });
    } else if (msg.type === 'error') {
      dispatch({ type: 'SET_ERROR', error: msg.message });
      setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 3000);
    }
  }, [dispatch]);

  const { sendMessage, connected, reconnecting } = useGameSocket(handleMessage);

  // Register send function in context
  useEffect(() => {
    setSend(sendMessage);
  }, [sendMessage, setSend]);

  // Start a new game once connected
  useEffect(() => {
    if (connected && !hasStarted.current) {
      hasStarted.current = true;
      sendMessage('new_game', {
        userId: user?.id || null,
        username: user?.username || 'Anonymous'
      });
    }
  }, [connected, sendMessage, user]);

  const handleMove = useCallback((room) => {
    if (!gameState) return;
    sendMessage('move', { sessionId: gameState.sessionId, room });
  }, [gameState, sendMessage]);

  const handleShoot = useCallback((room) => {
    if (!gameState) return;
    sendMessage('shoot', { sessionId: gameState.sessionId, room });
  }, [gameState, sendMessage]);

  const handleToggleShootMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_SHOOT_MODE' });
  }, [dispatch]);

  const handleUsePowerup = useCallback((type) => {
    if (!gameState) return;
    // Single click = use immediately
    sendMessage('use_powerup', { sessionId: gameState.sessionId, powerupType: type });
    dispatch({ type: 'CLEAR_POWERUP' });
  }, [gameState, sendMessage, dispatch]);

  const handleRoomClick = useCallback((room) => {
    if (!gameState || gameState.over) return;
    if (shootMode) {
      handleShoot(room);
      dispatch({ type: 'TOGGLE_SHOOT_MODE' });
    } else {
      handleMove(room);
    }
  }, [gameState, shootMode, handleShoot, handleMove, dispatch]);

  const handleRestart = useCallback(() => {
    hasStarted.current = false;
    dispatch({ type: 'RESET' });
    // Use rAF to ensure state is flushed before sending new_game
    requestAnimationFrame(() => {
      hasStarted.current = true;
      dispatch({ type: 'SET_PHASE', phase: 'playing' });
      sendMessage('new_game', {
        userId: user?.id || null,
        username: user?.username || 'Anonymous'
      });
    });
  }, [sendMessage, user, dispatch]);

  // Sanity-based visual distortion
  const sanity = gameState?.sanity ?? 100;
  const distortClass = sanity < 15 ? 'sanity-critical' : sanity < 35 ? 'sanity-low' : '';
  const wumpusNearClass = state.wumpusNear ? 'wumpus-near' : '';

  return (
    <div
      className={`min-h-screen flex flex-col ${distortClass}`}
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0e0702 0%, #070401 100%)' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-cave-800/40 bg-cave-900/40 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={onMenu}
          className="text-cave-600 hover:text-cave-400 text-xs font-mono transition-colors"
        >
          ← Surface
        </button>

        <div className={`font-gothic text-lg tracking-wider text-amber-700/70 torch-flicker ${wumpusNearClass}`}>
          WUMPUS
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          {reconnecting && (
            <span className="text-red-500 animate-pulse">⚡ Reconnecting…</span>
          )}
          {!connected && !reconnecting && (
            <span className="text-cave-600">◌ Offline</span>
          )}
          {connected && gameState && (
            <span className="text-cave-700">◉ Room {gameState.currentRoom + 1}</span>
          )}
          {user && (
            <span className="text-cave-600">{user.username}</span>
          )}
          <button
            onClick={() => setShowHowTo(true)}
            className="text-cave-600 hover:text-amber-600 transition-colors border border-cave-700/40 rounded px-2 py-0.5"
            title="How to Play"
          >
            ?
          </button>
        </div>
      </div>

      {/* Connection overlay */}
      <AnimatePresence>
        {!connected && !gameState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border border-cave-600/40 border-t-amber-700/60 rounded-full mx-auto"
              />
              <p className="text-cave-500 text-sm font-mono animate-pulse">
                {reconnecting ? 'Reconnecting to the cave…' : 'Entering the darkness…'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-800/60 text-red-300 text-xs font-mono px-4 py-2 rounded"
          >
            {state.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main game layout */}
      {gameState && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-0 min-h-0 overflow-hidden">

          {/* Left panel: HUD */}
          <div className="lg:col-span-1 order-2 lg:order-1 border-t lg:border-t-0 lg:border-r border-cave-800/40 overflow-y-auto p-3">
            <HUD onUsePowerup={handleUsePowerup} />
          </div>

          {/* Center: Cave Map */}
          <div className="lg:col-span-2 order-1 lg:order-2 relative overflow-hidden" style={{ minHeight: '320px' }}>
            {/* Sanity vignette */}
            {sanity < 50 && (
              <div
                className="absolute inset-0 pointer-events-none z-10 rounded"
                style={{
                  background: `radial-gradient(ellipse at center, transparent 40%, rgba(88,28,135,${(50 - sanity) / 200}) 100%)`,
                }}
              />
            )}
            {/* Wumpus near red vignette */}
            {state.wumpusNear && (
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background: 'radial-gradient(ellipse at center, transparent 50%, rgba(185,28,28,0.12) 100%)',
                  animation: 'pulse-red 2s ease-in-out infinite'
                }}
              />
            )}
            <CaveMap onRoomClick={handleRoomClick} />
          </div>

          {/* Right panel: Narrator + Log */}
          <div className="lg:col-span-1 order-3 lg:order-3 border-t lg:border-t-0 lg:border-l border-cave-800/40 overflow-y-auto">
            <div className="p-3 h-full flex flex-col" style={{ minHeight: '300px' }}>
              <NarratorPanel />
            </div>
          </div>
        </div>
      )}

      {/* Action controls — bottom bar */}
      {gameState && (
        <div className="flex-shrink-0 border-t border-cave-800/40 p-3 space-y-2">
          {/* First-turn hint */}
          {gameState.turns === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs font-mono text-cave-500 text-center py-1 border border-cave-800/40 rounded bg-cave-900/30"
            >
              💡 Click a room button below (or on the map) to move · Hover anything for hints · Press ? for full guide
            </motion.div>
          )}
          <ActionControls
            onMove={handleMove}
            onShoot={handleShoot}
            onToggleShootMode={handleToggleShootMode}
            onRestartGame={handleRestart}
          />
        </div>
      )}

      {/* Game Over overlay */}
      <AnimatePresence>
        {state.phase === 'game_over' && (
          <GameOver
            onRestart={handleRestart}
            onLeaderboard={onLeaderboard}
          />
        )}
      </AnimatePresence>

      {/* Hallucination overlay */}
      <HallucinationOverlay />

      {/* How to play modal */}
      <AnimatePresence>
        {showHowTo && <HowToPlay onClose={() => setShowHowTo(false)} />}
      </AnimatePresence>
    </div>
  );
}
