require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const authRoutes = require('./routes/auth');
const leaderboardRoutes = require('./routes/leaderboard');
const { createGame, actionMove, actionShoot, actionUsePowerup, getClientState } = require('./game/engine');

const app = express();
const server = http.createServer(app);

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// ─── REST ROUTES ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// ─── WEBSOCKET SERVER ─────────────────────────────────────────
const wss = new WebSocket.Server({ server, path: '/ws' });

// In-memory game sessions (could move to Redis in production)
const gameSessions = new Map();

function send(ws, type, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, ...payload }));
  }
}

function sendError(ws, message) {
  send(ws, 'error', { message });
}

wss.on('connection', (ws) => {
  let sessionId = null;
  console.log('[WS] Client connected');

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); }
    catch { return sendError(ws, 'Invalid JSON'); }

    const { type, payload = {} } = msg;

    switch (type) {

      // ── NEW GAME ──────────────────────────────────────────
      case 'new_game': {
        const state = createGame(payload.userId || null, payload.username || 'Anonymous');
        sessionId = state.sessionId;
        gameSessions.set(sessionId, state);

        send(ws, 'game_state', {
          state: getClientState(state),
          narrator: state.narratorMessage,
          roomDescription: getClientState(state).roomDescription,
          clues: [],
        });
        console.log(`[WS] New game: ${sessionId}`);
        break;
      }

      // ── MOVE ──────────────────────────────────────────────
      case 'move': {
        const state = gameSessions.get(payload.sessionId);
        if (!state) return sendError(ws, 'Session not found.');
        const targetRoom = parseInt(payload.room);
        if (isNaN(targetRoom)) return sendError(ws, 'Invalid room.');

        const result = actionMove(state, targetRoom);
        if (!result.ok) return sendError(ws, result.message);

        const clientState = getClientState(state);
        send(ws, 'game_state', {
          state: clientState,
          narrator: result.narrator,
          roomDescription: result.roomDescription,
          clues: result.clues || [],
          events: result.events || [],
          hallucination: result.hallucination || null,
          over: result.over,
          ending: result.ending || null,
        });
        break;
      }

      // ── SHOOT ─────────────────────────────────────────────
      case 'shoot': {
        const state = gameSessions.get(payload.sessionId);
        if (!state) return sendError(ws, 'Session not found.');
        const targetRoom = parseInt(payload.room);
        if (isNaN(targetRoom)) return sendError(ws, 'Invalid room.');

        const result = actionShoot(state, targetRoom);
        if (!result.ok) return sendError(ws, result.message);

        const clientState = getClientState(state);
        send(ws, 'game_state', {
          state: clientState,
          narrator: result.narrator,
          clues: result.clues || [],
          events: result.events || [],
          over: result.over,
          ending: result.ending || null,
        });
        break;
      }

      // ── USE POWER-UP ──────────────────────────────────────
      case 'use_powerup': {
        const state = gameSessions.get(payload.sessionId);
        if (!state) return sendError(ws, 'Session not found.');

        const result = actionUsePowerup(state, payload.powerupType);
        if (!result.ok) return sendError(ws, result.message);

        const clientState = getClientState(state);
        send(ws, 'game_state', {
          state: clientState,
          narrator: result.narrator,
          powerupResult: {
            type: payload.powerupType,
            revealedRooms: result.revealedRooms,
            revealedHazards: result.revealedHazards,
            wumpusRoom: result.wumpusRoom,
            wumpusDistance: result.wumpusDistance,
          },
          clues: [],
          events: [],
        });
        break;
      }

      // ── GET STATE ─────────────────────────────────────────
      case 'get_state': {
        const state = gameSessions.get(payload.sessionId);
        if (!state) return sendError(ws, 'Session not found.');
        send(ws, 'game_state', { state: getClientState(state), clues: [], events: [] });
        break;
      }

      // ── PING ──────────────────────────────────────────────
      case 'ping':
        send(ws, 'pong', { time: Date.now() });
        break;

      default:
        sendError(ws, `Unknown message type: ${type}`);
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Client disconnected. Session: ${sessionId}`);
    // Keep session in memory for 30 min in case of reconnect
    if (sessionId) {
      setTimeout(() => gameSessions.delete(sessionId), 30 * 60 * 1000);
    }
  });

  ws.on('error', (err) => console.error('[WS] Error:', err.message));
});

// ─── DATABASE ─────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wumpus_game';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('[DB] MongoDB connected');
    
    server.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
      console.log(`[WS] WebSocket on ws://localhost:${PORT}/ws`);
    });
  })
  .catch(err => {
    console.error('[DB] Connection failed:', err.message);
    console.log('[Server] Starting without DB (leaderboard disabled)');
    server.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT} (no DB)`);
    });
  });

module.exports = { app, server };
