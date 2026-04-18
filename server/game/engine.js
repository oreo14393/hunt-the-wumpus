// ============================================================
// CAVE ENGINE — procedural generation + game logic
// ============================================================
const { v4: uuidv4 } = require('uuid');

// ─── CONSTANTS ───────────────────────────────────────────────
const NUM_ROOMS = 22;
const NUM_PITS = 3;
const NUM_BATS = 3;
const NUM_POWERUPS = 5;
const INITIAL_ARROWS = 5;
const INITIAL_SANITY = 100;
const SANITY_DECAY_MOVE = 1.5;
const SANITY_DECAY_WUMPUS_NEAR = 8;
const SANITY_DECAY_PIT_NEAR = 5;
const SANITY_DECAY_BAT_TRIGGER = 10;
const WUMPUS_HUNT_CHANCE = 0.35;
const CORRUPTION_GAIN_MOVE = 1;
const CORRUPTION_GAIN_LORE = 5;
const SANITY_WUMPUS_NEAR = 8; // alias — same as SANITY_DECAY_WUMPUS_NEAR

// ─── LORE FRAGMENTS ──────────────────────────────────────────
const LORE_FRAGMENTS = [
  "Scratched into the wall: 'I heard it breathing on day 3. By day 7, I was breathing the same way.'",
  "A crude drawing: a figure with too many limbs standing in a circle of bones.",
  "A journal page: 'The creature doesn't just hunt. It waits. It learns. It *remembers*.'",
  "Carved letters: 'THERE ARE SEVEN OF US. THERE IS ONE LEFT. THE OTHER SIX ARE STILL HERE.'",
  "A map, mostly destroyed. The last readable note: 'Do NOT enter room marked with the eye.'",
  "Blood writing: 'It offered me a choice. I should have chosen faster.'",
  "A child's drawing of a monster with a human face.",
  "Notes: 'Day 14. I've started to notice I think like it does. This concerns me less than it should.'",
  "Etched: 'The cave breathes. Count the inhales. Never the exhales.'",
  "Final entry: 'I understand now. The Wumpus was never the most dangerous thing down here.'"
];

// ─── ROOM DESCRIPTIONS ───────────────────────────────────────
const ROOM_DESCRIPTIONS = [
  "Damp limestone walls glisten with moisture. Your torch casts long, dancing shadows.",
  "The ceiling here is impossibly high. Something has carved symbols you don't recognize.",
  "Bones — animal, you think — are piled in the corner. You don't look too closely.",
  "A faint breeze carries the smell of iron. Or perhaps copper. Perhaps something else.",
  "The walls narrow here. Your heartbeat echoes back at you, slightly wrong.",
  "Someone has been here before. The torch sconces are burned down to nothing.",
  "The floor is smooth, worn by countless footsteps. Or one set of footsteps, countless times.",
  "Crystals grow from the ceiling, refracting your torchlight into fractured rainbows.",
  "A low humming fills the air. It stops the moment you notice it.",
  "The walls here are warm. Not unpleasantly so. Just enough to notice.",
  "You smell sulfur. Or incense. It's difficult to tell in the dark.",
  "Claw marks score the walls at a height that makes you uncomfortable.",
  "An underground stream somewhere below makes the floor vibrate slightly.",
  "The air tastes of minerals and something older. This room predates humanity.",
  "Ancient cave paintings — hunting scenes — but the hunters have no faces.",
  "Your shadow moves a half-second after you do. You stop moving and check. It's fine.",
  "A pile of arrows. Someone shot them all in the same direction. None returned.",
  "The acoustics here are strange. Your voice sounds like someone else's.",
  "Water drips in a pattern that almost sounds like a word. You choose not to listen.",
  "A ring of scorched earth in the center. Nothing will grow here. Nothing did.",
  "The tunnel ahead curves sharply. You can't see what's around the bend.",
  "This room is perfectly circular. It shouldn't be. Nothing natural is perfectly circular."
];

