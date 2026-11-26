import * as THREE from 'three';
import { audio } from '../core/Audio.js';
import { VEHICLES_CATALOG } from './CarModel.js';

/**
 * TrafficRacerPhysics: Core movement, camera, and collision handling for Traffic Racer:
 * - Straight highway forward progression (Z axis)
 * - 4-lane lateral steering (X axis, clamped to road bounds)
 * - Authentic Traffic Racer high-angle chase camera looking down highway
 * - Acceleration, braking, guardrail collisions, and camera shake
 */
export class TrafficRacerPhysics {
  constructor(carModel) {
    this.carModel = carModel;

    // Position
    this.x = -2.0; // Start in forward right lane
    this.y = 0;
    this.z = 0;

    // Movement
    this.speed = 0; // KM/H
    this.maxSpeed = 210;
    this.maxSpeedCap = null; // When fuel is 0, capped to 50 KM/H
    this.accelRate = 58;
    this.brakeRate = 120;
    this.dragRate = 16;

    // Steering
    this.steerAngle = 0;
    this.steerSpeed = 3.6;
    this.maxSteer = 0.45;
    this.roadLimit = 7.4; // Road edge guardrail bounds

    // State
    this.lives = 3;
    this.isCrashed = false;
    this.lives = 3;
    this.controlsLocked = false;
    this.shakeIntensity = 0;

    // Scoring & Stats
    this.score = 0;
    this.distance = 0; // meters
    this.closeOvertakes = 0;
    this.highSpeedTime = 0;

    // Camera
    this.camCurrentPos = new THREE.Vector3();
  }

