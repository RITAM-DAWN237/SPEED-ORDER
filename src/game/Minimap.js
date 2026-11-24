/**
 * Minimap.js - High-performance 2D radar/minimap canvas renderer
 */

export class Minimap {
  constructor(canvasId, trackPoints) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.trackPoints = trackPoints || [];
    this.bounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
    this.computeBounds();
  }

  setTrackPoints(points) {
    this.trackPoints = points;
    this.computeBounds();
  }

  computeBounds() {
    if (!this.trackPoints || this.trackPoints.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    this.trackPoints.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    });

    const pad = 40;
    this.bounds = {
      minX: minX - pad,
      maxX: maxX + pad,
      minZ: minZ - pad,
      maxZ: maxZ + pad
    };
  }

  worldToMap(wx, wz) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const rangeX = this.bounds.maxX - this.bounds.minX || 1;
    const rangeZ = this.bounds.maxZ - this.bounds.minZ || 1;

    const mx = ((wx - this.bounds.minX) / rangeX) * (width - 24) + 12;
    const my = ((wz - this.bounds.minZ) / rangeZ) * (height - 24) + 12;
    return { x: mx, y: my };
  }

  draw(playerVehicle, aiVehicles = [], remoteVehicle = null) {
    if (!this.ctx || !this.trackPoints.length) return;
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw track circuit line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < this.trackPoints.length; i++) {
      const pt = this.worldToMap(this.trackPoints[i].x, this.trackPoints[i].z);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.stroke();

    // 2. Draw Start / Finish line indicator
    const startPt = this.worldToMap(this.trackPoints[0].x, this.trackPoints[0].z);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(startPt.x, startPt.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw AI Opponents (Amber dots)
    aiVehicles.forEach(ai => {
      const pos = this.worldToMap(ai.position.x, ai.position.z);
      ctx.fillStyle = '#ff3366';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Draw Remote Multiplayer Opponent (Green dot)
    if (remoteVehicle) {
      const rPos = this.worldToMap(remoteVehicle.position.x, remoteVehicle.position.z);
      ctx.fillStyle = '#06d6a0';
      ctx.beginPath();
      ctx.arc(rPos.x, rPos.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Draw Player Vehicle (Glowing Cyan dot with direction pointer)
    if (playerVehicle) {
      const pPos = this.worldToMap(playerVehicle.position.x, playerVehicle.position.z);

      // Glow circle
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(pPos.x, pPos.y, 7, 0, Math.PI * 2);
      ctx.fill();

      // Center dot
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(pPos.x, pPos.y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Direction needle
      const dirX = Math.sin(playerVehicle.heading);
      const dirZ = Math.cos(playerVehicle.heading);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pPos.x, pPos.y);
      ctx.lineTo(pPos.x + dirX * 9, pPos.y + dirZ * 9);
      ctx.stroke();
    }
  }
}