// ─── ATMOSPHERIC CLUES ───────────────────────────────────────
const CLUES = {
  pit: [
    "A cold draught rises from below — a bottomless sigh from the earth's lungs.",
    "The floor sounds hollow beneath your feet. You step more carefully.",
    "Distant rushing air, like something very large exhaling from far below.",
    "Your torch flame bends downward, as if gravity itself leans toward the abyss.",
  ],
  bat: [
    "A dry, papery rustling — a hundred whispers compressed into leather wings.",
    "You sense movement at the edge of vision. Nothing is there when you look.",
    "A high-pitched frequency, just beyond hearing, vibrates in your molars.",
    "Guano. Fresh. The smell is almost reassuring — at least it's alive.",
  ],
  wumpus: [
    "An ancient stench reaches you — warm, wet, and unmistakably alive.",
    "The walls vibrate with something low and rhythmic. Not a sound. A presence.",
    "Your instincts, sharpened by millennia of prey-animal evolution, scream.",
    "A deep exhalation somewhere close. It smells of iron and patience.",
    "The Wumpus is near. You know this the way prey knows a predator.",
  ],
  powerup: [
    "A faint phosphorescent glow emanates from a nearby passage.",
    "Something glitters in the darkness — deliberate, like a trap, or a gift.",
  ],
  lore: [
    "You see writing on the wall. Something was here long enough to write.",
  ],
  secret: [
    "The wall here sounds different when you tap it. A hollow resonance.",
    "An almost imperceptible draft from a wall that should be solid.",
  ]
};

const FAKE_CLUES = [
  "You smell the Wumpus — close, so close — but the scent trail leads nowhere.",
  "The ground trembles. A pit? No. Nothing. Your mind is playing tricks.",
  "Wings. Definitely wings. But when you raise your torch, only empty air.",
  "A howl from ahead. Silence. Then you realize: it was your own voice.",
  "You see movement — a shape just beyond the torchlight. It was a stalactite.",
];

const HALLUCINATION_MESSAGES = [
  "Room 7. You've been in Room 7 before. This is Room 7 again. Isn't it?",
  "There's a door that wasn't here before. You decide not to open it.",
  "Your name is written on the wall in your own handwriting. The date is wrong.",
  "The tunnel ahead curves back to where you started, but the room is different.",
  "You hear yourself laughing from the next room. You are not laughing.",
  "The bones in the corner have rearranged themselves. Probably.",
  "You count your arrows. Then again. The numbers don't agree.",
];

// ─── UTILITY ─────────────────────────────────────────────────
function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rng(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// BFS distance
function bfsDist(graph, src, dst) {
  if (src === dst) return 0;
  const visited = new Set([src]);
  const queue = [{ node: src, dist: 0 }];
  while (queue.length) {
    const { node, dist } = queue.shift();
    for (const nb of graph[node] || []) {
      if (nb === dst) return dist + 1;
      if (!visited.has(nb)) { visited.add(nb); queue.push({ node: nb, dist: dist + 1 }); }
    }
  }
  return 999;
}

// BFS shortest path
function bfsPath(graph, src, dst) {
  if (src === dst) return [];
  const visited = new Set([src]);
  const queue = [{ node: src, path: [] }];
  while (queue.length) {
    const { node, path } = queue.shift();
    for (const nb of graph[node] || []) {
      if (!visited.has(nb)) {
        const newPath = [...path, nb];
        if (nb === dst) return newPath;
        visited.add(nb);
        queue.push({ node: nb, path: newPath });
      }
    }
  }
  return [];
}

// ─── CAVE GENERATION ─────────────────────────────────────────
function generateCave(n) {
  const adj = Array.from({ length: n }, () => new Set());
  const perm = shuffle([...Array(n).keys()]);
  // Spanning tree
  for (let i = 1; i < n; i++) {
    const a = perm[i], b = perm[i - 1];
    adj[a].add(b); adj[b].add(a);
  }
  // Add extra edges (target avg degree ~3.5)
  let attempts = n * 5;
  while (attempts-- > 0) {
    const a = rng(0, n - 1), b = rng(0, n - 1);
    if (a !== b && !adj[a].has(b) && adj[a].size < 4 && adj[b].size < 4) {
      adj[a].add(b); adj[b].add(a);
    }
  }
  return adj.map(s => [...s]);
}

// Compute 2D positions for graph layout (spring embedding)
function computePositions(cave, n) {
  const W = 800, H = 600;
  let pos = Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * 2 * Math.PI;
    const r = 200 + (Math.random() - 0.5) * 80;
    return { x: W / 2 + r * Math.cos(angle), y: H / 2 + r * Math.sin(angle) };
  });

  for (let iter = 0; iter < 120; iter++) {
    const force = pos.map(() => ({ x: 0, y: 0 }));
    // Repulsion
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[j].x - pos[i].x, dy = pos[j].y - pos[i].y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = 18000 / (d * d);
        force[i].x -= f * dx / d; force[i].y -= f * dy / d;
        force[j].x += f * dx / d; force[j].y += f * dy / d;
      }
    }
    // Attraction along edges
    for (let i = 0; i < n; i++) {
      for (const nb of cave[i]) {
        const dx = pos[nb].x - pos[i].x, dy = pos[nb].y - pos[i].y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = 0.04 * (d - 100);
        force[i].x += f * dx / d; force[i].y += f * dy / d;
      }
    }
    for (let i = 0; i < n; i++) {
      pos[i].x = Math.max(40, Math.min(W - 40, pos[i].x + force[i].x * 0.25));
      pos[i].y = Math.max(40, Math.min(H - 40, pos[i].y + force[i].y * 0.25));
    }
  }
  return pos.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
}

