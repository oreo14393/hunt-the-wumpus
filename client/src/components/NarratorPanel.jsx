import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import Tooltip from './Tooltip';

const CLUE_STYLES = {
  wumpus: { border: '#dc2626', text: '#fca5a5', icon: '☠', hint: 'Wumpus is in an adjacent room' },
  pit: { border: '#3b82f6', text: '#93c5fd', icon: '▼', hint: 'Bottomless pit in adjacent room' },
  bat: { border: '#f59e0b', text: '#fcd34d', icon: '≋', hint: 'Bats in adjacent room — they can transport you' },
  powerup: { border: '#8b5cf6', text: '#c4b5fd', icon: '✦', hint: 'A power-up item is nearby' },
  lore: { border: '#a78bfa', text: '#ddd6fe', icon: '📜', hint: 'A lore fragment is nearby — reading it increases corruption' },
  secret: { border: '#10b981', text: '#6ee7b7', icon: '◈', hint: 'A hidden passage is nearby — find it to escape' },
  narrator: { border: '#4a2e14', text: '#d4c9b8', icon: '◆', hint: 'Narrator observation' },
  fake: { border: '#6b4a2e', text: '#a78a6a', icon: '?', hint: 'Warning — your sanity is low, this may be a hallucination' },
  fake_wumpus: { border: '#6b4a2e', text: '#a78a6a', icon: '?', hint: 'Possibly fake — sanity is unreliable' },
  fake_pit: { border: '#6b4a2e', text: '#a78a6a', icon: '?', hint: 'Possibly fake — sanity is unreliable' },
  fake_bat: { border: '#6b4a2e', text: '#a78a6a', icon: '?', hint: 'Possibly fake — sanity is unreliable' },
  bat_transport: { border: '#f59e0b', text: '#fcd34d', icon: '≋', hint: 'Bats carried you to a new room' },
  wumpus_move: { border: '#dc2626', text: '#fca5a5', icon: '⚡', hint: 'The Wumpus has moved' },
  collapse: { border: '#ef4444', text: '#fca5a5', icon: '💥', hint: 'A room has collapsed — new pit created' },
  shift: { border: '#6b7280', text: '#9ca3af', icon: '~', hint: 'The cave structure has shifted — a passage changed' },
  default: { border: '#4a2e14', text: '#b09880', icon: '·', hint: '' },
};

function LogEntry({ entry, index }) {
  const style = CLUE_STYLES[entry.type] || CLUE_STYLES.default;
  const isNew = index === 0;

  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -8, height: 0 } : false}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      transition={{ duration: 0.3 }}
      className="flex gap-2 py-1.5 border-b border-cave-800/50 last:border-0"
    >
      <Tooltip content={style.hint || entry.type} position="right">
        <span className="text-xs mt-0.5 flex-shrink-0 cursor-help" style={{ color: style.border }}>
          {style.icon}
        </span>
      </Tooltip>
      <p className="text-xs font-mono leading-relaxed" style={{ color: style.text }}>
        {entry.text}
      </p>
    </motion.div>
  );
}

export default function NarratorPanel() {
  const { state } = useGame();
  const { narrator, roomDescription, clues, log, gameState } = state;
  const logRef = useRef(null);

  // Auto-scroll to top (newest entries)
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [log.length]);

  if (!gameState) return null;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Narrator text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={narrator}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="hud-panel flex-shrink-0"
        >
          <div className="text-cave-500 text-xs font-mono mb-1.5 flex items-center gap-1.5">
            <span className="animate-breathe">◆</span>
            <span>THE NARRATOR</span>
          </div>
          <p className="narrator-text text-sm leading-relaxed">
            {narrator || "The cave waits."}
          </p>
          {roomDescription && (
            <p className="text-cave-500 text-xs mt-2 font-mono italic leading-relaxed border-t border-cave-800/50 pt-2">
              {roomDescription}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Live clue indicators */}
      {clues && clues.length > 0 && (
        <div className="hud-panel flex-shrink-0 space-y-1.5">
          <div className="text-cave-500 text-xs font-mono mb-1">SENSORY INPUT</div>
          {clues.map((c, i) => {
            const style = CLUE_STYLES[c.type] || CLUE_STYLES.default;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-2 text-xs font-mono"
              >
                <Tooltip content={style.hint || c.type} position="right">
                  <span style={{ color: style.border }} className="cursor-help">{style.icon}</span>
                </Tooltip>
                <span style={{ color: style.text }}>{c.message}</span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Event log */}
      <div className="hud-panel flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="text-cave-500 text-xs font-mono mb-2 flex-shrink-0">CAVE LOG</div>
        <div ref={logRef} className="overflow-y-auto flex-1 pr-1">
          {log.length === 0 ? (
            <p className="text-cave-700 text-xs font-mono italic">The log is empty. Move to begin.</p>
          ) : (
            log.map((entry, i) => <LogEntry key={`${entry.timestamp}-${i}`} entry={entry} index={i} />)
          )}
        </div>
      </div>
    </div>
  );
}
