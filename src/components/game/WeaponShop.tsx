
import React from 'react';
import { useGame } from '../../contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface WeaponShopProps {
  onClose: () => void;
}

const WEAPON_DATA = {
  missile: { name: 'Missile', price: 50, damage: 25, blast: 30 },
  heavy: { name: 'Heavy Shell', price: 100, damage: 40, blast: 40 },
  cluster: { name: 'Cluster Bomb', price: 150, damage: 60, blast: 50 },
  nuke: { name: 'Nuclear Missile', price: 500, damage: 100, blast: 80 },
  tracer: { name: 'Tracer', price: 25, damage: 15, blast: 20 },
  funky: { name: 'Funky Bomb', price: 200, damage: 30, blast: 60 },
  death: { name: 'Death Head', price: 300, damage: 80, blast: 35 },
  roller: { name: 'Roller', price: 75, damage: 20, blast: 25 },
};

export const WeaponShop: React.FC<WeaponShopProps> = ({ onClose }) => {
  const { state, dispatch } = useGame();
  
  // Always use the current player from the game state
  const currentPlayer = state.players.find(p => p.isHuman && p.id === state.players[state.currentPlayerIndex]?.id) || 
                       state.players.find(p => p.isHuman); // Fallback to first human player

  const purchaseWeapon = (weapon: string, quantity: number = 1) => {
    if (!currentPlayer) {
      console.log('No human player found to purchase weapons for');
      return;
    }
    
    const weaponData = WEAPON_DATA[weapon as keyof typeof WEAPON_DATA];
    const totalCost = weaponData.price * quantity;
    
    if (currentPlayer.money >= totalCost) {
      console.log(`${currentPlayer.name} purchasing ${quantity} ${weapon}(s) for $${totalCost}`);
      dispatch({
        type: 'PURCHASE_WEAPON',
        playerId: currentPlayer.id,
        weapon,
        quantity,
        cost: totalCost,
      });
    } else {
      console.log(`${currentPlayer.name} doesn't have enough money to purchase ${weapon}. Need $${totalCost}, have $${currentPlayer.money}`);
    }
  };

  if (!currentPlayer) {
    return (
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-96 bg-gray-800 border-orange-500">
          <CardHeader>
            <CardTitle className="text-orange-400">Weapon Shop</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white">No human player found. Shop only available for human players.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-96 max-h-96 overflow-y-auto bg-gray-800 border-orange-500">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-orange-400">Weapon Shop - {currentPlayer.name}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center mb-4">
            <Badge variant="outline" className="text-white">
              Money: ${currentPlayer.money}
            </Badge>
          </div>
          
          {Object.entries(WEAPON_DATA).map(([key, weapon]) => {
            const owned = currentPlayer.vehicle.weapons[key] || 0;
            const canAfford = currentPlayer.money >= weapon.price;
            
            return (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{weapon.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      Owned: {owned}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400">
                    Damage: {weapon.damage} | Blast: {weapon.blast} | ${weapon.price}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => purchaseWeapon(key)}
                  disabled={!canAfford}
                  className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                >
                  Buy
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
