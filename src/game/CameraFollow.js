/**
 * CameraFollow.js - Smooth Third-Person Follow Camera
 * Features smooth position damping, lookahead targeting, dynamic speed FOV,
 * multiple view modes, and collision shake impulses
 */

import * as THREE from 'three';

export class CameraFollow {
  constructor(camera) {
    this.camera = camera;
    this.target = null;
    this.mode = 'close'; // 'close', 'far', 'hood'

    // Offsets per mode
    this.offsets = {
      close: { height: 2.8, distance: 6.8, lookAhead: 12.0, lookUp: 1.4, fovBase: 65 },
      far:   { height: 4.8, distance: 9.8, lookAhead: 15.0, lookUp: 1.6, fovBase: 60 },
      hood:  { height: 1.1, distance: 0.2, lookAhead: 20.0, lookUp: 1.0, fovBase: 75 }
    };

    this.currentPos = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();
    this.shakeIntensity = 0;
    this.shakeDecay = 4.0;
  }

  setTarget(vehicleMesh) {
    this.target = vehicleMesh;
    if (this.target) {
      // Snap camera directly behind on initialize
      this.snapToTarget();
    }
  }

  setMode(mode) {
    if (this.offsets[mode]) {
      this.mode = mode;
    }
  }

  cycleMode() {
    const modes = ['close', 'far', 'hood'];
    const nextIdx = (modes.indexOf(this.mode) + 1) % modes.length;
    this.setMode(modes[nextIdx]);
    return this.mode;
  }

  snapToTarget() {
    if (!this.target) return;
    const cfg = this.offsets[this.mode];
    const heading = this.target.rotation.y;
    const targetPos = this.target.position;

    const backX = targetPos.x - Math.sin(heading) * cfg.distance;
    const backZ = targetPos.z - Math.cos(heading) * cfg.distance;

    this.currentPos.set(backX, targetPos.y + cfg.height, backZ);
    this.currentLookAt.set(
      targetPos.x + Math.sin(heading) * cfg.lookAhead,
      targetPos.y + cfg.lookUp,
      targetPos.z + Math.cos(heading) * cfg.lookAhead
    );

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
  }

  addShake(amount = 0.5) {
    this.shakeIntensity = Math.min(1.2, this.shakeIntensity + amount);
  }

  update(dt, vehicleSpeed = 0, isNitro = false) {
    if (!this.target) return;

    const cfg = this.offsets[this.mode];
    const heading = this.target.rotation.y;
    const targetPos = this.target.position;

    // Dynamic distance pull back & FOV with speed
    const speedRatio = Math.min(1.2, Math.max(0, vehicleSpeed / 240));
    const dynamicDistance = cfg.distance * (1 + speedRatio * 0.18 + (isNitro ? 0.12 : 0));

    // Target camera position
    const idealX = targetPos.x - Math.sin(heading) * dynamicDistance;
    const idealZ = targetPos.z - Math.cos(heading) * dynamicDistance;
    const idealY = targetPos.y + cfg.height + (isNitro ? 0.1 : 0);

    const idealLookX = targetPos.x + Math.sin(heading) * cfg.lookAhead;
    const idealLookZ = targetPos.z + Math.cos(heading) * cfg.lookAhead;
    const idealLookY = targetPos.y + cfg.lookUp;

    // Damping / smooth interpolation
    const posLerpFactor = Math.min(1, 10.0 * dt);
    const lookLerpFactor = Math.min(1, 14.0 * dt);

    this.currentPos.x += (idealX - this.currentPos.x) * posLerpFactor;
    this.currentPos.y += (idealY - this.currentPos.y) * posLerpFactor;
    this.currentPos.z += (idealZ - this.currentPos.z) * posLerpFactor;

    this.currentLookAt.x += (idealLookX - this.currentLookAt.x) * lookLerpFactor;
    this.currentLookAt.y += (idealLookY - this.currentLookAt.y) * lookLerpFactor;
    this.currentLookAt.z += (idealLookZ - this.currentLookAt.z) * lookLerpFactor;

    // Apply screen shake
    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (this.shakeIntensity > 0.01) {
      shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 0.4;
      shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 0.4;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    }

    this.camera.position.set(
      this.currentPos.x + shakeOffsetX,
      this.currentPos.y + shakeOffsetY,
      this.currentPos.z
    );

    this.camera.lookAt(
      this.currentLookAt.x + shakeOffsetX,
      this.currentLookAt.y + shakeOffsetY,
      this.currentLookAt.z
    );

    // Dynamic FOV widening for speed sensation
    const targetFOV = cfg.fovBase + speedRatio * 16 + (isNitro ? 10 : 0);
    this.camera.fov += (targetFOV - this.camera.fov) * Math.min(1, 6.0 * dt);
    this.camera.updateProjectionMatrix();
  }
}
