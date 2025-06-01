
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../../contexts/GameContext';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, dispatch } = useGame();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const getThemeColors = useCallback(() => {
    switch (state.theme) {
      case 'light':
        return {
          background: '#87CEEB',
          terrain: '#8B4513',
          vehicle: '#000000',
          ui: '#FFFFFF',
        };
      case 'dark':
        return {
          background: '#1a1a2e',
          terrain: '#16213e',
          vehicle: '#0f3460',
          ui: '#e94560',
        };
      case 'vaporwave':
        return {
          background: '#ff006e',
          terrain: '#8338ec',
          vehicle: '#3a86ff',
          ui: '#ffbe0b',
        };
      case 'cyberpunk':
        return {
          background: '#0d1117',
          terrain: '#ff2a6d',
          vehicle: '#05d9e8',
          ui: '#01012b',
        };
      case 'original':
        return {
          background: '#4169E1',
          terrain: '#8B4513',
          vehicle: '#FF0000',
          ui: '#FFFF00',
        };
      default:
        return {
          background: '#1a1a2e',
          terrain: '#16213e',
          vehicle: '#0f3460',
          ui: '#e94560',
        };
    }
  }, [state.theme]);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = getThemeColors();
    
    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw terrain
    ctx.fillStyle = colors.terrain;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    
    for (let x = 0; x < state.terrain.length; x++) {
      const y = canvas.height - state.terrain[x];
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Draw vehicles
    state.players.forEach((player) => {
      if (!player.isAlive) return;
      
      const vehicle = player.vehicle;
      const terrainY = state.terrain[Math.floor(vehicle.x)] || 0;
      const vehicleY = canvas.height - terrainY - 20;

      // Vehicle body
      ctx.fillStyle = player.color;
      ctx.fillRect(vehicle.x - 10, vehicleY, 20, 15);
      
      // Vehicle turret
      const turretLength = 25;
      const angleRad = (vehicle.angle * Math.PI) / 180;
      const turretEndX = vehicle.x + Math.cos(angleRad) * turretLength;
      const turretEndY = vehicleY - Math.sin(angleRad) * turretLength;
      
      ctx.strokeStyle = player.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(vehicle.x, vehicleY);
      ctx.lineTo(turretEndX, turretEndY);
      ctx.stroke();

      // Health bar
      const healthWidth = 30;
      const healthHeight = 5;
      const healthPercent = vehicle.health / vehicle.maxHealth;
      
      ctx.fillStyle = 'red';
      ctx.fillRect(vehicle.x - healthWidth/2, vehicleY - 30, healthWidth, healthHeight);
      ctx.fillStyle = 'green';
      ctx.fillRect(vehicle.x - healthWidth/2, vehicleY - 30, healthWidth * healthPercent, healthHeight);

      // Player name
      ctx.fillStyle = colors.ui;
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, vehicle.x, vehicleY - 35);
    });

    // Draw trajectory preview if enabled
    if (state.showTrajectory && state.players[state.currentPlayerIndex]) {
      const currentPlayer = state.players[state.currentPlayerIndex];
      const vehicle = currentPlayer.vehicle;
      
      drawTrajectory(ctx, vehicle.x, canvas.height - state.terrain[Math.floor(vehicle.x)] - 20, 
                    vehicle.angle, vehicle.power, state.wind, colors.ui);
    }

    // Draw wind indicator
    drawWindIndicator(ctx, canvas.width - 100, 50, state.wind, colors.ui);

  }, [state, getThemeColors]);

  const drawTrajectory = (ctx: CanvasRenderingContext2D, startX: number, startY: number, 
                         angle: number, power: number, wind: any, color: string) => {
    ctx.strokeStyle = color;
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();

    const angleRad = (angle * Math.PI) / 180;
    const velocity = power * 2;
    const vx = Math.cos(angleRad) * velocity;
    const vy = -Math.sin(angleRad) * velocity;
    
    let x = startX;
    let y = startY;
    let velX = vx;
    let velY = vy;
    
    ctx.moveTo(x, y);
    
    for (let t = 0; t < 200; t++) {
      velY += 0.5; // gravity
      velX += wind.speed * 0.1; // wind effect
      
      x += velX * 0.1;
      y += velY * 0.1;
      
      if (x < 0 || x >= state.terrain.length || y >= ctx.canvas.height) break;
      
      const terrainHeight = ctx.canvas.height - state.terrain[Math.floor(x)];
      if (y >= terrainHeight) break;
      
      ctx.lineTo(x, y);
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawWindIndicator = (ctx: CanvasRenderingContext2D, x: number, y: number, wind: any, color: string) => {
    ctx.fillStyle = color;
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Wind: ${wind.speed.toFixed(1)}`, x, y);
    
    // Wind arrow
    const arrowLength = Math.abs(wind.speed) * 2;
    const arrowX = wind.speed > 0 ? x - 50 : x - 50 + arrowLength;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 50, y + 10);
    ctx.lineTo(x - 50 + (wind.speed > 0 ? arrowLength : -arrowLength), y + 10);
    ctx.stroke();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.gamePhase !== 'aiming') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.isHuman) return;

    // Calculate angle based on click position
    const vehicle = currentPlayer.vehicle;
    const vehicleScreenX = vehicle.x;
    const terrainY = state.terrain[Math.floor(vehicle.x)] || 0;
    const vehicleScreenY = canvas.height - terrainY - 20;

    const dx = x - vehicleScreenX;
    const dy = vehicleScreenY - y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Clamp angle between -90 and 90 degrees
    const clampedAngle = Math.max(-90, Math.min(90, angle));
    
    // Update vehicle angle
    dispatch({
      type: 'UPDATE_PLAYER',
      playerId: currentPlayer.id,
      updates: {
        vehicle: {
          ...vehicle,
          angle: clampedAngle,
        },
      },
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawGame();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [drawGame]);

  useEffect(() => {
    drawGame();
  }, [drawGame]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      onClick={handleCanvasClick}
    />
  );
};