// ─── GAME STATE FACTORY ──────────────────────────────────────
function createGame(userId, username) {
  const cave = generateCave(NUM_ROOMS);
  const positions = computePositions(cave, NUM_ROOMS);
  const used = new Set();
  const pick = () => {
    let r;
    do { r = rng(0, NUM_ROOMS - 1); } while (used.has(r));
    used.add(r); return r;
  };

  const player = pick();
  const wumpus = pick();
  const pits = Array.from({ length: NUM_PITS }, pick);
  const bats = Array.from({ length: NUM_BATS }, pick);

  // Power-ups
  const powerupTypes = shuffle(['echo_scan', 'thermal_vision', 'time_freeze', 'decoy_arrow', 'sanity_restore']);
  const powerups = {};
  for (let i = 0; i < NUM_POWERUPS; i++) {
    const room = pick();
    powerups[room] = { type: powerupTypes[i], collected: false };
  }

  // Lore fragments (in some rooms)
  const loreRooms = {};
  const loreIndices = shuffle([...Array(LORE_FRAGMENTS.length).keys()]).slice(0, 6);
  for (let i = 0; i < 6; i++) {
    const room = pick();
    loreRooms[room] = { index: loreIndices[i], read: false };
  }

  // Secret room (hidden passage)
  const secretRoom = pick();
  const secretTarget = pick();
  // Add one-way passage from secret to target
  cave[secretRoom] = [...cave[secretRoom], secretTarget];

  // Room descriptions (assign permanently)
  const shuffledDescs = shuffle([...Array(ROOM_DESCRIPTIONS.length).keys()]);
  const roomDescs = {};
  for (let i = 0; i < NUM_ROOMS; i++) {
    roomDescs[i] = shuffledDescs[i % ROOM_DESCRIPTIONS.length];
  }

  return {
    sessionId: uuidv4(),
    userId,
    username: username || 'Anonymous',
    cave,
    positions,
    player,
    wumpus,
    pits: new Set(pits),
    bats: new Set(bats),
    powerups,
    loreRooms,
    secretRoom,
    secretTarget,
    roomDescs,
    arrows: INITIAL_ARROWS,
    sanity: INITIAL_SANITY,
    corruption: 0,
    turns: 0,
    visitedRooms: new Set([player]),
    revealedRooms: new Set(),   // echo scan / thermal vision revealed
    immuneTurns: 0,
    timeFrozen: 0,
    decoyActive: null,          // room of active decoy
    wumpusPattern: [],          // tracks player movement for AI learning
    wumpusLastKnown: null,
    wumpusAnger: 0,             // increases as player lingers near
    over: false,
    won: false,
    ending: null,
    log: [],
    stats: {
      roomsExplored: 1,
      arrowsShot: 0,
      arrowsHit: 0,
      turnsPlayed: 0,
      sanityAtEnd: INITIAL_SANITY,
      powerupsCollected: 0,
      loreFragmentsFound: 0,
      corruptionLevel: 0
    },
    // For UI — what the client needs to know
    collapsingRooms: new Set(), // rooms that will collapse next turn
    shiftedEdges: [],           // temporary extra/removed edges
    narratorMessage: "You descend. The torch sputters. The dark is absolute. You are not alone.",
    pendingHallucination: null,
    fakeClues: new Set(),       // rooms with planted fake clues
  };
}

