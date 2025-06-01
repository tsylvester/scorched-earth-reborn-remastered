
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GameConfig } from '../../contexts/GameContext';

interface GameSetupProps {
  onStartGame: (config: GameConfig) => void;
  onBack: () => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onStartGame, onBack }) => {
  const [numPlayers, setNumPlayers] = useState(4);
  const [numHumans, setNumHumans] = useState(1);
  const [terrainComplexity, setTerrainComplexity] = useState(0.5);

  const handleStart = () => {
    onStartGame({
      numPlayers,
      numHumans,
      terrainComplexity,
      roundsToWin: 3,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 p-4">
      <Card className="w-full max-w-md bg-black/80 border-orange-500 text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-orange-400 text-center">Game Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Total Players: {numPlayers}</Label>
            <Slider
              value={[numPlayers]}
              onValueChange={(value) => setNumPlayers(value[0])}
              min={2}
              max={8}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Human Players</Label>
            <Select value={numHumans.toString()} onValueChange={(value) => setNumHumans(parseInt(value))}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: numPlayers }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {i + 1} Human{i > 0 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Terrain Complexity</Label>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Gentle</span>
              <span>Standard</span>
              <span>Complex</span>
            </div>
            <Slider
              value={[terrainComplexity]}
              onValueChange={(value) => setTerrainComplexity(value[0])}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={onBack}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Back
            </Button>
            <Button 
              onClick={handleStart}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold"
            >
              Start Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
