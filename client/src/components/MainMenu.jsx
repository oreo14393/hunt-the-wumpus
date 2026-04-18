import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import HowToPlay from './HowToPlay';

const TAGLINES = [
  "Something waits in the dark. It has been waiting for you specifically.",
  "The cave remembers every explorer. Most are still down there.",
  "You will hear it before you see it. You will smell it before you hear it.",
  "Sanity is a luxury the cave cannot afford.",
  "The Wumpus doesn't hunt. It corrects.",
];

export default function MainMenu({ onStart, onLeaderboard }) {
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [tagline, setTagline] = useState(TAGLINES[0]);
  const [taglineIdx, setTaglineIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIdx(i => {
        const next = (i + 1) % TAGLINES.length;
        setTagline(TAGLINES[next]);
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0e0702 0%, #070401 100%)' }}
    >
      {/* Ambient particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 rounded-full bg-amber-900/40"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0, 1.5, 0],
              y: [0, -30 - Math.random() * 60]
            }}
            transition={{
              duration: 4 + Math.random() * 6,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: 'easeOut'
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-lg mx-4">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <div className="text-amber-900/60 text-xs font-mono tracking-[0.4em] mb-4 uppercase">
            — A Psychological Horror —
          </div>
          <h1
            className="font-gothic text-6xl md:text-7xl font-bold tracking-widest mb-2"
            style={{
              color: '#d97706',
              textShadow: '0 0 60px rgba(180,100,20,0.4), 0 0 120px rgba(180,100,20,0.15)'
            }}
          >
            WUMPUS
          </h1>
          <div className="text-amber-800/50 text-sm font-mono tracking-widest mb-8">
            INTO THE DARK
          </div>
        </motion.div>

        {/* Tagline */}
        <AnimatePresence mode="wait">
          <motion.p
            key={tagline}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="text-cave-500 text-sm font-mono italic mb-10 leading-relaxed max-w-sm mx-auto"
          >
            "{tagline}"
          </motion.p>
        </AnimatePresence>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="space-y-3"
        >
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(180,100,20,0.3)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="w-full py-4 border border-amber-700/50 text-amber-500 font-gothic text-xl tracking-wider rounded-sm hover:bg-amber-950/30 transition-all"
            style={{ textShadow: '0 0 20px rgba(245,158,11,0.4)' }}
          >
            Descend
          </motion.button>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowHowTo(true)}
              className="flex-1 py-3 border border-cave-600/30 text-cave-400 font-mono text-sm rounded-sm hover:bg-cave-900/40 transition-all"
            >
              ? How to Play
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onLeaderboard}
              className="flex-1 py-3 border border-cave-600/30 text-cave-400 font-mono text-sm rounded-sm hover:bg-cave-900/40 transition-all"
            >
              ⊞ Leaderboard
            </motion.button>

            {user ? (
              <div className="flex-1 flex flex-col gap-1 items-center justify-center">
                <div className="text-center text-xs font-mono text-cave-500">
                  {user.username}
                </div>
                <button
                  onClick={logout}
                  className="w-full py-2 border border-cave-700/30 text-cave-600 font-mono text-xs rounded-sm hover:bg-cave-900/40 transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowAuth(true)}
                className="flex-1 py-3 border border-cave-600/30 text-cave-400 font-mono text-sm rounded-sm hover:bg-cave-900/40 transition-all"
              >
                ◈ Sign In
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* User stats if logged in */}
        {user?.stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 grid grid-cols-4 gap-3 border border-cave-800/40 rounded-sm p-3 bg-cave-900/30"
          >
            {[
              { label: 'Games', value: user.stats.totalGames },
              { label: 'Wins', value: user.stats.wins },
              { label: 'Kills', value: user.stats.wumpusKills },
              { label: 'Best', value: (user.stats.bestScore || 0).toLocaleString() },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-amber-500 text-sm font-mono font-bold">{s.value}</div>
                <div className="text-cave-600 text-xs font-mono">{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Quick hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6 text-cave-700 text-xs font-mono space-y-1"
        >
          <p>Click rooms to move · Shoot arrows at the Wumpus · Stay sane</p>
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            onSuccess={() => setShowAuth(false)}
          />
        )}
        {showHowTo && (
          <HowToPlay onClose={() => setShowHowTo(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