// ─── CLUE ENGINE ─────────────────────────────────────────────
function getCluesForRoom(state, room) {
  const neighbors = state.cave[room];
  const clues = [];
  const useFakeClues = state.sanity < 55;

  for (const nb of neighbors) {
    if (state.pits.has(nb)) clues.push({ type: 'pit', message: rnd(CLUES.pit) });
    if (state.bats.has(nb)) clues.push({ type: 'bat', message: rnd(CLUES.bat) });
    if (nb === state.wumpus) clues.push({ type: 'wumpus', message: rnd(CLUES.wumpus) });
    if (state.powerups[nb] && !state.powerups[nb].collected)
      clues.push({ type: 'powerup', message: rnd(CLUES.powerup) });
    if (state.loreRooms[nb] && !state.loreRooms[nb].read)
      clues.push({ type: 'lore', message: rnd(CLUES.lore) });
    if (nb === state.secretRoom)
      clues.push({ type: 'secret', message: rnd(CLUES.secret) });
  }

  // Fake clues injected by low sanity
  if (useFakeClues && Math.random() < 0.45) {
    clues.push({ type: 'fake', message: rnd(FAKE_CLUES) });
  }

  // Wumpus deliberately sends false signal
  if (state.wumpusAnger > 3 && Math.random() < 0.3) {
    const fakeType = rnd(['pit', 'bat', 'wumpus']);
    clues.push({ type: `fake_${fakeType}`, message: rnd(CLUES[fakeType]) });
  }

  return clues;
}

// ─── WUMPUS AI ───────────────────────────────────────────────
function moveWumpus(state) {
  if (state.timeFrozen > 0) return { moved: false, message: "The cave holds its breath." };

  const neighbors = state.cave[state.wumpus];
  const playerMoves = state.wumpusPattern.slice(-5);

  // Intelligent: use BFS to move toward player, biased by pattern learning
  let target = state.player;

  // If decoy is active, 60% chance Wumpus goes for decoy
  if (state.decoyActive !== null && Math.random() < 0.6) {
    target = state.decoyActive;
    state.decoyActive = null;
  }

  const path = bfsPath(state.cave, state.wumpus, target);
  let nextRoom = null;

  if (path.length > 0 && Math.random() < WUMPUS_HUNT_CHANCE) {
    // Move toward player
    nextRoom = path[0];
  } else {
    // Random move
    nextRoom = rnd(neighbors);
  }

  if (nextRoom !== null && nextRoom !== undefined) {
    state.wumpus = nextRoom;
  }

  // Increase anger if player is nearby
  const dist = bfsDist(state.cave, state.wumpus, state.player);
  if (dist <= 2) state.wumpusAnger = Math.min(10, state.wumpusAnger + 1);
  state.wumpusLastKnown = state.wumpus;

  return {
    moved: true,
    message: dist <= 2
      ? "A deep vibration passes through the floor — the Wumpus is moving."
      : "Somewhere deep in the cave, something shifts."
  };
}

