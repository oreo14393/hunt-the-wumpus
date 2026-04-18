import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const ENDING_LABELS = {
  wumpus_killed: { label: 'Hunter', color: '#22c55e' },
  escaped: { label: 'Survivor', color: '#60a5fa' },
  became_wumpus: { label: 'Corrupted', color: '#c026d3' },
  trapped: { label: 'Trapped', color: '#71717a' },
  fell_pit: { label: 'Fell', color: '#3b82f6' },
  eaten: { label: 'Devoured', color: '#dc2626' },
  sanity_lost: { label: 'Lost', color: '#7c3aed' },
};

export default function Leaderboard({ onBack }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  async function fetchLeaderboard() {
    setLoading(true);
    try {
      const url = filter === 'all'
        ? `${API}/api/leaderboard?limit=20`
        : `${API}/api/leaderboard?ending=${filter}&limit=20`;
      const res = await fetch(url);
      const data = await res.json();
      setEntries(data.leaderboard || []);
    } catch {
      setEntries([]);
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start p-6"
      style={{ background: 'radial-gradient(ellipse at center, #0e0702 0%, #070401 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-gothic text-4xl text-amber-600/80 tracking-widest mb-2">HALL OF THE FALLEN</h1>
          <p className="text-cave-500 text-xs font-mono">Those who descended. Few returned the same.</p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {[
            { value: 'all', label: 'All' },
            { value: 'wumpus_killed', label: 'Hunters' },
            { value: 'became_wumpus', label: 'Corrupted' },
            { value: 'escaped', label: 'Survivors' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 text-xs font-mono rounded border transition-all ${
                filter === f.value
                  ? 'border-amber-600/60 text-amber-500 bg-amber-950/30'
                  : 'border-cave-700/40 text-cave-400 hover:border-cave-500/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="border border-cave-700/30 rounded overflow-hidden">
          <div className="grid grid-cols-12 text-xs font-mono text-cave-600 px-4 py-2 border-b border-cave-800/50 bg-cave-900/50">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Explorer</div>
            <div className="col-span-2">Fate</div>
            <div className="col-span-2 text-right">Score</div>
            <div className="col-span-2 text-right">Turns</div>
            <div className="col-span-2 text-right">Sanity</div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-cave-600 text-sm font-mono animate-pulse">
              Consulting the dark records…
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-cave-700 text-sm font-mono italic">
              No records. The cave keeps its own counsel.
            </div>
          ) : (
            entries.map((entry, i) => {
              const endingInfo = ENDING_LABELS[entry.ending] || { label: 'Unknown', color: '#6b7280' };
              return (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-12 text-xs font-mono px-4 py-3 border-b border-cave-900/80 hover:bg-cave-900/40 transition-colors last:border-0"
                >
                  <div className="col-span-1 text-cave-600">{i + 1}</div>
                  <div className="col-span-3 text-cave-200 truncate">{entry.username}</div>
                  <div className="col-span-2" style={{ color: endingInfo.color }}>{endingInfo.label}</div>
                  <div className="col-span-2 text-right text-amber-500 font-bold">
                    {(entry.score || 0).toLocaleString()}
                  </div>
                  <div className="col-span-2 text-right text-cave-400">
                    {entry.stats?.turnsPlayed || 0}
                  </div>
                  <div className="col-span-2 text-right" style={{
                    color: (entry.stats?.sanityAtEnd || 0) > 50 ? '#22c55e' : '#dc2626'
                  }}>
                    {entry.stats?.sanityAtEnd || 0}%
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Back */}
        <div className="mt-6 text-center">
          <button
            onClick={onBack}
            className="text-cave-500 hover:text-cave-300 text-sm font-mono transition-colors"
          >
            ← Return to the surface
          </button>
        </div>
      </motion.div>
    </div>
  );
}
