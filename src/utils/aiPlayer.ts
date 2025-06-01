
import { Player, Wind } from '../contexts/GameContext';

export class AIPlayer {
  static calculateBestShot(
    player: Player,
    enemies: Player[],
    terrain: number[],
    wind: Wind,
    canvasHeight: number
  ): { angle: number; power: number; targetId?: string } {
    
    let bestShot = { angle: 0, power: 50 }; // Start with 0 degrees (straight up)
    let bestScore = -1;
    let targetId: string | undefined;

    // Find the closest enemy
    const livingEnemies = enemies.filter(e => e.isAlive && e.id !== player.id);
    if (livingEnemies.length === 0) return bestShot;

    livingEnemies.forEach(enemy => {
      const distance = Math.abs(enemy.vehicle.x - player.vehicle.x);
      const heightDiff = terrain[Math.floor(enemy.vehicle.x)] - terrain[Math.floor(player.vehicle.x)];
      
      // Calculate optimal angle and power for this target
      const optimalAngle = this.calculateOptimalAngle(distance, heightDiff, wind, player.vehicle.x, enemy.vehicle.x);
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
        terrain,
        canvasHeight
      );
      
      const score = hitProbability * enemy.vehicle.health;
      
      if (score > bestScore) {
        bestScore = score;
        bestShot = { angle: optimalAngle, power: optimalPower };
        targetId = enemy.id;
      }
    });

    console.log(`AI ${player.name} calculated best shot: angle ${bestShot.angle}°, power ${bestShot.power}%`);
    return { ...bestShot, targetId };
  }

  private static calculateOptimalAngle(distance: number, heightDiff: number, wind: Wind, startX: number, targetX: number): number {
    // Determine if target is to the left or right
    const targetDirection = targetX > startX ? 1 : -1;
    
    // Base angle calculation for ballistic trajectory
    // Start with 45 degrees in the correct direction
    let baseAngle = 45 * targetDirection;
    
    // Adjust for height difference
    if (heightDiff > 0) {
      // Target is higher, aim more upward
      baseAngle += Math.min(20, heightDiff * 0.1) * Math.sign(baseAngle);
    } else {
      // Target is lower, aim less upward or more downward
      baseAngle -= Math.min(15, Math.abs(heightDiff) * 0.1) * Math.sign(baseAngle);
    }
    
    // Adjust for wind - compensate by aiming into the wind
    if (wind.speed > 0) {
      baseAngle -= wind.speed * 2; // Compensate for right wind
    } else {
      baseAngle += Math.abs(wind.speed) * 2; // Compensate for left wind
    }
    
    // Clamp to valid range (-90 to 90 degrees from vertical)
    return Math.max(-90, Math.min(90, baseAngle));
  }

  private static calculateOptimalPower(distance: number, wind: Wind): number {
    // Base power calculation based on distance
    let basePower = Math.min(95, Math.max(30, distance * 0.12 + 20));
    
    // Adjust for wind resistance - need more power when firing into wind
    if (Math.abs(wind.speed) > 1) {
      basePower += Math.abs(wind.speed) * 5;
    }
    
    // Add some randomness for variety
    basePower += (Math.random() - 0.5) * 15;
    
    return Math.max(20, Math.min(100, basePower));
  }

  private static calculateHitProbability(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    angle: number,
    power: number,
    wind: Wind,
    terrain: number[],
    canvasHeight: number
  ): number {
    // Simulate trajectory to estimate hit probability
    const angleRad = (angle * Math.PI) / 180;
    const maxRange = 750; // 3/4 of 1000px map
    const baseVelocity = Math.sqrt(maxRange * 0.08) * 0.8;
    const scaledVelocity = (power / 100) * baseVelocity;
    let vx = Math.sin(angleRad) * scaledVelocity;
    let vy = -Math.cos(angleRad) * scaledVelocity;
    
    let x = startX;
    let y = canvasHeight - startY - 20; // Start from vehicle position
    let closestDistance = Infinity;
    
    for (let t = 0; t < 300; t++) {
      vy += 0.08; // gravity
      vx += wind.speed * 0.0002; // Much reduced wind effect
      
      x += vx;
      y += vy;
      
      if (x < 0 || x >= terrain.length || y >= canvasHeight) break;
      
      const terrainHeight = canvasHeight - (terrain[Math.floor(x)] || 0);
      if (y >= terrainHeight) {
        // Check distance to target when projectile hits terrain
        const distanceToTarget = Math.abs(x - targetX);
        closestDistance = Math.min(closestDistance, distanceToTarget);
        break;
      }
      
      // Track closest approach to target
      const distanceToTarget = Math.sqrt(
        Math.pow(x - targetX, 2) + 
        Math.pow(y - (canvasHeight - targetY - 10), 2)
      );
      closestDistance = Math.min(closestDistance, distanceToTarget);
    }
    
    // Convert distance to probability (closer = higher probability)
    return Math.max(0, 1 - closestDistance / 60); // 60 pixel tolerance
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
