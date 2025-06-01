import React from 'react';
import { useGame } from '../../contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Settings, ShoppingCart, Target } from 'lucide-react';

interface GameUIProps {
  onBackToMenu: () => void;
  onRestart: () => void;
  onOpenShop: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({ onBackToMenu, onRestart, onOpenShop }) => {
  const { state, dispatch } = useGame();

  const currentPlayer = state.players[state.currentPlayerIndex];

  const handleAngleChange = (value: number[]) => {
    if (!currentPlayer) return;
    dispatch({
      type: 'UPDATE_PLAYER',
      playerId: currentPlayer.id,
      updates: {
        vehicle: {
          ...currentPlayer.vehicle,
          angle: value[0],
        },
      },
    });
  };

  const handlePowerChange = (value: number[]) => {
    if (!currentPlayer) return;
    dispatch({
      type: 'UPDATE_PLAYER',
      playerId: currentPlayer.id,
      updates: {
        vehicle: {
          ...currentPlayer.vehicle,
          power: value[0],
        },
      },
    });
  };

  const handleWeaponChange = (weapon: string) => {
    if (!currentPlayer) return;
    dispatch({
      type: 'UPDATE_PLAYER',
      playerId: currentPlayer.id,
      updates: {
        vehicle: {
          ...currentPlayer.vehicle,
          selectedWeapon: weapon,
        },
      },
    });
  };

  const handleThemeChange = (theme: string) => {
    dispatch({ type: 'SET_THEME', theme: theme as any });
  };

  const handleFire = () => {
    if (!currentPlayer || state.gamePhase !== 'aiming') return;
    
    const vehicle = currentPlayer.vehicle;
    const selectedWeapon = vehicle.selectedWeapon;
    
    // Check if player has the selected weapon
    if (!vehicle.weapons[selectedWeapon] || vehicle.weapons[selectedWeapon] <= 0) {
      console.log(`No ${selectedWeapon} ammunition available`);
      return;
    }
    
    console.log(`${currentPlayer.name} firing ${selectedWeapon} at angle ${vehicle.angle}° with power ${vehicle.power}%`);
    
    // Consume ammunition
    dispatch({
      type: 'UPDATE_PLAYER',
      playerId: currentPlayer.id,
      updates: {
        vehicle: {
          ...vehicle,
          weapons: {
            ...vehicle.weapons,
            [selectedWeapon]: vehicle.weapons[selectedWeapon] - 1
          }
        }
      }
    });
    
    // Fire the projectile
    if ((window as any).fireProjectile) {
      (window as any).fireProjectile(currentPlayer.id, selectedWeapon);
    }
    
    // Move to next player after a delay to allow projectile to complete
    setTimeout(() => {
      dispatch({ type: 'NEXT_PLAYER' });
    }, 3000);
  };

  const getAvailableWeapons = () => {
    if (!currentPlayer) return [];
    return Object.entries(currentPlayer.vehicle.weapons)
      .filter(([_, count]) => count > 0)
      .map(([weapon, count]) => ({ weapon, count }));
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-orange-400">SCORCHED EARTH</h1>
          <Badge variant="outline" className="text-white border-gray-500">
            Round {state.round}/3
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={state.theme} onValueChange={handleThemeChange}>
            <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="light" className="text-white hover:bg-gray-600">Light</SelectItem>
              <SelectItem value="dark" className="text-white hover:bg-gray-600">Dark</SelectItem>
              <SelectItem value="vaporwave" className="text-white hover:bg-gray-600">Vaporwave</SelectItem>
              <SelectItem value="cyberpunk" className="text-white hover:bg-gray-600">Cyberpunk</SelectItem>
              <SelectItem value="original" className="text-white hover:bg-gray-600">Original</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: 'TOGGLE_TRAJECTORY' })}
            className={`border-gray-600 text-white hover:bg-gray-600 ${state.showTrajectory ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-700'}`}
          >
            <Target className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenShop}
            className="border-gray-600 text-white bg-gray-700 hover:bg-gray-600"
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRestart}
            className="border-gray-600 text-white bg-gray-700 hover:bg-gray-600"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBackToMenu}
            className="border-gray-600 text-white bg-gray-700 hover:bg-gray-600"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Player Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {state.players.map((player, index) => (
          <Card key={player.id} className={`p-3 border ${index === state.currentPlayerIndex ? 'border-orange-500 bg-orange-900/20' : 'border-gray-600 bg-gray-700'}`}>
            <div className="text-sm">
              <div className="flex justify-between items-center mb-1">
                <span style={{ color: player.color }} className="font-bold">
                  {player.name}
                </span>
                <span className="text-gray-400">${player.money}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>HP: {player.vehicle.health}</span>
                <span>Fuel: {player.vehicle.fuel}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Wins: {player.wins}</span>
                <span>{player.isAlive ? '✓' : '✗'}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Control Panel */}
      {currentPlayer && currentPlayer.isHuman && (
        <div className="flex gap-4 items-center">
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Angle: {currentPlayer.vehicle.angle.toFixed(1)}°</span>
              <span>Power: {currentPlayer.vehicle.power}%</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Slider
                  value={[currentPlayer.vehicle.angle]}
                  onValueChange={handleAngleChange}
                  min={-90}
                  max={90}
                  step={1}
                  className="w-full"
                />
              </div>
              <div>
                <Slider
                  value={[currentPlayer.vehicle.power]}
                  onValueChange={handlePowerChange}
                  min={10}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Select 
              value={currentPlayer.vehicle.selectedWeapon} 
              onValueChange={handleWeaponChange}
            >
              <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {getAvailableWeapons().map(({ weapon, count }) => (
                  <SelectItem key={weapon} value={weapon} className="text-white hover:bg-gray-600">
                    {weapon} ({count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleFire}
              className="w-full bg-red-600 hover:bg-red-700 font-bold text-white"
              disabled={state.gamePhase !== 'aiming'}
            >
              FIRE!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
