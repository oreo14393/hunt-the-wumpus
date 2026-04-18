import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import Tooltip from './Tooltip';

// Determine node color/class based on known state
function getNodeStyle(roomIdx, gameState, shootMode) {
  const {
    currentRoom, neighbors = [], visitedRooms = [], revealedRooms = [],
    revealedPits = [], revealedBats = [], revealedWumpus,
    revealedPowerups = {}, collapsingRooms = []
  } = gameState;

  const isPlayer = roomIdx === currentRoom;
  const isNeighbor = neighbors.includes(roomIdx);
  const isVisited = visitedRooms.includes(roomIdx);
  const isRevealed = revealedRooms.includes(roomIdx);
  const isCollapsing = collapsingRooms.includes(roomIdx);

  if (isPlayer) return { fill: '#22c55e', stroke: '#16a34a', strokeWidth: 2.5, r: 12, glow: '#22c55e' };
  if (revealedPits.includes(roomIdx)) return { fill: '#1e3a8a', stroke: '#3b82f6', strokeWidth: 2, r: 10, glow: '#3b82f6' };
  if (revealedBats.includes(roomIdx)) return { fill: '#78350f', stroke: '#f59e0b', strokeWidth: 2, r: 10, glow: null };
  if (roomIdx === revealedWumpus) return { fill: '#7c2d12', stroke: '#ef4444', strokeWidth: 2.5, r: 12, glow: '#ef4444' };
  if (revealedPowerups[roomIdx]) return { fill: '#4c1d95', stroke: '#8b5cf6', strokeWidth: 2, r: 10, glow: '#8b5cf6' };
  if (isCollapsing) return { fill: '#450a0a', stroke: '#dc2626', strokeWidth: 1.5, r: 9, glow: '#dc2626' };
  if (isNeighbor) {
    if (shootMode) return { fill: '#2d1b00', stroke: '#dc2626', strokeWidth: 2, r: 10, glow: '#dc2626' };
    return { fill: '#1a0e04', stroke: '#a16207', strokeWidth: 1.5, r: 10, glow: null };
  }
  if (isVisited || isRevealed) return { fill: '#1c1004', stroke: '#4a2e14', strokeWidth: 1, r: 8, glow: null };
  return { fill: '#0a0602', stroke: '#1a0e04', strokeWidth: 0.5, r: 7, glow: null };
}

function getNodeIcon(roomIdx, gameState) {
  const { revealedPits, revealedBats, revealedWumpus, revealedPowerups, currentRoom } = gameState;
  if (roomIdx === currentRoom) return '◆';
  if ((revealedPits || []).includes(roomIdx)) return '▼';
  if ((revealedBats || []).includes(roomIdx)) return '≋';
  if (roomIdx === revealedWumpus) return '☠';
  if (revealedPowerups && revealedPowerups[roomIdx]) return '✦';
  return null;
}