// ─── CAVE COLLAPSE ───────────────────────────────────────────
function maybeCaveCollapse(state) {
  if (state.timeFrozen > 0) {
    state.timeFrozen--;
    return [];
  }

  const events = [];
  // Every ~8 turns, a random room might collapse (pit spawns)
  if (state.turns > 5 && state.turns % 8 === 0) {
    const candidates = [];
    for (let i = 0; i < NUM_ROOMS; i++) {
      if (!state.pits.has(i) && i !== state.player && i !== state.wumpus) {
        candidates.push(i);
      }
    }
    if (candidates.length > 0) {
      const collapseRoom = rnd(candidates);
      state.pits.add(collapseRoom);
      state.collapsingRooms.add(collapseRoom);
      events.push({
        type: 'collapse',
        room: collapseRoom,
        message: `A distant rumble echoes through the cave. Room ${collapseRoom + 1} has collapsed.`
      });
    }
  }

  // Occasionally shift an edge (remove/add connection)
  if (state.turns > 10 && Math.random() < 0.08) {
    const roomA = rng(0, NUM_ROOMS - 1);
    const eligible = state.cave[roomA].filter(r => r !== state.player && r !== state.wumpus);
    if (eligible.length > 1) {
      const removeIdx = rng(0, eligible.length - 1);
      const removeRoom = eligible[removeIdx];
      state.cave[roomA] = state.cave[roomA].filter(r => r !== removeRoom);
      state.cave[removeRoom] = state.cave[removeRoom].filter(r => r !== roomA);
      events.push({
        type: 'shift',
        message: `The cave groans. A passage you remember seems different now.`
      });
    }
  }

  return events;
}

