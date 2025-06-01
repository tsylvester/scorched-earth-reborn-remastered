
export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  weapon: string;
  playerId: string;
  active: boolean;
}

export interface Explosion {
  x: number;
  y: number;
  radius: number;
  damage: number;
  frames: number;
}

export class GamePhysics {
  static GRAVITY = 0.5;
  static WIND_FACTOR = 0.1;

  static createProjectile(
    startX: number,
    startY: number,
    angle: number,
    power: number,
    weapon: string,
    playerId: string
  ): Projectile {
    const angleRad = (angle * Math.PI) / 180;
    const velocity = power * 2;
    
    return {
      x: startX,
      y: startY,
      vx: Math.cos(angleRad) * velocity,
      vy: -Math.sin(angleRad) * velocity,
      weapon,
      playerId,
      active: true,
    };
  }

  static updateProjectile(projectile: Projectile, wind: { speed: number }): Projectile {
    return {
      ...projectile,
      x: projectile.x + projectile.vx * 0.1,
      y: projectile.y + projectile.vy * 0.1,
      vx: projectile.vx + wind.speed * this.WIND_FACTOR,
      vy: projectile.vy + this.GRAVITY,
    };
  }

  static checkTerrainCollision(
    projectile: Projectile,
    terrain: number[],
    canvasHeight: number
  ): boolean {
    if (projectile.x < 0 || projectile.x >= terrain.length) return true;
    
    const terrainHeight = canvasHeight - terrain[Math.floor(projectile.x)];
    return projectile.y >= terrainHeight;
  }

  static createExplosion(x: number, y: number, weapon: string): Explosion {
    const weaponData = {
      missile: { radius: 30, damage: 25 },
      heavy: { radius: 40, damage: 40 },
      cluster: { radius: 50, damage: 60 },
      nuke: { radius: 80, damage: 100 },
      tracer: { radius: 20, damage: 15 },
      funky: { radius: 60, damage: 30 },
      death: { radius: 35, damage: 80 },
      roller: { radius: 25, damage: 20 },
    };

    const data = weaponData[weapon as keyof typeof weaponData] || weaponData.missile;
    
    return {
      x,
      y,
      radius: data.radius,
      damage: data.damage,
      frames: 30,
    };
  }

  static damageVehiclesInRadius(
    explosion: Explosion,
    vehicles: Array<{ x: number; y: number; health: number }>
  ): Array<{ index: number; damage: number }> {
    const damages: Array<{ index: number; damage: number }> = [];
    
    vehicles.forEach((vehicle, index) => {
      const distance = Math.sqrt(
        Math.pow(vehicle.x - explosion.x, 2) + 
        Math.pow(vehicle.y - explosion.y, 2)
      );
      
      if (distance <= explosion.radius) {
        const damagePercent = 1 - (distance / explosion.radius);
        const damage = Math.floor(explosion.damage * damagePercent);
        damages.push({ index, damage });
      }
    });
    
    return damages;
  }

  static destroyTerrain(
    terrain: number[],
    explosion: Explosion,
    canvasHeight: number
  ): number[] {
    const newTerrain = [...terrain];
    const radius = explosion.radius;
    
    for (let x = Math.max(0, explosion.x - radius); 
         x < Math.min(terrain.length, explosion.x + radius); 
         x++) {
      const distance = Math.abs(x - explosion.x);
      if (distance <= radius) {
        const explosionDepth = Math.sqrt(radius * radius - distance * distance);
        const terrainY = canvasHeight - newTerrain[x];
        
        if (terrainY >= explosion.y - explosionDepth && terrainY <= explosion.y + explosionDepth) {
          const damage = explosionDepth * 2;
          newTerrain[x] = Math.max(0, newTerrain[x] - damage);
        }
      }
    }
    
    return newTerrain;
  }

  static calculateFuelCost(startX: number, endX: number, terrain: number[]): number {
    const distance = Math.abs(endX - startX);
    let fuelCost = distance * 0.5; // Base fuel cost
    
    // Add extra cost for uphill movement
    if (terrain[Math.floor(endX)] > terrain[Math.floor(startX)]) {
      const heightDiff = terrain[Math.floor(endX)] - terrain[Math.floor(startX)];
      fuelCost += heightDiff * 0.1;
    }
    
    return Math.ceil(fuelCost);
  }
}
