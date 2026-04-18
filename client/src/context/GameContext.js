import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';

const GameContext = createContext(null);

const POWERUP_INFO = {
  echo_scan: { icon: '◎', label: 'Echo Scan', desc: 'Reveals all hazards within 2 rooms', color: '#22d3ee' },
  thermal_vision: { icon: '◉', label: 'Thermal Vision', desc: 'Pinpoints exact Wumpus location', color: '#f97316' },
  time_freeze: { icon: '⏸', label: 'Time Freeze', desc: 'Stops cave changes for 5 turns', color: '#a78bfa' },
  decoy_arrow: { icon: '↗', label: 'Decoy Arrow', desc: 'Distracts Wumpus for 3 turns', color: '#fbbf24' },
  sanity_restore: { icon: '✦', label: 'Sanity Tonic', desc: 'Restores 40% sanity', color: '#34d399' },
};

const ENDING_INFO = {
  wumpus_killed: {
    title: 'THE WUMPUS IS DEAD',
    subtitle: 'Hunter\'s Ending',
    color: '#22c55e',
    description: 'You descended into the dark and came back victorious. Few do. Remember that.'
  },
  escaped: {
    title: 'ESCAPED',
    subtitle: 'Survivor\'s Ending',
    color: '#60a5fa',
    description: 'You chose survival over glory. The Wumpus lives. So do you. That might be enough.'
  },
  became_wumpus: {
    title: 'YOU ARE THE WUMPUS NOW',
    subtitle: 'Corruption Ending',
    color: '#c026d3',
    description: 'The cave changed you. You stopped trying to leave. This is home now. You are something new.'
  },
  trapped: {
    title: 'TRAPPED FOREVER',
    subtitle: 'Forgotten Ending',
    color: '#71717a',
    description: 'No one will find you. No one will look. The cave keeps what it takes.'
  },
  fell_pit: {
    title: 'CONSUMED BY THE VOID',
    subtitle: 'Pit Ending',
    color: '#3b82f6',
    description: 'The floor was never solid. Nothing down here is. You fall still.'
  },
  eaten: {
    title: 'DEVOURED',
    subtitle: 'Wumpus Ending',
    color: '#dc2626',
    description: 'It was always going to end this way. The Wumpus doesn\'t hate you. It was simply hungry.'
  },
  sanity_lost: {
    title: 'LOST TO THE DARK',
    subtitle: 'Sanity Ending',
    color: '#7c3aed',
    description: 'Your mind found the exit before your body did. You are still down there.'
  },
};

const initialState = {
  phase: 'menu', // menu | auth | playing | game_over | leaderboard
  gameState: null,
  sessionId: null,
  narrator: null,
  roomDescription: null,
  clues: [],
  events: [],
  log: [],        // array of { text, type, timestamp }
  hallucination: null,
  hallucinationVisible: false,
  loreFound: [],  // accumulated lore texts
  ending: null,
  finalScore: null,
  shootMode: false,
  selectedPowerup: null,
  uiDistorted: false, // sanity-based UI distortion
  wumpusNear: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'GAME_STATE_UPDATE': {
      const { gameState, narrator, roomDescription, clues, events, hallucination, over, ending } = action;
      const newLog = [...state.log];

      // Add narrator to log
      if (narrator && narrator !== state.narrator) {
        newLog.unshift({ text: narrator, type: 'narrator', timestamp: Date.now() });
      }

      // Add clue lines
      if (clues) {
        for (const c of clues) {
          const type = c.type.startsWith('fake') ? 'fake' : c.type;
          newLog.unshift({ text: c.message, type, timestamp: Date.now() });
        }
      }

      // Add event lines
      if (events) {
        for (const e of events) {
          if (e.message) newLog.unshift({ text: e.message, type: e.type, timestamp: Date.now() });
        }
      }

      // Lore events
      const newLore = [...state.loreFound];
      if (events) {
        for (const e of events) {
          if (e.type === 'lore_found') newLore.push(e.text);
        }
      }

      // Determine wumpus proximity — use server-provided flag
      const wumpusNear = gameState?.wumpusAdjacent === true;

      // Sanity distortion
      const uiDistorted = gameState ? gameState.sanity < 30 : false;

      return {
        ...state,
        gameState,
        sessionId: gameState?.sessionId || state.sessionId,
        narrator,
        roomDescription,
        clues: clues || [],
        events: events || [],
        hallucination,
        hallucinationVisible: !!hallucination,
        log: newLog.slice(0, 50),
        loreFound: newLore,
        ending: ending || (over ? gameState?.ending : null),
        phase: (over && ending) ? 'game_over' : state.phase,
        wumpusNear: !!wumpusNear,
        uiDistorted,
        error: null,
      };
    }

    case 'DISMISS_HALLUCINATION':
      return { ...state, hallucinationVisible: false };

    case 'TOGGLE_SHOOT_MODE':
      return { ...state, shootMode: !state.shootMode, selectedPowerup: null };

    case 'SELECT_POWERUP':
      return { ...state, selectedPowerup: action.powerup, shootMode: false };

    case 'CLEAR_POWERUP':
      return { ...state, selectedPowerup: null };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'RESET':
      return { ...initialState, phase: 'menu' };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const sendRef = useRef(null);

  const setSend = useCallback((fn) => { sendRef.current = fn; }, []);

  const sendToServer = useCallback((type, payload) => {
    if (sendRef.current) sendRef.current(type, payload);
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch, sendToServer, setSend, POWERUP_INFO, ENDING_INFO }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
export { POWERUP_INFO, ENDING_INFO };