// ─── ACTION: MOVE ────────────────────────────────────────────
function actionMove(state, targetRoom) {
  if (state.over) return { ok: false, message: "The game is over." };
  if (!state.cave[state.player].includes(targetRoom)) {
    return { ok: false, message: "There is no passage to that room." };
  }

  state.player = targetRoom;
  state.visitedRooms.add(targetRoom);
  state.turns++;
  state.stats.turnsPlayed++;
  state.stats.roomsExplored = state.visitedRooms.size;
  // Clear collapsing rooms display each turn
  state.collapsingRooms = new Set();

  // Track movement for Wumpus AI
  state.wumpusPattern.push(targetRoom);
  if (state.wumpusPattern.length > 10) state.wumpusPattern.shift();

  // Sanity decay
  let sanityLoss = SANITY_DECAY_MOVE;
  if (state.immuneTurns > 0) { state.immuneTurns--; sanityLoss = 0; }
  state.sanity = Math.max(0, state.sanity - sanityLoss);

  // Corruption grows slowly
  state.corruption = Math.min(100, state.corruption + CORRUPTION_GAIN_MOVE);

  const events = [];

  // Check room hazards
  if (state.pits.has(targetRoom) && state.immuneTurns === 0) {
    state.over = true; state.won = false; state.ending = 'fell_pit';
    state.stats.sanityAtEnd = Math.round(state.sanity);
    state.stats.corruptionLevel = Math.round(state.corruption);
    return {
      ok: true, over: true, ending: 'fell_pit',
      narrator: "The floor gives way beneath your feet. The void is absolute, and infinite, and it rises to meet you.",
      events
    };
  }

  if (state.bats.has(targetRoom)) {
    state.sanity = Math.max(0, state.sanity - SANITY_DECAY_BAT_TRIGGER);
    const dest = (() => {
      let r;
      do { r = rng(0, NUM_ROOMS - 1); } while (r === targetRoom);
      return r;
    })();
    state.player = dest;
    state.visitedRooms.add(dest);
    events.push({
      type: 'bat_transport',
      from: targetRoom,
      to: dest,
      message: `Enormous wings engulf you — you are lifted, spun, and deposited in Room ${dest + 1} with brutal indifference.`
    });

    if (state.pits.has(dest) && state.immuneTurns === 0) {
      state.over = true; state.won = false; state.ending = 'fell_pit';
      state.stats.sanityAtEnd = Math.round(state.sanity);
      return {
        ok: true, over: true, ending: 'fell_pit',
        narrator: "The bats drop you. There is no floor.",
        events
      };
    }
    if (dest === state.wumpus) {
      state.over = true; state.won = false; state.ending = 'eaten';
      state.stats.sanityAtEnd = Math.round(state.sanity);
      return {
        ok: true, over: true, ending: 'eaten',
        narrator: "The bats deliver you directly to the Wumpus. The irony is not lost on you, briefly.",
        events
      };
    }
  }

  if (state.player === state.wumpus) {
    state.over = true; state.won = false; state.ending = 'eaten';
    state.stats.sanityAtEnd = Math.round(state.sanity);
    return {
      ok: true, over: true, ending: 'eaten',
      narrator: "You walk directly into the Wumpus. It does not step aside.",
      events
    };
  }

  // Sanity death
  if (state.sanity <= 0) {
    state.over = true; state.won = false; state.ending = 'sanity_lost';
    state.stats.sanityAtEnd = 0;
    return {
      ok: true, over: true, ending: 'sanity_lost',
      narrator: "Darkness — not the cave's — takes you. You sit down. You do not get up. The cave accepts you, gently, as one of its own.",
      events
    };
  }

  // Corruption ending check
  if (state.corruption >= 100) {
    state.over = true; state.won = true; state.ending = 'became_wumpus';
    state.stats.corruptionLevel = 100;
    return {
      ok: true, over: true, ending: 'became_wumpus',
      narrator: "You realize you haven't thought about leaving in days. The cave is yours now. You are the Wumpus now.",
      events
    };
  }

  // Collect power-ups and lore
  if (state.powerups[targetRoom] && !state.powerups[targetRoom].collected) {
    const pu = state.powerups[targetRoom];
    pu.collected = true;
    state.stats.powerupsCollected++;
    events.push({ type: 'powerup_found', powerup: pu.type, room: targetRoom });
  }

  if (state.loreRooms[targetRoom] && !state.loreRooms[targetRoom].read) {
    const lore = state.loreRooms[targetRoom];
    lore.read = true;
    state.corruption = Math.min(100, state.corruption + CORRUPTION_GAIN_LORE);
    state.stats.loreFragmentsFound++;
    events.push({
      type: 'lore_found',
      text: LORE_FRAGMENTS[lore.index],
      room: targetRoom
    });
  }

  // Cave changes
  const caveEvents = maybeCaveCollapse(state);
  events.push(...caveEvents);

  // Wumpus moves
  const wumpusEvent = moveWumpus(state);
  if (wumpusEvent.moved) events.push({ type: 'wumpus_move', message: wumpusEvent.message });

  // Check if Wumpus moved onto player
  if (state.player === state.wumpus && !state.over) {
    state.over = true; state.won = false; state.ending = 'eaten';
    state.stats.sanityAtEnd = Math.round(state.sanity);
    return {
      ok: true, over: true, ending: 'eaten',
      narrator: "The Wumpus found you. It knew exactly where you'd be.",
      events
    };
  }

  // Clues for current room
  const clues = getCluesForRoom(state, state.player);

  // Sanity extra decay near hazards
  const neighbors = state.cave[state.player];
  if (neighbors.includes(state.wumpus)) state.sanity = Math.max(0, state.sanity - SANITY_WUMPUS_NEAR);
  for (const nb of neighbors) if (state.pits.has(nb)) { state.sanity = Math.max(0, state.sanity - SANITY_DECAY_PIT_NEAR); break; }

  // Hallucination
  let hallucination = null;
  if (state.sanity < 40 && Math.random() < 0.4) {
    hallucination = rnd(HALLUCINATION_MESSAGES);
  }

  // Narrator
  const narrator = buildNarrator(state, clues, targetRoom);

  return {
    ok: true, over: false,
    narrator,
    clues,
    events,
    hallucination,
    roomDescription: ROOM_DESCRIPTIONS[state.roomDescs[state.player] || 0]
  };
}

