import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import Tooltip from './Tooltip';

function ActionButton({ onClick, disabled, active, danger, children, className = '' }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`
        cave-btn rounded text-xs font-mono transition-all duration-150
        ${active ? 'border-blood-500/80 bg-blood-900/40 text-red-300' : ''}
        ${danger ? 'border-red-700/60 hover:border-red-500/80 hover:bg-red-950/40' : ''}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}

export default function ActionControls({ onMove, onShoot, onToggleShootMode, onRestartGame }) {
  const { state, dispatch } = useGame();
  const { gameState, shootMode, selectedPowerup } = state;

  if (!gameState) return null;

  const { currentRoom, neighbors = [], arrows, over, cave } = gameState;

  // For shoot mode, show all rooms within 2 hops
  const shootTargets = React.useMemo(() => {
    if (!shootMode || !cave) return [];
    const reachable = new Set(neighbors);
    for (const nb of neighbors) {
      for (const nb2 of (cave[nb] || [])) {
        if (nb2 !== currentRoom) reachable.add(nb2);
      }
    }
    return [...reachable];
  }, [shootMode, cave, neighbors, currentRoom]);

  const handleRoomAction = (room) => {
    if (over) return;
    if (shootMode) {
      onShoot(room);
      dispatch({ type: 'TOGGLE_SHOOT_MODE' });
    } else {
      onMove(room);
    }
  };

  return (
    <div className="hud-panel space-y-3">
      {/* Mode indicator */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-cave-400">
          {shootMode
            ? <span className="text-red-400 animate-pulse">⚡ SHOOT MODE — select target</span>
            : selectedPowerup
            ? <span className="text-purple-400">✦ POWER-UP READY — or cancel</span>
            : <span>MOVE TO:</span>
          }
        </div>
        {(shootMode || selectedPowerup) && (
          <button
            onClick={() => {
              dispatch({ type: 'TOGGLE_SHOOT_MODE' });
              dispatch({ type: 'CLEAR_POWERUP' });
            }}
            className="text-xs text-cave-500 hover:text-cave-300 font-mono"
          >
            [cancel]
          </button>
        )}
      </div>

      {/* Room buttons */}
      {!shootMode ? (
        <div className="flex flex-wrap gap-2">
          {neighbors.map(room => (
            <Tooltip key={room} content={`Move to Room ${room + 1}`} position="top">
              <ActionButton
                onClick={() => handleRoomAction(room)}
                disabled={over}
                className="px-4 py-2"
              >
                Room {room + 1}
              </ActionButton>
            </Tooltip>
          ))}
          {neighbors.length === 0 && (
            <span className="text-cave-600 text-xs font-mono italic">No passages...</span>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-cave-500 font-mono">
            Adjacent rooms ({neighbors.length}) and 2-hop rooms ({shootTargets.length - neighbors.length} more):
          </p>
          <div className="flex flex-wrap gap-2">
            {shootTargets.map(room => {
              const isDirect = neighbors.includes(room);
              return (
                <Tooltip
                  key={room}
                  content={isDirect ? `Shoot directly into Room ${room + 1}` : `Shoot 2 rooms to Room ${room + 1}`}
                  position="top"
                >
                  <ActionButton
                    onClick={() => handleRoomAction(room)}
                    disabled={over}
                    danger
                    className={`px-3 py-1.5 ${!isDirect ? 'opacity-70 border-dashed' : ''}`}
                  >
                    {isDirect ? '⚡' : '~'} Room {room + 1}
                  </ActionButton>
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-cave-700/30">
        <Tooltip content="Enter shoot mode — then click a room to fire an arrow" position="top">
          <ActionButton
            onClick={onToggleShootMode}
            disabled={over || arrows <= 0}
            active={shootMode}
            danger={!shootMode}
            className="flex items-center gap-1.5"
          >
            <span>↑</span>
            <span>Shoot ({arrows} left)</span>
          </ActionButton>
        </Tooltip>

        {over && (
          <ActionButton
            onClick={onRestartGame}
            className="border-amber-700/50 text-amber-400 hover:border-amber-500"
          >
            ↺ Descend Again
          </ActionButton>
        )}
      </div>

      {/* Sanity warning */}
      {gameState.sanity < 25 && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xs text-red-500 font-mono text-center border border-red-900/50 py-1.5 rounded bg-red-950/20"
        >
          ⚠ CRITICAL SANITY — reality is no longer reliable
        </motion.div>
      )}

      {/* Corruption warning */}
      {gameState.corruption > 70 && (
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xs font-mono text-center py-1.5 rounded"
          style={{ color: '#c026d3', backgroundColor: '#2e0a3420', borderColor: '#7e22ce60', border: '1px solid' }}
        >
          ◈ The cave feels familiar. Too familiar.
        </motion.div>
      )}
    </div>
  );
}
