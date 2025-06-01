
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MainMenuProps {
  onStartGame: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900">
      <Card className="w-96 bg-black/80 border-orange-500 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-orange-400 mb-2">
            SCORCHED EARTH
          </CardTitle>
          <p className="text-gray-300">The Mother of All Games</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={onStartGame}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3"
          >
            Start New Game
          </Button>
          <div className="text-center text-gray-400 text-sm">
            <p>Artillery Combat Game</p>
            <p>Supports 1-8 Players</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
