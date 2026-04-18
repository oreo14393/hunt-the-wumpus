# WUMPUS — Into the Dark
### A Psychological Horror Cave Exploration Game

---

## Overview

A full-stack reimagining of Hunt the Wumpus with:
- **Intelligent Wumpus AI** (BFS pathfinding, pattern learning, deceptive signals)
- **Sanity system** (hallucinations, fake clues, UI distortion)
- **Dynamic cave** (rooms collapse, passages shift each game)
- **5 power-ups** (Echo Scan, Thermal Vision, Time Freeze, Decoy Arrow, Sanity Tonic)
- **4 unique endings** (Hunter, Survivor, Corruption, various deaths)
- **MongoDB leaderboard** with user auth
- **Real-time WebSocket** game engine

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, WebSocket (ws) |
| Database | MongoDB (Mongoose) |
| Auth | JWT |

---

## Project Structure

```
wumpus-game/
├── client/                     # React frontend
│   ├── public/index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── index.css           # Tailwind + custom animations
│   │   ├── components/
│   │   │   ├── Game.jsx        # Main game screen
│   │   │   ├── CaveMap.jsx     # SVG graph visualization
│   │   │   ├── HUD.jsx         # Sanity, arrows, inventory
│   │   │   ├── NarratorPanel.jsx
│   │   │   ├── ActionControls.jsx
│   │   │   ├── HallucinationOverlay.jsx
│   │   │   ├── GameOver.jsx    # Ending screen + score
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── MainMenu.jsx
│   │   │   └── AuthModal.jsx
│   │   ├── context/
│   │   │   ├── GameContext.js  # Central game state
│   │   │   └── AuthContext.js
│   │   └── hooks/
│   │       └── useGameSocket.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── server/                     # Node.js backend
    ├── index.js                # Express + WebSocket server
    ├── game/
    │   └── engine.js           # Full game logic
    ├── models/
    │   ├── User.js
    │   └── GameSession.js
    ├── routes/
    │   ├── auth.js
    │   └── leaderboard.js
    ├── middleware/
    │   └── auth.js
    ├── package.json
    └── .env.example
```

---

## Prerequisites

- **Node.js** v18+
- **MongoDB** running locally (or MongoDB Atlas URI)
- **npm** or **yarn**

---

## Installation

### 1. Clone / create the project

```bash
# If using the provided files, navigate to the project root
cd wumpus-game
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Configure server environment

```bash
cp .env.example .env
# Edit .env:
# PORT=4000
# MONGODB_URI=mongodb://localhost:27017/wumpus_game
# JWT_SECRET=change_this_to_a_random_secret
# CLIENT_URL=http://localhost:3000
```

### 4. Install client dependencies

```bash
cd ../client
npm install
```

---

## Running the Game

### Start MongoDB (if running locally)

```bash
mongod
# or on macOS with homebrew:
brew services start mongodb-community
```

### Start the backend (terminal 1)

```bash
cd server
npm run dev
# Server runs on http://localhost:4000
# WebSocket on ws://localhost:4000/ws
```

### Start the frontend (terminal 2)

```bash
cd client
npm start
# React dev server on http://localhost:3000
```

### Open the game

Navigate to **http://localhost:3000**

---

## Environment Variables

### Server (`server/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/wumpus_game` | MongoDB connection |
| `JWT_SECRET` | — | Secret for JWT signing (required) |
| `CLIENT_URL` | `http://localhost:3000` | CORS origin |

### Client

Create `client/.env` for custom configuration:

```env
REACT_APP_WS_URL=ws://localhost:4000/ws
REACT_APP_API_URL=http://localhost:4000
```

---

## Gameplay Guide

### Movement
- Click any highlighted adjacent room on the map to move there
- Visited rooms stay partially lit; unvisited rooms are dark

### Shooting
- Click **Shoot** in the action bar to enter shoot mode
- Click a room to fire (direct neighbors + 1 hop)
- You have **5 arrows** — use them wisely

### Power-ups (collected by entering their room)
| Power-up | Effect |
|----------|--------|
| Echo Scan | Reveals all hazards within 2 rooms |
| Thermal Vision | Pinpoints Wumpus location exactly |
| Time Freeze | Stops cave changes + Wumpus movement for 5 turns |
| Decoy Arrow | Sends Wumpus toward a decoy position |
| Sanity Tonic | Restores 40% sanity |

### Sanity
- Decreases each turn
- Near the Wumpus: -8 per turn
- Near pits: -5
- At low sanity: hallucinations appear, fake clues trigger
- At 0: sanity ending

### Corruption
- Increases from movement and reading lore
- At 100%: corruption ending (you become the Wumpus)

### Sensory Clues
- **Cold wind from below** → pit in adjacent room
- **Leathery rustling** → bats nearby
- **Ancient stench / deep vibration** → Wumpus adjacent
- **Phosphorescent glow** → power-up nearby
- **Writing on the wall** → lore fragment nearby

### Endings
1. **Hunter's Ending** — Kill the Wumpus (shoot into its room)
2. **Survivor's Ending** — Find the exit tunnel (secret room)
3. **Corruption Ending** — Reach 100% corruption
4. **Death Endings** — Eaten, pit, sanity collapse

---

## Production Build

```bash
# Build frontend
cd client
npm run build

# Serve static files from server
# Add this to server/index.js:
# app.use(express.static(path.join(__dirname, '../client/build')));
```

---

## Notes

- The game runs without MongoDB (leaderboard disabled, game still fully playable)
- WebSocket reconnects automatically on disconnect
- Each game generates a unique 22-room cave with procedural hazard placement
- The Wumpus uses BFS pathfinding and tracks your last 10 moves for pattern-based hunting
