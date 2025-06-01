
import { Player, Wind } from '../contexts/GameContext';

export class AIPlayer {
  static calculateBestShot(
    player: Player,
    enemies: Player[],
    terrain: number[],
    wind: Wind,
    canvasHeight: number
  ): { angle: number; power: number; targetId?: string } {
    
    let bestShot = { angle: 45, power: 50 };
    let bestScore = -1;
    let targetId: string | undefined;

    // Find the closest enemy
    const livingEnemies = enemies.filter(e => e.isAlive && e.id !== player.id);
    if (livingEnemies.length === 0) return bestShot;

    livingEnemies.forEach(enemy => {
      const distance = Math.abs(enemy.vehicle.x - player.vehicle.x);
      const heightDiff = terrain[Math.floor(enemy.vehicle.x)] - terrain[Math.floor(player.vehicle.x)];
      
      // Calculate optimal angle and power for this target
      const optimalAngle = this.calculateOptimalAngle(distance, heightDiff, wind);
      const optimalPower = this.calculateOptimalPower(distance, wind);
      
      // Score this shot based on hit probability and damage potential
      const hitProbability = this.calculateHitProbability(
        player.vehicle.x,
        terrain[Math.floor(player.vehicle.x)],
        enemy.vehicle.x,
        terrain[Math.floor(enemy.vehicle.x)],
        optimalAngle,
        optimalPower,
        wind,
        terrain
      );
      
      const score = hitProbability * enemy.vehicle.health;
      
      if (score > bestScore) {
        bestScore = score;
        bestShot = { angle: optimalAngle, power: optimalPower };
        targetId = enemy.id;
      }
    });

    return { ...bestShot, targetId };
  }

  private static calculateOptimalAngle(distance: number, heightDiff: number, wind: Wind): number {
    // Basic trajectory calculation
    let baseAngle = 45;
    
    // Adjust for height difference
    if (heightDiff > 0) {
      baseAngle += Math.min(20, heightDiff * 0.1);
    } else {
      baseAngle -= Math.min(20, Math.abs(heightDiff) * 0.1);
    }
    
    // Adjust for wind
    if (wind.speed > 0) {
      baseAngle -= wind.speed * 0.5;
    } else {
      baseAngle += Math.abs(wind.speed) * 0.5;
    }
    
    return Math.max(-90, Math.min(90, baseAngle));
  }

  private static calculateOptimalPower(distance: number, wind: Wind): number {
    let basePower = Math.min(100, distance * 0.1 + 30);
    
    // Adjust for wind resistance
    if (Math.abs(wind.speed) > 5) {
      basePower += Math.abs(wind.speed) * 2;
    }
    
    return Math.max(10, Math.min(100, basePower));
  }

  private static calculateHitProbability(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    angle: number,
    power: number,
    wind: Wind,
    terrain: number[]
  ): number {
    // Simulate trajectory to estimate hit probability
    const angleRad = (angle * Math.PI) / 180;
    const velocity = power * 2;
    let vx = Math.cos(angleRad) * velocity;
    let vy = -Math.sin(angleRad) * velocity;
    
    let x = startX;
    let y = startY;
    
    for (let t = 0; t < 200; t++) {
      vy += 0.5; // gravity
      vx += wind.speed * 0.1; // wind
      
      x += vx * 0.1;
      y += vy * 0.1;
      
      if (x < 0 || x >= terrain.length) break;
      
      const terrainHeight = terrain[Math.floor(x)];
      if (y >= terrainHeight) {
        // Check if we hit near the target
        const distance = Math.abs(x - targetX);
        return Math.max(0, 1 - distance / 50); // 50 pixel tolerance
      }
    }
    
    return 0;
  }

  static selectWeapon(player: Player, enemies: Player[]): string {
    const availableWeapons = Object.entries(player.vehicle.weapons)
      .filter(([_, count]) => count > 0)
      .map(([weapon, _]) => weapon);

    if (availableWeapons.length === 0) return 'missile';

    // Find closest enemy
    const closestDistance = Math.min(
      ...enemies
        .filter(e => e.isAlive && e.id !== player.id)
        .map(e => Math.abs(e.vehicle.x - player.vehicle.x))
    );

    // Select weapon based on distance and situation
    if (closestDistance < 200 && availableWeapons.includes('cluster')) {
      return 'cluster';
    } else if (closestDistance > 500 && availableWeapons.includes('nuke')) {
      return 'nuke';
    } else if (availableWeapons.includes('heavy')) {
      return 'heavy';
    } else {
      return availableWeapons[0];
    }
  }

  static shouldMove(player: Player, enemies: Player[]): { shouldMove: boolean; direction: number } {
    const livingEnemies = enemies.filter(e => e.isAlive && e.id !== player.id);
    if (livingEnemies.length === 0) return { shouldMove: false, direction: 0 };

    // Check if too close to enemies
    const dangerouslyClose = livingEnemies.some(enemy => 
      Math.abs(enemy.vehicle.x - player.vehicle.x) < 100
    );

    if (dangerouslyClose && player.vehicle.fuel > 20) {
      // Move away from closest enemy
      const closestEnemy = livingEnemies.reduce((closest, enemy) => 
        Math.abs(enemy.vehicle.x - player.vehicle.x) < Math.abs(closest.vehicle.x - player.vehicle.x) 
          ? enemy : closest
      );
      
      const direction = player.vehicle.x < closestEnemy.vehicle.x ? -1 : 1;
      return { shouldMove: true, direction };
    }

    return { shouldMove: false, direction: 0 };
  }
}
