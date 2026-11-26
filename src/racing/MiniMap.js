import { circuitSpline } from './TrackSpline.js';

/**
 * MiniMap: Grand Prix Circuit Radar
 * Renders the closed circuit spline with the 3D overpass/underpass crossover,
 * Start / Finish line gantry, live player position & heading, and 7 Police Interceptors.
 */
export class MiniMap {
  constructor(canvasId = 'hud-minimap-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.width = this.canvas.width = 160;
      this.height = this.canvas.height = 160;
    }

    this.cx = 80;
    this.cy = 80;
    this.scale = 0.38;

    // Pre-sample 140 points from the updated mathematical circuit curve
    this.sampledPoints = circuitSpline.curve.getPoints(140).map(pt => ({
      x: this.cx + pt.x * this.scale,
      y: this.cy - pt.z * this.scale,
      elevation: pt.y
    }));

    // Finish line coordinates (at bottom straight, z = -140, x = 20)
    this.finishLinePos = {
      x: this.cx + 20 * this.scale,
      y: this.cy - (-140) * this.scale
    };
  }

  worldToRadar(worldX, worldZ) {
    return {
      x: this.cx + worldX * this.scale,
      y: this.cy - worldZ * this.scale
    };
  }

  update(playerPos, playerHeading, cops = [], trackLength = 1200) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Radar Glass Background
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, w / 2 - 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8, 14, 26, 0.90)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.stroke();

    // Crosshairs
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.cx, 6);
    ctx.lineTo(this.cx, h - 6);
    ctx.moveTo(6, this.cy);
    ctx.lineTo(w - 6, this.cy);
    ctx.stroke();

    // 2. Draw Circuit Track Ribbon
    if (this.sampledPoints.length > 0) {
      // Outer track border
      ctx.beginPath();
      ctx.moveTo(this.sampledPoints[0].x, this.sampledPoints[0].y);
      for (let i = 1; i < this.sampledPoints.length; i++) {
        ctx.lineTo(this.sampledPoints[i].x, this.sampledPoints[i].y);
      }
      ctx.closePath();
      ctx.lineWidth = 11;
      ctx.strokeStyle = 'rgba(38, 48, 68, 0.92)';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Inner asphalt racing line
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.stroke();

      // Highlight Overpass Bridge section (points where elevation > 2m)
      ctx.beginPath();
      let bridgeDrawing = false;
      for (let i = 0; i < this.sampledPoints.length; i++) {
        const pt = this.sampledPoints[i];
        if (pt.elevation > 2.0) {
          if (!bridgeDrawing) {
            ctx.moveTo(pt.x, pt.y);
            bridgeDrawing = true;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        } else if (bridgeDrawing) {
          bridgeDrawing = false;
        }
      }
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(255, 214, 10, 0.85)'; // Yellow bridge highlight
      ctx.stroke();
    }

    // 3. Start / Finish Line Marker
    const fin = this.finishLinePos;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(fin.x - 2, fin.y - 6, 4, 12);
    ctx.strokeStyle = '#ffd60a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(fin.x - 2, fin.y - 6, 4, 12);
    ctx.restore();

    // 4. 7 Police Cruisers (COP 1 to COP 7)
    cops.forEach((cop, idx) => {
      const pos = cop.pos || cop.model?.mesh?.position;
      if (!pos) return;
      const { x, y } = this.worldToRadar(pos.x, pos.z);

      // Red flashing blip with glow
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Cop number (1 to 7)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${idx + 1}`, x, y);
    });

    // 5. Player Marker (Bright Cyan Arrow with Heading)
    if (playerPos) {
      const { x, y } = this.worldToRadar(playerPos.x, playerPos.z);
      ctx.save();
      ctx.translate(x, y);

      const radarAngle = -playerHeading + Math.PI;
      ctx.rotate(radarAngle);

      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(4.5, 5);
      ctx.lineTo(0, 2);
      ctx.lineTo(-4.5, 5);
      ctx.closePath();
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    ctx.restore();
  }
}
