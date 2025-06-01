
import React, { useRef, useEffect, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GameCanvas } from './GameCanvas';
import { GameUI } from './GameUI';
import { WeaponShop } from './WeaponShop';
import { GameConfig } from '../../contexts/GameContext';

interface GameEngineProps {
  config: GameConfig;
  onBackToMenu: () => void;
}

export const GameEngine: React.FC<GameEngineProps> = ({ config, onBackToMenu }) => {
  const { state, dispatch } = useGame();
  const [showShop, setShowShop] = useState(false);

  useEffect(() => {
    if (!state.config) {
      dispatch({ type: 'INITIALIZE_GAME', config });
    }
  }, [config, state.config, dispatch]);

  const handleRestart = () => {
    dispatch({ type: 'RESTART_GAME' });
  };

  if (!state.config) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <GameUI 
        onBackToMenu={onBackToMenu}
        onRestart={handleRestart}
        onOpenShop={() => setShowShop(true)}
      />
      
      <div className="flex-1 relative">
        <GameCanvas />
        
        {showShop && (
          <WeaponShop onClose={() => setShowShop(false)} />
        )}
      </div>
    </div>
  );
};
