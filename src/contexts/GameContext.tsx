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
  | { type: 'DAMAGE_PLAYERS'; damages: { playerId: string; damage: number }[] }
  | { type: 'DESTROY_TERRAIN'; x: number; y: number; radius: number }
  | { type: 'SET_GAME_PHASE'; phase: GameState['gamePhase'] }
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
    case 'SET_GAME_PHASE':
      return { ...state, gamePhase: action.phase };
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
    case 'DAMAGE_PLAYERS':
      return {
        ...state,
        players: state.players.map(player => {
          const damage = action.damages.find(d => d.playerId === player.id);
          if (damage) {
            const newHealth = Math.max(0, player.vehicle.health - damage.damage);
            return {
              ...player,
              vehicle: { ...player.vehicle, health: newHealth },
              isAlive: newHealth > 0
            };
          }
          return player;
        })
      };
    case 'DESTROY_TERRAIN':
      const newTerrain = [...state.terrain];
      const radius = action.radius;
      for (let x = Math.max(0, action.x - radius); x < Math.min(newTerrain.length, action.x + radius); x++) {
        const distance = Math.abs(x - action.x);
        if (distance <= radius) {
          const explosionDepth = Math.sqrt(radius * radius - distance * distance);
          newTerrain[x] = Math.max(0, newTerrain[x] - explosionDepth * 2);
        }
      }
      return { ...state, terrain: newTerrain };
    case 'NEXT_PLAYER':
      const alivePlayers = state.players.filter(p => p.isAlive);
      if (alivePlayers.length <= 1) {
        return { ...state, gamePhase: 'roundEnd' };
      }
      
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
    // Spread vehicles evenly across the full map width (1000px)
    const spacing = 900 / (config.numPlayers - 1); // Leave 50px margin on each side
    const baseX = 50 + (i * spacing);
    
    players.push({
      id: `player-${i}-${Date.now()}-${Math.random()}`,
      name: i < config.numHumans ? `Player ${i + 1}` : `CPU ${names[i]}`,
      isHuman: i < config.numHumans,
      money: 1000,
      color: colors[i],
      wins: 0,
      isAlive: true,
      vehicle: {
        x: baseX,
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
  const amplitude = 50 + (complexity * 150); // Scale amplitude with complexity
  
  // Create multiple noise layers for realistic terrain
  const seed1 = Math.random() * 1000;
  const seed2 = Math.random() * 1000;
  const seed3 = Math.random() * 1000;
  
  for (let x = 0; x < width; x++) {
    // Primary wave - large features
    const wave1 = Math.sin((x + seed1) * 0.008) * amplitude * 0.6;
    // Secondary wave - medium features  
    const wave2 = Math.sin((x + seed2) * 0.02) * amplitude * 0.3;
    // Tertiary wave - small details
    const wave3 = Math.sin((x + seed3) * 0.05) * amplitude * 0.1 * complexity;
    // Random noise for variation
    const noise = (Math.random() - 0.5) * 20 * complexity;
    
    terrain[x] = Math.max(50, baseHeight + wave1 + wave2 + wave3 + noise);
  }
  
  // Smooth the terrain to avoid jagged edges
  for (let pass = 0; pass < 2; pass++) {
    for (let x = 1; x < width - 1; x++) {
      terrain[x] = (terrain[x - 1] + terrain[x] + terrain[x + 1]) / 3;
    }
  }
  
  return terrain;
}

function generateWind(): Wind {
  return {
    speed: (Math.random() - 0.5) * 8, // Reduced from 20 to 8
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