// ─── ACTION: SHOOT ───────────────────────────────────────────
function actionShoot(state, targetRoom) {
  if (state.over) return { ok: false, message: "The game is over." };
  if (!state.cave[state.player].includes(targetRoom)) {
    // Allow shooting through 1 additional room (skill shot)
    const reachable = new Set(state.cave[state.player]);
    for (const nb of state.cave[state.player]) {
      for (const nb2 of state.cave[nb]) reachable.add(nb2);
    }
    if (!reachable.has(targetRoom)) {
      return { ok: false, message: "Your arrow cannot reach that room." };
    }
  }

  state.arrows--;
  state.turns++;
  state.stats.turnsPlayed++;
  state.stats.arrowsShot++;

  const hit = targetRoom === state.wumpus;

  if (hit) {
    state.stats.arrowsHit++;
    state.over = true; state.won = true; state.ending = 'wumpus_killed';
    state.stats.sanityAtEnd = Math.round(state.sanity);
    return {
      ok: true, over: true, ending: 'wumpus_killed',
      narrator: "A hideous sound — part shriek, part thunder — collapses through the cave. Then silence. A silence you haven't heard in a long time. The Wumpus is dead. You did it. You are done."
    };
  }

  // Miss — possibly wake Wumpus
  state.wumpusAnger = Math.min(10, state.wumpusAnger + 3);
  const moveResult = moveWumpus(state);

  if (state.player === state.wumpus) {
    state.over = true; state.won = false; state.ending = 'eaten';
    state.stats.sanityAtEnd = Math.round(state.sanity);
    return {
      ok: true, over: true, ending: 'eaten',
      narrator: "Your arrow missed — and your position was announced. The Wumpus was already moving."
    };
  }

  if (state.arrows <= 0) {
    return {
      ok: true, over: false,
      narrator: "The arrow clatters into darkness. Miss. And you have no arrows left. You are now prey with no fangs.",
      events: [{ type: 'arrow_miss', message: moveResult.message }],
      clues: getCluesForRoom(state, state.player)
    };
  }

  return {
    ok: true, over: false,
    narrator: "Miss. The sound of your arrow finding stone is the loneliest sound in the world.",
    events: [{ type: 'arrow_miss', message: moveResult.message }],
    clues: getCluesForRoom(state, state.player)
  };
}

// ─── ACTION: USE POWER-UP ────────────────────────────────────
function actionUsePowerup(state, powerupType) {
  // Find it in inventory (must have been collected)
  const collectedRoom = Object.entries(state.powerups).find(
    ([, pu]) => pu.type === powerupType && pu.collected
  );
  if (!collectedRoom) return { ok: false, message: "You don't have that power-up." };
  // Mark as used (remove from powerups)
  delete state.powerups[collectedRoom[0]];

  switch (powerupType) {
    case 'echo_scan': {
      // Reveal all rooms within 2 hops
      const toReveal = new Set([state.player]);
      const q = [state.player];
      for (let depth = 0; depth < 2; depth++) {
        const next = [];
        for (const r of q) for (const nb of state.cave[r]) { toReveal.add(nb); next.push(nb); }
        q.push(...next);
      }
      toReveal.forEach(r => state.revealedRooms.add(r));
      return {
        ok: true,
        narrator: "The Echo Scan pulses outward. For a moment, you see everything within two passages — including what lurks there.",
        revealedRooms: [...toReveal],
        revealedHazards: buildHazardReveal(state, [...toReveal])
      };
    }
    case 'thermal_vision': {
      // Reveal Wumpus location and 3-step radius
      const path = bfsPath(state.cave, state.player, state.wumpus);
      state.revealedRooms.add(state.wumpus);
      return {
        ok: true,
        narrator: `Thermal Vision activated. A hot mass of orange and red blooms ${path.length} rooms away. You know exactly where the Wumpus is.`,
        wumpusRoom: state.wumpus,
        wumpusDistance: path.length
      };
    }
    case 'time_freeze': {
      state.timeFrozen = 5;
      return {
        ok: true,
        narrator: "Time Freeze activated. The cave holds its breath. For five moves, nothing will shift, collapse, or hunt."
      };
    }
    case 'decoy_arrow': {
      const decoyRoom = rnd(state.cave[state.player]);
      state.decoyActive = decoyRoom;
      state.wumpusAnger = 0;
      return {
        ok: true,
        narrator: `You fire the Decoy Arrow. It screams as it flies. The Wumpus hears it and turns.`,
        decoyRoom
      };
    }
    case 'sanity_restore': {
      const restored = Math.min(100 - state.sanity, 40);
      state.sanity = Math.min(100, state.sanity + 40);
      return {
        ok: true,
        narrator: `You drink the vial. Clarity floods back — a ${Math.round(restored)}% restoration. The hallucinations recede. For now.`
      };
    }
    default:
      return { ok: false, message: "Unknown power-up." };
  }
}

