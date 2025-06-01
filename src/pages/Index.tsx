
import React, { useState, useEffect } from 'react';
import { GameEngine } from '../components/game/GameEngine';
import { MainMenu } from '../components/game/MainMenu';
import { GameSetup } from '../components/game/GameSetup';
import { GameProvider } from '../contexts/GameContext';

export type GameState = 'menu' | 'setup' | 'playing';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameConfig, setGameConfig] = useState(null);

  return (
    <GameProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        {gameState === 'menu' && (
          <MainMenu onStartGame={() => setGameState('setup')} />
        )}
        {gameState === 'setup' && (
          <GameSetup 
            onStartGame={(config) => {
              setGameConfig(config);
              setGameState('playing');
            }}
            onBack={() => setGameState('menu')}
          />
        )}
        {gameState === 'playing' && gameConfig && (
          <GameEngine 
            config={gameConfig}
            onBackToMenu={() => setGameState('menu')}
          />
        )}
      </div>
    </GameProvider>
  );
};

export default Index;
