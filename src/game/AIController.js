/**
 * AIController.js - Waypoint Navigation, Corner Anticipation,
 * Overtaking, Collision Avoidance, and 4 Difficulty Levels
 */

import * as THREE from 'three';
import { Vehicle } from './Vehicle.js';
import { CARS } from './CarCatalog.js';

export const AI_NAMES = [
  'Marcus Vance',
  'Elena Rostov',
  'Kenji Sato',
  'Sarah Jenkins',
  'Tariq Al-Mansoor'
];

export const AI_CAR_IDS = [
  'apex_turbo',
  'viper_gtr',
  'monza_v12',
  'thunderbolt_s',
  'phantom_rs'
];

export class AIController {
  constructor(scene, trackMesh, difficulty = 'medium', opponentCount = 5) {
    this.scene = scene;
    this.trackMesh = trackMesh;
    this.difficulty = difficulty.toLowerCase();
    this.opponentCount = Math.min(5, Math.max(1, opponentCount));
    this.opponents = [];

    this.initOpponents();
  }

  initOpponents() {
    const diffConfigs = {
      easy: {
        speedScale: 0.72,
        reactionRate: 6.0,
        lookaheadBase: 18.0,
        cornerBrakeFactor: 1.35,
        nitroAllowed: false,
        mistakeChance: 0.15
      },
      medium: {
        speedScale: 0.86,
        reactionRate: 9.0,
        lookaheadBase: 22.0,
        cornerBrakeFactor: 1.15,
        nitroAllowed: false,
        mistakeChance: 0.05
      },
      hard: {
        speedScale: 0.96,
        reactionRate: 13.0,
        lookaheadBase: 26.0,
        cornerBrakeFactor: 0.95,
        nitroAllowed: true,
        mistakeChance: 0.01
      },
      legend: {
        speedScale: 1.02,
        reactionRate: 18.0,
        lookaheadBase: 30.0,
        cornerBrakeFactor: 0.80,
        nitroAllowed: true,
        mistakeChance: 0.00
      }
    };

    const config = diffConfigs[this.difficulty] || diffConfigs.medium;

    for (let i = 0; i < this.opponentCount; i++) {
      const carId = AI_CAR_IDS[i % AI_CAR_IDS.length];
      const name = AI_NAMES[i % AI_NAMES.length];

      const vehicle = new Vehicle(this.scene, carId, false);

      // Unique personality lateral offset so bots take diverse racing lines
      const lateralOffset = ((i % 2 === 0 ? 1 : -1) * (2.0 + (i * 1.2))) % (this.trackMesh.roadWidth * 0.35);

      this.opponents.push({
        id: `ai_${i}`,
        name,
        vehicle,
        carName: vehicle.carConfig.name,
        config,
        personality: {
          lateralOffset,
          aggression: 0.6 + Math.random() * 0.4,
          lookaheadDist: config.lookaheadBase + (Math.random() - 0.5) * 4.0
        },
        targetProgressU: 0,
        recoveryTimer: 0
      });
    }
  }

  /**
   * Spawn AI vehicles on grid slots behind the player
   */
  spawnOnGrid(playerStartPos, playerHeading) {
    const curve = this.trackMesh.curve;
    const totalLen = this.trackMesh.totalLength;
    const up = new THREE.Vector3(0, 1, 0);

    this.opponents.forEach((ai, idx) => {
      // Grid staggered slots: 2 cars per row, spaced 9m back
      const row = Math.floor(idx / 2) + 1;
      const col = idx % 2 === 0 ? -1 : 1;

      const backDist = row * 9.5;
      const uBack = (1.0 - (backDist / totalLen)) % 1.0;

      const basePos = curve.getPointAt(uBack);
      const tan = curve.getTangentAt(uBack).normalize();
      const norm = new THREE.Vector3().crossVectors(tan, up).normalize();

      const spawnPos = basePos.clone().addScaledVector(norm, col * 3.8);
      const heading = Math.atan2(tan.x, tan.z);

      ai.vehicle.respawn(spawnPos, heading);
      ai.targetProgressU = uBack;
    });
  }