function buildHazardReveal(state, rooms) {
  const result = {};
  for (const r of rooms) {
    const hazards = [];
    if (state.pits.has(r)) hazards.push('pit');
    if (state.bats.has(r)) hazards.push('bat');
    if (r === state.wumpus) hazards.push('wumpus');
    if (state.powerups[r] && !state.powerups[r].collected) hazards.push(`powerup:${state.powerups[r].type}`);
    result[r] = hazards;
  }
  return result;
}

// ─── NARRATOR ────────────────────────────────────────────────
function buildNarrator(state, clues, room) {
  const hasWumpusClue = clues.some(c => c.type === 'wumpus');
  const hasPitClue = clues.some(c => c.type === 'pit');
  const hasBatClue = clues.some(c => c.type === 'bat');
  const sanity = state.sanity;

  if (sanity <= 0) return NARRATOR_SANITY_DEATH;
  if (sanity < 20) return `${rnd(HALLUCINATION_MESSAGES)} Your sanity is almost gone.`;
  if (sanity < 40) {
    return `The torch flickers. Your thoughts aren't your own anymore. ${hasWumpusClue ? "Something enormous is very close." : ""}`;
  }
  if (hasWumpusClue && hasPitClue) return "Every instinct screams. The Wumpus is nearby — and so is the abyss.";
  if (hasWumpusClue) return rnd(CLUES.wumpus);
  if (hasPitClue && hasBatClue) return "Wind from below, wings from above. You are caught between two deaths.";
  if (hasPitClue) return rnd(CLUES.pit);
  if (hasBatClue) return rnd(CLUES.bat);
  if (clues.length === 0) return "Nothing. Silence. Which might mean safety, or might mean you're too far gone to sense danger.";
  return `Room ${room + 1}. ${ROOM_DESCRIPTIONS[state.roomDescs[room] || 0]}`;
}

const NARRATOR_SANITY_DEATH = "You sit down. The dark closes in like a warm blanket. You let it.";

// ─── PUBLIC GAME STATE (safe to send to client) ──────────────
function getClientState(state) {
  // Only reveal what the player should know
  const revealedPits = [...state.revealedRooms].filter(r => state.pits.has(r));
  const revealedBats = [...state.revealedRooms].filter(r => state.bats.has(r));
  const revealedWumpus = state.revealedRooms.has(state.wumpus) ? state.wumpus : null;
  const revealedPowerups = {};
  for (const [r, pu] of Object.entries(state.powerups)) {
    if (state.revealedRooms.has(parseInt(r)) || state.visitedRooms.has(parseInt(r))) {
      revealedPowerups[r] = pu;
    }
  }

  const collectedPowerups = Object.entries(state.powerups)
    .filter(([, pu]) => pu.collected)
    .map(([, pu]) => pu.type);

  return {
    sessionId: state.sessionId,
    currentRoom: state.player,
    neighbors: state.cave[state.player],
    visitedRooms: [...state.visitedRooms],
    revealedRooms: [...state.revealedRooms],
    cave: state.cave,         // full graph (players need to see connections)
    positions: state.positions,
    arrows: state.arrows,
    sanity: Math.round(state.sanity),
    corruption: Math.round(state.corruption),
    turns: state.turns,
    immuneTurns: state.immuneTurns,
    timeFrozen: state.timeFrozen,
    revealedPits,
    revealedBats,
    revealedWumpus,
    revealedPowerups,
    collectedPowerups,
    collapsingRooms: [...state.collapsingRooms],
    stats: state.stats,
    over: state.over,
    won: state.won,
    ending: state.ending,
    narratorMessage: state.narratorMessage,
    roomDescription: ROOM_DESCRIPTIONS[state.roomDescs[state.player] || 0],
    // Derived flags — safe to expose (don't reveal exact wumpus room)
    wumpusAdjacent: state.cave[state.player].includes(state.wumpus),
    wumpusAnger: state.wumpusAnger,
  };
}

module.exports = {
  createGame,
  actionMove,
  actionShoot,
  actionUsePowerup,
  getClientState,
  LORE_FRAGMENTS,
};
