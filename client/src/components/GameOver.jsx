import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame, ENDING_INFO } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export default function GameOver({ onRestart, onLeaderboard }) {
  const { state } = useGame();
  const { user } = useAuth();
  const { gameState, ending, loreFound } = state;
  const [score, setScore] = useState(null);
  const [rank, setRank] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const info = ENDING_INFO[ending] || ENDING_INFO['trapped'];

  useEffect(() => {
    if (!submitted && gameState && ending) {
      submitScore();
      setSubmitted(true);
    }
  }, [ending, gameState]);

  async function submitScore() {
    try {
      const token = localStorage.getItem('wumpus_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API}/api/leaderboard/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sessionId: gameState.sessionId,
          userId: user?.id || null,
          username: user?.username || 'Anonymous',
          ending,
          stats: gameState.stats
        })
      });
      const data = await res.json();
      if (data.score !== undefined) {
        setScore(data.score);
        setRank(data.rank);
      }
    } catch (err) {
      console.error('Score submit failed:', err);
    }
  }

  const stats = gameState?.stats || {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(7,4,1,0.92)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 15 }}
        className="w-full max-w-lg mx-4 border rounded-sm overflow-hidden"
        style={{
          borderColor: `${info.color}40`,
          backgroundColor: '#0a0602',
          boxShadow: `0 0 80px ${info.color}25, 0 0 20px ${info.color}15`
        }}
      >
        {/* Header */}
        <div
          className="p-6 text-center border-b"
          style={{ borderColor: `${info.color}20`, background: `linear-gradient(to bottom, ${info.color}10, transparent)` }}
        >
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-xs font-mono tracking-widest mb-2"
            style={{ color: `${info.color}80` }}
          >
            {info.subtitle}
          </motion.div>
          <h1
            className="font-gothic text-3xl font-bold tracking-wider"
            style={{ color: info.color, textShadow: `0 0 30px ${info.color}50` }}
          >
            {info.title}
          </h1>
          <p className="text-cave-400 text-sm font-mono mt-3 leading-relaxed italic max-w-sm mx-auto">
            {info.description}
          </p>
        </div>

        {/* Stats */}
        <div className="p-4 grid grid-cols-3 gap-3 border-b border-cave-800/50">
          {[
            { label: 'Rooms', value: stats.roomsExplored || 0 },
            { label: 'Turns', value: stats.turnsPlayed || 0 },
            { label: 'Arrows', value: `${stats.arrowsHit || 0}/${stats.arrowsShot || 0}` },
            { label: 'Lore Found', value: stats.loreFragmentsFound || 0 },
            { label: 'Sanity', value: `${stats.sanityAtEnd || 0}%` },
            { label: 'Corruption', value: `${stats.corruptionLevel || 0}%` },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-cave-600 text-xs font-mono">{s.label}</div>
              <div className="text-cave-100 text-lg font-mono font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Score */}
        {score !== null && (
          <div className="px-4 py-3 text-center border-b border-cave-800/50">
            <div className="text-cave-500 text-xs font-mono">FINAL SCORE</div>
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="text-4xl font-gothic font-bold"
              style={{ color: info.color }}
            >
              {score.toLocaleString()}
            </motion.div>
            {rank && (
              <div className="text-cave-400 text-xs font-mono mt-1">
                Global Rank: #{rank}
              </div>
            )}
          </div>
        )}

        {/* Lore collected */}
        {loreFound.length > 0 && (
          <div className="px-4 py-3 border-b border-cave-800/50">
            <div className="text-purple-500/70 text-xs font-mono mb-2">LORE FRAGMENTS DISCOVERED</div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {loreFound.map((text, i) => (
                <p key={i} className="text-cave-500 text-xs font-mono italic leading-relaxed">
                  "{text}"
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRestart}
            className="flex-1 py-3 border rounded text-sm font-mono transition-all"
            style={{
              borderColor: `${info.color}50`,
              color: info.color,
              backgroundColor: `${info.color}10`
            }}
          >
            ↺ Descend Again
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLeaderboard}
            className="flex-1 py-3 border border-cave-600/40 rounded text-sm font-mono text-cave-300 hover:bg-cave-800/40 transition-all"
          >
            ⊞ Leaderboard
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