export default function CaveMap({ onRoomClick }) {
  const { state } = useGame();
  const { gameState, shootMode } = state;
  const svgRef = useRef(null);
  const animFrameRef = useRef(null);

  const W = 780, H = 520;

  const handleRoomClick = useCallback((roomIdx) => {
    if (!gameState || gameState.over) return;
    const isNeighbor = (gameState.neighbors || []).includes(roomIdx);
    if (isNeighbor || shootMode) {
      onRoomClick(roomIdx);
    }
  }, [gameState, shootMode, onRoomClick]);

  if (!gameState) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-cave-400 text-sm font-mono animate-pulse">Mapping the void…</p>
      </div>
    );
  }

  const { cave, positions, currentRoom, neighbors = [], visitedRooms = [] } = gameState;
  if (!cave || !positions) return null;

  // Scale positions to SVG viewport
  const rawPos = positions;
  const xs = rawPos.map(p => p.x), ys = rawPos.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 50;
  const scaleX = (x) => pad + ((x - minX) / (maxX - minX + 1)) * (W - pad * 2);
  const scaleY = (y) => pad + ((y - minY) / (maxY - minY + 1)) * (H - pad * 2);
  const scaled = rawPos.map(p => ({ x: scaleX(p.x), y: scaleY(p.y) }));

  // Build edges (deduplicated)
  const edges = new Set();
  for (let i = 0; i < cave.length; i++) {
    for (const nb of cave[i]) {
      const key = [Math.min(i, nb), Math.max(i, nb)].join('-');
      edges.add(key);
    }
  }

  return (
    <div className="w-full h-full relative">
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full"
      style={{ maxHeight: '100%' }}
    >
      <defs>
        <filter id="glow-green">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-red">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-purple">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-blue">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0e0702" />
          <stop offset="100%" stopColor="#070401" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width={W} height={H} fill="url(#bg-grad)" />

      {/* Fog of war — overlay for unvisited areas */}
      <rect width={W} height={H} fill="rgba(7,4,1,0.4)" />

      {/* Edges */}
      {[...edges].map(key => {
        const [a, b] = key.split('-').map(Number);
        const isActive = (visitedRooms.includes(a) || a === currentRoom) &&
                         (visitedRooms.includes(b) || b === currentRoom);
        const isPlayerEdge = (a === currentRoom && neighbors.includes(b)) ||
                              (b === currentRoom && neighbors.includes(a));
        return (
          <line
            key={key}
            x1={scaled[a].x} y1={scaled[a].y}
            x2={scaled[b].x} y2={scaled[b].y}
            stroke={isPlayerEdge ? '#6b4a2e' : isActive ? '#2e1a08' : '#120a03'}
            strokeWidth={isPlayerEdge ? 1.5 : 0.8}
            strokeDasharray={isActive ? 'none' : '4 4'}
            opacity={isActive ? 0.8 : 0.3}
          />
        );
      })}

      {/* Nodes */}
      {Array.from({ length: cave.length }, (_, i) => {
        const { x, y } = scaled[i];
        const style = getNodeStyle(i, gameState, shootMode);
        const icon = getNodeIcon(i, gameState);
        const isPlayer = i === currentRoom;
        const isNeighbor = neighbors.includes(i);
        const isClickable = isNeighbor || shootMode;
        const filterMap = { '#22c55e': 'glow-green', '#ef4444': 'glow-red', '#8b5cf6': 'glow-purple', '#3b82f6': 'glow-blue' };
        const filterName = style.glow ? filterMap[style.glow] : null;

        return (
          <g
            key={i}
            onClick={() => handleRoomClick(i)}
            style={{ cursor: isClickable ? 'pointer' : 'default' }}
            className={isClickable ? 'room-node' : ''}
          >
            {/* Glow halo for important nodes */}
            {style.glow && (
              <circle
                cx={x} cy={y}
                r={style.r + 6}
                fill={style.glow}
                opacity={0.15}
              />
            )}

            {/* Main circle */}
            <circle
              cx={x} cy={y}
              r={style.r}
              fill={style.fill}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              filter={filterName ? `url(#${filterName})` : undefined}
            />

            {/* Player indicator pulsing ring */}
            {isPlayer && (
              <circle
                cx={x} cy={y} r={style.r + 5}
                fill="none"
                stroke="#22c55e"
                strokeWidth={1}
                opacity={0.4}
              >
                <animate attributeName="r" values={`${style.r + 4};${style.r + 10};${style.r + 4}`}
                  dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Shoot mode highlight */}
            {shootMode && isNeighbor && !isPlayer && (
              <circle
                cx={x} cy={y} r={style.r + 4}
                fill="none" stroke="#dc2626" strokeWidth={1.5}
                strokeDasharray="3 3"
              >
                <animateTransform attributeName="transform" type="rotate"
                  from={`0 ${x} ${y}`} to={`360 ${x} ${y}`}
                  dur="3s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Icon inside node */}
            {icon && (
              <text
                x={x} y={y + 1}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={style.r < 10 ? 8 : 10}
                fill={isPlayer ? '#fff' : style.stroke}
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {icon}
              </text>
            )}

            {/* Room number */}
            <text
              x={x} y={y + style.r + 10}
              textAnchor="middle"
              fontSize={9}
              fill={isPlayer ? '#22c55e' : isNeighbor ? '#6b4a2e' : '#2e1a08'}
              fontFamily="monospace"
              style={{ userSelect: 'none', pointerEvents: 'none' }}
            >
              {i + 1}
            </text>

            {/* Hover area (transparent, larger) */}
            <circle
              cx={x} cy={y} r={style.r + 8}
              fill="transparent"
              onClick={() => handleRoomClick(i)}
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
            />
          </g>
        );
      })}

      {/* Legend */}
      <g transform="translate(10, 10)">
        {[
          { color: '#22c55e', label: 'You' },
          { color: '#ef4444', label: 'Wumpus' },
          { color: '#3b82f6', label: 'Pit' },
          { color: '#f59e0b', label: 'Bats' },
          { color: '#8b5cf6', label: 'Item' },
        ].map((item, i) => (
          <g key={item.label} transform={`translate(${i * 70}, 0)`}>
            <circle cx={6} cy={6} r={5} fill={item.color} opacity={0.7} />
            <text x={14} y={10} fontSize={9} fill="#6b4a2e" fontFamily="monospace">{item.label}</text>
          </g>
        ))}
      </g>

      {/* Shoot mode banner */}
      {shootMode && (
        <g transform={`translate(${W / 2}, ${H - 20})`}>
          <text textAnchor="middle" fontSize={11} fill="#dc2626" fontFamily="monospace"
            opacity={0.9}>
            ⚡ SHOOT MODE — click a room to fire ⚡
          </text>
        </g>
      )}
    </svg>

    {/* HTML legend overlay */}
    <div className="absolute top-2 left-2 flex gap-3 flex-wrap">
      {[
        { color: '#22c55e', label: 'You', hint: 'Your current position' },
        { color: '#ef4444', label: 'Wumpus', hint: 'Wumpus location — only shown after Thermal Vision' },
        { color: '#3b82f6', label: 'Pit', hint: 'Bottomless pit — revealed by Echo Scan' },
        { color: '#f59e0b', label: 'Bats', hint: 'Bats — will transport you to a random room' },
        { color: '#8b5cf6', label: 'Item', hint: 'Power-up or lore fragment' },
      ].map(item => (
        <Tooltip key={item.label} content={item.hint} position="bottom">
          <div className="flex items-center gap-1 cursor-help">
            <div className="w-2 h-2 rounded-full" style={{ background: item.color, opacity: 0.85 }} />
            <span className="text-cave-600 font-mono" style={{ fontSize: '9px' }}>{item.label}</span>
          </div>
        </Tooltip>
      ))}
    </div>
  </div>
  );
}
