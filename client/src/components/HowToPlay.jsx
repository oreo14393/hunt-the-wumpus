import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SECTIONS = [
  {
    title: 'Goal',
    icon: '☠',
    color: '#dc2626',
    items: [
      'Find and shoot the Wumpus before it finds you.',
      'You can also escape through a secret tunnel, or simply survive.',
      'Running out of sanity or arrows changes your fate entirely.',
    ],
  },
  {
    title: 'Movement',
    icon: '◆',
    color: '#22c55e',
    items: [
      'Click any glowing room on the map to move there.',
      'You can only move to directly connected rooms.',
      'Your current room is the bright green node.',
      'Adjacent rooms glow amber — those are your options.',
    ],
  },
  {
    title: 'Shooting',
    icon: '↑',
    color: '#f59e0b',
    items: [
      'Press "Shoot" to enter shoot mode, then click a room.',
      'You can shoot into adjacent rooms OR 1 room further.',
      'You have 5 arrows. Miss too many and you\'re defenceless.',
      'Missing wakes the Wumpus — it will move toward you.',
    ],
  },
  {
    title: 'Hazards',
    icon: '⚠',
    color: '#ef4444',
    items: [
      '▼ Pits — fall in and die. Clue: cold wind from below.',
      '≋ Bats — grab you and drop you in a random room.',
      '☠ Wumpus — eat you if you enter its room. Clue: ancient stench.',
      'All hazards are revealed by sensory clues, not sight.',
    ],
  },
  {
    title: 'Sanity & Corruption',
    icon: '◈',
    color: '#a78bfa',
    items: [
      'Sanity decreases each turn and faster near the Wumpus.',
      'At low sanity: fake clues appear, hallucinations trigger.',
      'At 0% sanity: you lose to the dark.',
      'Corruption rises from movement and reading lore.',
      'At 100% corruption: you stop wanting to leave.',
    ],
  },
  {
    title: 'Power-ups',
    icon: '✦',
    color: '#8b5cf6',
    items: [
      '◎ Echo Scan — reveals hazards in all rooms within 2 steps.',
      '◉ Thermal Vision — shows the exact location of the Wumpus.',
      '⏸ Time Freeze — cave stops shifting for 5 turns.',
      '↗ Decoy Arrow — distracts the Wumpus for several turns.',
      '✦ Sanity Tonic — restores 40% of your sanity.',
      'Click any collected power-up in your inventory to use it.',
    ],
  },
  {
    title: 'Endings',
    icon: '◉',
    color: '#f59e0b',
    items: [
      '✓ Hunter — shoot the Wumpus. The best ending.',
      '✓ Survivor — find and use the secret passage to escape.',
      '✓ Corrupted — reach 100% corruption. Unexpected.',
      '✗ Devoured — walked into the Wumpus or it found you.',
      '✗ Fallen — stepped into a pit.',
      '✗ Lost — your sanity reached zero.',
    ],
  },
];

export default function HowToPlay({ onClose }) {
  const [tab, setTab] = useState(0);
  const section = SECTIONS[tab];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(7,4,1,0.88)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-cave-900 border border-cave-600/30 rounded-sm overflow-hidden"
        style={{ backgroundColor: '#0a0602', boxShadow: '0 0 80px rgba(0,0,0,0.8)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cave-800/50">
          <h2 className="font-gothic text-xl text-amber-600/80 tracking-wider">How to Play</h2>
          <button
            onClick={onClose}
            className="text-cave-600 hover:text-cave-300 text-xs font-mono transition-colors"
          >
            [close]
          </button>
        </div>

        <div className="flex" style={{ minHeight: '360px' }}>
          {/* Tab sidebar */}
          <div className="w-36 border-r border-cave-800/40 py-2 flex-shrink-0">
            {SECTIONS.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setTab(i)}
                className={`w-full text-left px-4 py-2.5 text-xs font-mono transition-all flex items-center gap-2 ${
                  tab === i
                    ? 'text-amber-500 bg-amber-950/30 border-r-2 border-amber-700/60'
                    : 'text-cave-500 hover:text-cave-300 hover:bg-cave-800/20'
                }`}
              >
                <span style={{ color: tab === i ? s.color : undefined }}>{s.icon}</span>
                {s.title}
              </button>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl" style={{ color: section.color }}>{section.icon}</span>
                <h3 className="font-gothic text-lg" style={{ color: section.color }}>
                  {section.title}
                </h3>
              </div>
              <ul className="space-y-3">
                {section.items.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-2.5 text-sm font-mono text-cave-300 leading-relaxed"
                  >
                    <span className="mt-1 flex-shrink-0 text-cave-600">·</span>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-cave-800/40 flex justify-between items-center">
          <p className="text-cave-700 text-xs font-mono italic">
            "The cave remembers. Move carefully."
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="px-5 py-2 border border-amber-700/40 text-amber-600 text-xs font-mono rounded hover:bg-amber-950/30 transition-all"
          >
            Begin Descent →
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