  /**
   * Update all AI opponents for the current frame
   */
  update(dt, playerVehicle, raceStarted) {
    if (!raceStarted) return;

    const curve = this.trackMesh.curve;
    const totalLen = this.trackMesh.totalLength;
    const roadHalfWidth = this.trackMesh.roadWidth * 0.5;
    const allVehicles = [playerVehicle, ...this.opponents.map(o => o.vehicle)];

    this.opponents.forEach((ai) => {
      const v = ai.vehicle;
      if (v.isFinished) {
        v.update(dt, { throttle: 0, brake: 0.4, steer: 0 }, { isOffroad: false });
        return;
      }

      // 1. Find closest point on spline to estimate current progress U
      const carPos = v.position;
      let closestU = ai.targetProgressU;
      let minDistSq = Infinity;

      // Scan local window around previous target U
      for (let step = -5; step <= 15; step++) {
        const testU = (ai.targetProgressU + (step * 0.003) + 1.0) % 1.0;
        const pt = curve.getPointAt(testU);
        const distSq = carPos.distanceToSquared(pt);
        if (distSq < minDistSq) {
          minDistSq = distSq;
          closestU = testU;
        }
      }
      ai.targetProgressU = closestU;

      // 2. Lookahead target waypoint
      const currentSpeed = Math.max(10, v.speed);
      const dynamicLookahead = (ai.personality.lookaheadDist * (currentSpeed / 120)) / totalLen;
      const targetU = (closestU + dynamicLookahead) % 1.0;

      const targetPt = curve.getPointAt(targetU);
      const targetTan = curve.getTangentAt(targetU).normalize();
      const targetNorm = new THREE.Vector3(-targetTan.z, 0, targetTan.x).normalize();

      // Apply personality lateral offset to create varied racing lines
      let idealTarget = targetPt.clone().addScaledVector(targetNorm, ai.personality.lateralOffset);

      // 3. Collision Avoidance & Overtaking
      allVehicles.forEach(other => {
        if (other === v) return;
        const toOther = other.position.clone().sub(v.position);
        const distToOther = toOther.length();

        // If another car is within 14m directly ahead
        if (distToOther < 14) {
          const forward = new THREE.Vector3(Math.sin(v.heading), 0, Math.cos(v.heading));
          const dot = forward.dot(toOther.clone().normalize());

          if (dot > 0.6) {
            // Steer laterally away from the blocking car
            const sideDot = new THREE.Vector3(forward.z, 0, -forward.x).dot(toOther);
            const avoidSide = sideDot >= 0 ? -1 : 1;
            idealTarget.addScaledVector(targetNorm, avoidSide * 4.0);
          }
        }
      });

      // 4. Steer calculation towards target
      const toTarget = idealTarget.clone().sub(v.position);
      const desiredAngle = Math.atan2(toTarget.x, toTarget.z);

      let angleDiff = desiredAngle - v.heading;
      // Normalize angle to [-PI, PI]
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Clamp steer input to [-1, 1]
      const steerInput = THREE.MathUtils.clamp(-angleDiff * (ai.config.reactionRate * 0.2), -1, 1);

      // 5. Corner Detection & Speed Management
      // Compare current tangent with tangent further ahead
      const futureU = (targetU + (25 / totalLen)) % 1.0;
      const futureTan = curve.getTangentAt(futureU).normalize();
      const curvature = 1.0 - targetTan.dot(futureTan); // 0 = straight, higher = sharp turn

      let targetSpeed = v.maxSpeed * ai.config.speedScale;
      if (curvature > 0.08) {
        // Sharp turn ahead: brake before entering
        const cornerFactor = THREE.MathUtils.clamp(1.0 - (curvature * 3.5 * ai.config.cornerBrakeFactor), 0.35, 1.0);
        targetSpeed *= cornerFactor;
      }

      let throttle = 0;
      let brake = 0;
      let handbrake = false;
      let nitro = false;

      if (v.speed < targetSpeed) {
        throttle = 1.0;
        // Legend / Hard bots use nitro on long straights
        if (ai.config.nitroAllowed && curvature < 0.02 && v.speed > 130 && Math.random() < 0.3) {
          nitro = true;
        }
      } else {
        // Need to decelerate for turn
        if (v.speed > targetSpeed + 20) {
          brake = 0.85;
          if (curvature > 0.3 && v.speed > 160) {
            handbrake = true; // Bot drift
          }
        } else {
          throttle = 0.2; // Coast
        }
      }

      // 6. Off-track Recovery
      const distFromCenter = Math.sqrt(minDistSq);
      const isOffroad = distFromCenter > (roadHalfWidth + 1.5);

      if (isOffroad) {
        // Steer hard back towards track center
        const centerPt = curve.getPointAt(closestU);
        const backToCenter = centerPt.clone().sub(v.position);
        const recoveryAngle = Math.atan2(backToCenter.x, backToCenter.z);
        let recDiff = recoveryAngle - v.heading;
        while (recDiff > Math.PI) recDiff -= Math.PI * 2;
        while (recDiff < -Math.PI) recDiff += Math.PI * 2;
        throttle = 0.6;
        brake = 0;
      }

      // Update vehicle with controls
      v.update(dt, { throttle, brake, steer: steerInput, handbrake, nitro }, { isOffroad });
    });
  }

  dispose() {
    this.opponents.forEach(ai => ai.vehicle.dispose());
    this.opponents = [];
  }
}