  update(inputs, deltaTime, camera) {
    const dt = Math.min(deltaTime, 0.05);

    if (this.isCrashed) {
      // Post-crash spin / slide to a halt
      this.speed = Math.max(0, this.speed - 90 * dt);
      const speedMS = (this.speed * 1000) / 3600;
      this.z += speedMS * dt;
      this.carModel.mesh.rotation.y += 3.5 * dt;
      this.updateCamera(camera, dt);
      return;
    }

    if (this.controlsLocked) {
      this.updateCamera(camera, dt);
      return;
    }

    // 1. Acceleration & Braking (respects zero-fuel 50 km/h limp mode cap)
    const effectiveMaxSpeed = (this.maxSpeedCap !== null && this.maxSpeedCap !== undefined) ? this.maxSpeedCap : this.maxSpeed;
    const effectiveAccel = (this.maxSpeedCap !== null && this.maxSpeedCap <= 50) ? 24 : this.accelRate;

    if (inputs.throttle) {
      if (this.speed < effectiveMaxSpeed) {
        this.speed = Math.min(effectiveMaxSpeed, this.speed + effectiveAccel * dt);
      } else if (this.speed > effectiveMaxSpeed) {
        this.speed = Math.max(effectiveMaxSpeed, this.speed - this.brakeRate * 0.45 * dt);
      }
    } else if (inputs.brake) {
      this.speed = Math.max(0, this.speed - this.brakeRate * dt);
    } else {
      // Idle coasting drag
      if (this.speed > effectiveMaxSpeed) {
        this.speed = Math.max(effectiveMaxSpeed, this.speed - this.dragRate * 2.5 * dt);
      } else if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.dragRate * dt);
      }
    }

    // 2. Lateral Steering across lanes (A / Left moves screen-left, D / Right moves screen-right)
    if (inputs.steerLeft) {
      this.steerAngle = Math.min(this.maxSteer, this.steerAngle + this.steerSpeed * dt);
    } else if (inputs.steerRight) {
      this.steerAngle = Math.max(-this.maxSteer, this.steerAngle - this.steerSpeed * dt);
    } else {
      this.steerAngle *= Math.pow(0.001, dt);
    }

    // Move forward
    const speedMS = (this.speed * 1000) / 3600;
    this.z += speedMS * dt;
    this.distance += speedMS * dt;

    // Move laterally (proportional to forward speed)
    // Left input (steerAngle > 0) increases X (moves to the left on screen)
    // Right input (steerAngle < 0) decreases X (moves to the right on screen)
    const lateralSpeed = Math.min(1.0, this.speed / 40) * 12.0;
    this.x += this.steerAngle * lateralSpeed * dt;

    // Guardrail collision check (left at -7.4m, right at +7.4m)
    if (this.x < -this.roadLimit) {
      this.x = -this.roadLimit;
      this.speed *= 0.85;
      this.shakeCamera(0.25);
      audio.playCrashSound();
    } else if (this.x > this.roadLimit) {
      this.x = this.roadLimit;
      this.speed *= 0.85;
      this.shakeCamera(0.25);
      audio.playCrashSound();
    }

    // 3. Score Accumulation (Traffic Racer formula)
    // Base distance score: 1 point per 10 meters
    this.score += (speedMS * dt) * 0.12;

    // High speed bonus: speeds above 100 km/h grant extra score points!
    if (this.speed > 100) {
      this.highSpeedTime += dt;
      this.score += ((this.speed - 100) / 10) * 0.8 * dt;
    }

    // 4. Update Car Model Visuals & Position
    this.carModel.mesh.position.set(this.x, 0.05, this.z);
    // Steering yaw and lean into turns (matching lateral direction)
    this.carModel.mesh.rotation.y = this.steerAngle * 0.28;
    this.carModel.mesh.rotation.z = this.steerAngle * 0.14;
    this.carModel.updateVisuals(this.speed, this.steerAngle, false, false);

    // 5. Update Camera
    this.updateCamera(camera, dt);
  }

  updateCamera(camera, dt) {
    if (!camera) return;

    // Exact Traffic Racer Camera: Elevated rear chase view looking down highway
    const targetCamX = this.x * 0.42;
    const targetCamY = 6.4;
    const targetCamZ = this.z - 8.8;

    const lerpRate = Math.min(1.0, 14 * dt);
    this.camCurrentPos.x += (targetCamX - this.camCurrentPos.x) * lerpRate;
    this.camCurrentPos.y += (targetCamY - this.camCurrentPos.y) * lerpRate;
    this.camCurrentPos.z += (targetCamZ - this.camCurrentPos.z) * lerpRate;

    // Camera shake handling
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - 2.5 * dt);
    }

    camera.position.set(
      this.camCurrentPos.x + shakeX,
      this.camCurrentPos.y + shakeY,
      this.camCurrentPos.z
    );

    // Look slightly down and ahead down the highway (Traffic Racer pitch)
    camera.lookAt(
      this.x * 0.25,
      0.9,
      this.z + 18.0
    );
  }

  shakeCamera(intensity = 0.35) {
    this.shakeIntensity = intensity;
  }

  triggerCrash() {
    this.isCrashed = true;
    this.shakeCamera(0.7);
    audio.playCrashSound();
  }

  addCloseOvertake(bonusScore = 100) {
    this.closeOvertakes++;
    this.score += bonusScore;
    this.shakeCamera(0.12);
  }

  getBoundingBox() {
    return {
      x: this.x,
      z: this.z,
      halfW: 0.95,
      halfL: 2.1
    };
  }

  reset() {
    this.x = -2.0;
    this.y = 0;
    this.z = 0;
    this.speed = 0;
    this.maxSpeedCap = null;
    this.steerAngle = 0;
    this.isCrashed = false;
    this.lives = 3;
    this.controlsLocked = false;
    this.score = 0;
    this.distance = 0;
    this.closeOvertakes = 0;
    this.highSpeedTime = 0;
    this.shakeIntensity = 0;
    this.camCurrentPos.set(this.x * 0.42, 6.4, this.z - 8.8);

    // Apply performance specs based on active equipped vehicle model from VEHICLES_CATALOG
    const carData = this.carModel?.carData || (this.carModel?.type ? VEHICLES_CATALOG.find(c => c.id === this.carModel.type) : null) || VEHICLES_CATALOG[0];
    this.maxSpeed = carData.speed || 180;

    // Scale acceleration, braking, and steering from carData specs
    const accelSec = parseFloat(carData.accel) || 4.5;
    this.accelRate = Math.max(42, Math.round(250 / accelSec));
    const handlingPct = parseFloat(carData.handling) || 80;
    this.steerSpeed = 2.4 + (handlingPct / 100) * 2.6;
    this.brakeRate = 100 + (this.maxSpeed / 400) * 60;
  }
}
