
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'vaporwave' | 'cyberpunk' | 'original';

export type Player = {
  id: string;
  name: string;
  isHuman: boolean;
  money: number;
  vehicle: Vehicle;
  color: string;
  wins: number;
  isAlive: boolean;
};

export type Vehicle = {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  fuel: number;
  maxFuel: number;
  angle: number;
  power: number;
  weapons: WeaponInventory;
  selectedWeapon: string;
};

export type WeaponInventory = {
  [key: string]: number;
};

export type GameConfig = {
  numPlayers: number;
  numHumans: number;
  terrainComplexity: number;
  roundsToWin: number;
};

export type Wind = {
  speed: number;
  direction: number;
};

export type GameState = {
  players: Player[];
  currentPlayerIndex: number;
  round: number;
  terrain: number[];
  wind: Wind;
  theme: Theme;
  showTrajectory: boolean;
  gamePhase: 'setup' | 'aiming' | 'firing' | 'moving' | 'shopping' | 'roundEnd' | 'gameEnd';
  config: GameConfig | null;
};

type GameAction = 
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'TOGGLE_TRAJECTORY' }
  | { type: 'INITIALIZE_GAME'; config: GameConfig }
  | { type: 'NEXT_PLAYER' }
  | { type: 'UPDATE_PLAYER'; playerId: string; updates: Partial<Player> }
  | { type: 'MOVE_VEHICLE'; playerId: string; newX: number; fuelUsed: number }
  | { type: 'FIRE_WEAPON'; playerId: string; targetX: number; targetY: number }
  | { type: 'DAMAGE_TERRAIN'; points: { x: number; y: number; radius: number }[] }
  | { type: 'PURCHASE_WEAPON'; playerId: string; weapon: string; quantity: number; cost: number }
  | { type: 'NEXT_ROUND' }
  | { type: 'RESTART_GAME' };

const initialState: GameState = {
  players: [],
  currentPlayerIndex: 0,
  round: 1,
  terrain: [],
  wind: { speed: 0, direction: 0 },
  theme: 'dark',
  showTrajectory: false,
  gamePhase: 'setup',
  config: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'TOGGLE_TRAJECTORY':
      return { ...state, showTrajectory: !state.showTrajectory };
    case 'INITIALIZE_GAME':
      return {
        ...state,
        config: action.config,
        gamePhase: 'aiming',
        players: generatePlayers(action.config),
        terrain: generateTerrain(action.config.terrainComplexity),
        wind: generateWind(),
      };
    case 'UPDATE_PLAYER':
      return {
        ...state,
        players: state.players.map(player =>
          player.id === action.playerId
            ? { ...player, ...action.updates }
            : player
        ),
      };
    case 'PURCHASE_WEAPON':
      return {
        ...state,
        players: state.players.map(player => {
          if (player.id === action.playerId && player.money >= action.cost) {
            return {
              ...player,
              money: player.money - action.cost,
              vehicle: {
                ...player.vehicle,
                weapons: {
                  ...player.vehicle.weapons,
                  [action.weapon]: (player.vehicle.weapons[action.weapon] || 0) + action.quantity
                }
              }
            };
          }
          return player;
        })
      };
    case 'NEXT_PLAYER':
      const alivePlayers = state.players.filter(p => p.isAlive);
      const currentAliveIndex = alivePlayers.findIndex(p => p.id === state.players[state.currentPlayerIndex]?.id);
      const nextAliveIndex = (currentAliveIndex + 1) % alivePlayers.length;
      const nextPlayerIndex = state.players.findIndex(p => p.id === alivePlayers[nextAliveIndex]?.id);
      return { 
        ...state, 
        currentPlayerIndex: nextPlayerIndex,
        gamePhase: 'aiming'
      };
    case 'RESTART_GAME':
      if (!state.config) return state;
      return {
        ...state,
        players: generatePlayers(state.config),
        terrain: generateTerrain(state.config.terrainComplexity),
        wind: generateWind(),
        currentPlayerIndex: 0,
        round: 1,
        gamePhase: 'aiming',
      };
    default:
      return state;
  }
}

function generatePlayers(config: GameConfig): Player[] {
  const players: Player[] = [];
  const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff', '#ff8844', '#8844ff'];
  const names = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];
  
  for (let i = 0; i < config.numPlayers; i++) {
    players.push({
      id: `player-${i}-${Date.now()}`, // Add timestamp for uniqueness
      name: i < config.numHumans ? `Player ${i + 1}` : `CPU ${names[i]}`,
      isHuman: i < config.numHumans,
      money: 1000,
      color: colors[i],
      wins: 0,
      isAlive: true,
      vehicle: {
        x: 100 + (i * 700 / config.numPlayers) + Math.random() * 50, // Add some randomness
        y: 0,
        health: 100,
        maxHealth: 100,
        fuel: 100,
        maxFuel: 100,
        angle: 45,
        power: 50,
        weapons: {
          'missile': 10,
          'heavy': 5,
          'nuke': 1,
          'cluster': 3,
        },
        selectedWeapon: 'missile',
      },
    });
  }
  
  return players;
}

function generateTerrain(complexity: number): number[] {
  const width = 1000;
  const terrain: number[] = [];
  const baseHeight = 300;
  const amplitude = 100 + (complexity * 200);
  
  // Add randomness to terrain generation
  const randomSeed = Math.random() * 100;
  
  for (let x = 0; x < width; x++) {
    const noise1 = Math.sin((x + randomSeed) * 0.01) * amplitude * 0.5;
    const noise2 = Math.sin((x + randomSeed) * 0.03) * amplitude * 0.3;
    const noise3 = Math.sin((x + randomSeed) * 0.1) * amplitude * 0.2 * complexity;
    terrain[x] = baseHeight + noise1 + noise2 + noise3;
  }
  
  return terrain;
}

function generateWind(): Wind {
  return {
    speed: (Math.random() - 0.5) * 20,
    direction: Math.random() * 360,
  };
}

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
