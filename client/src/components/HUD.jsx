import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import Tooltip from './Tooltip';

function SanityBar({ value }) {
  const color = value > 70 ? '#22c55e' : value > 40 ? '#eab308' : value > 20 ? '#f97316' : '#dc2626';
  const label = value > 80 ? 'Stable' : value > 60 ? 'Uneasy' : value > 40 ? 'Rattled' : value > 20 ? 'Unravelling' : 'Critical';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-cave-400">SANITY</span>
        <span style={{ color }} className="font-bold">{value}% — {label}</span>
      </div>
      <div className="h-2 bg-cave-900 rounded-full overflow-hidden border border-cave-700/30">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

function CorruptionBar({ value }) {
  const color = value < 30 ? '#8b5cf6' : value < 60 ? '#7c3aed' : value < 85 ? '#6d28d9' : '#c026d3';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-cave-400">CORRUPTION</span>
        <span style={{ color }} className="font-bold">{value}%</span>
      </div>
      <div className="h-1.5 bg-cave-900 rounded-full overflow-hidden border border-cave-700/30">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  );
}

function ArrowCount({ count }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-cave-400 text-xs font-mono">ARROWS</span>
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <motion.span
            key={i}
            initial={false}
            animate={{ opacity: i < count ? 1 : 0.15, scale: i < count ? 1 : 0.8 }}
            className="text-base"
            style={{ color: count === 0 ? '#dc2626' : '#f59e0b' }}
          >
            ↑
          </motion.span>
        ))}
        {count === 0 && (
          <span className="text-red-500 text-xs ml-1 font-mono animate-pulse">EMPTY</span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ label, value, color = '#6b4a2e' }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-mono">
      <span className="text-cave-500">{label}</span>
      <span style={{ color }} className="font-bold">{value}</span>
    </div>
  );
}

function PowerupInventory({ collected, onUse, selectedPowerup }) {
  const { POWERUP_INFO } = useGame();
  if (!collected || collected.length === 0) return null;

  // Deduplicate
  const counts = {};
  for (const p of collected) counts[p] = (counts[p] || 0) + 1;

  return (
    <div className="space-y-1.5">
      <div className="text-xs text-cave-400 font-mono">INVENTORY</div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([type, count]) => {
          const info = POWERUP_INFO[type];
          if (!info) return null;
          const isSelected = selectedPowerup === type;
          return (
            <Tooltip key={type} content={`${info.label}: ${info.desc}. Click to use.`} position="top">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onUse(type)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono border transition-all
                  ${isSelected
                    ? 'border-opacity-100 bg-opacity-30'
                    : 'border-cave-600/40 bg-cave-800/50 hover:bg-cave-700/60'
                  }`}
                style={{
                  borderColor: isSelected ? info.color : undefined,
                  backgroundColor: isSelected ? `${info.color}22` : undefined,
                  color: info.color
                }}
              >
                <span>{info.icon}</span>
                <span>{info.label}</span>
                {count > 1 && <span className="text-cave-400">×{count}</span>}
              </motion.button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

function AlertBanner({ clues, wumpusNear, immuneTurns, timeFrozen }) {
  const alerts = [];
  if (wumpusNear) alerts.push({ text: '⚠ WUMPUS DETECTED NEARBY', color: '#dc2626', pulse: true });
  if (immuneTurns > 0) alerts.push({ text: `🛡 IMMUNE — ${immuneTurns} turns`, color: '#22c55e' });
  if (timeFrozen > 0) alerts.push({ text: `⏸ TIME FROZEN — ${timeFrozen} turns`, color: '#a78bfa' });

  const wumpusClue = clues.find(c => c.type === 'wumpus');
  const pitClue = clues.find(c => c.type === 'pit');
  if (wumpusClue && !wumpusNear) alerts.push({ text: '☠ Ancient stench...', color: '#ef4444' });
  if (pitClue) alerts.push({ text: '▼ Cold wind from below...', color: '#3b82f6' });

  if (alerts.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="space-y-1">
        {alerts.map((alert, i) => (
          <motion.div
            key={alert.text}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className={`text-xs font-mono px-2 py-1 rounded border-l-2 ${alert.pulse ? 'animate-pulse' : ''}`}
            style={{
              borderLeftColor: alert.color,
              color: alert.color,
              backgroundColor: `${alert.color}11`
            }}
          >
            {alert.text}
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}

export default function HUD({ onUsePowerup }) {
  const { state } = useGame();
  const { gameState, clues, wumpusNear } = state;

  if (!gameState) return null;

  const {
    sanity, corruption, arrows, turns, currentRoom,
    stats, immuneTurns, timeFrozen, collectedPowerups
  } = gameState;

  return (
    <div className="hud-panel space-y-3 text-cave-100">
      {/* Room + basic stats */}
      <div className="flex items-center justify-between border-b border-cave-700/30 pb-2">
        <div>
          <div className="text-cave-500 text-xs font-mono">CURRENT LOCATION</div>
          <div className="text-xl font-gothic text-amber-600/90">Room {currentRoom + 1}</div>
        </div>
        <div className="text-right space-y-0.5">
          <Tooltip content="Total actions taken this game" position="left">
            <StatusBadge label="TURN" value={turns} color="#d97706" />
          </Tooltip>
          <Tooltip content="Rooms you have visited out of 22" position="left">
            <StatusBadge label="EXPLORED" value={`${stats?.roomsExplored || 1}/22`} color="#6b7280" />
          </Tooltip>
          <Tooltip content="Lore fragments collected — increases corruption" position="left">
            <StatusBadge label="LORE" value={stats?.loreFragmentsFound || 0} color="#8b5cf6" />
          </Tooltip>
        </div>
      </div>

      {/* Sanity */}
      <Tooltip content="Decreases each turn. Near-zero causes hallucinations and fake clues. Zero = game over." position="right">
        <SanityBar value={sanity} />
      </Tooltip>

      {/* Corruption */}
      <Tooltip content="Rises from moving and reading lore. At 100% you stop trying to leave — corruption ending." position="right">
        <CorruptionBar value={corruption} />
      </Tooltip>

      {/* Arrows */}
      <ArrowCount count={arrows} />

      {/* Alerts */}
      <AlertBanner
        clues={clues}
        wumpusNear={wumpusNear}
        immuneTurns={immuneTurns || 0}
        timeFrozen={timeFrozen || 0}
      />

      {/* Power-up inventory */}
      <PowerupInventory
        collected={collectedPowerups}
        onUse={onUsePowerup}
        selectedPowerup={state.selectedPowerup}
      />
    </div>
  );
}
