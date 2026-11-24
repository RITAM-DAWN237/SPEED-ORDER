/**
 * RaceEngine.js - Central race simulation orchestrator.
 * Handles countdown, vehicle physics updates, collisions, checkpoints,
 * audio integration, minimap rendering, and race completion logic.
 */

import * as THREE from 'three';
import { Vehicle } from './Vehicle.js';
import { AIController } from './AIController.js';
import { CheckpointSystem } from './CheckpointSystem.js';
import { CameraFollow } from './CameraFollow.js';
import { Minimap } from './Minimap.js';
import { ParticleSystem } from './ParticleSystem.js';
import { audio } from '../core/Audio.js';
import { input } from '../core/Input.js';
import { storage } from '../core/Storage.js';

export class RaceEngine {
  constructor(scene, camera, uiManager, trackManager) {
    this.scene = scene;
    this.camera = camera;
    this.ui = uiManager;
    this.trackManager = trackManager;

    this.playerVehicle = null;
    this.aiController = null;
    this.checkpointSystem = null;
    this.cameraFollow = new CameraFollow(this.camera);
    this.minimap = new Minimap('minimap-canvas');
    this.particleSystem = new ParticleSystem(this.scene);

    // Race state
    this.isActive = false;
    this.isCountdown = false;
    this.countdownStep = 3;
    this.raceTime = 0;
    this.currentTrackMesh = null;
    this.raceConfig = null;
    this.remoteOpponent = null; // For multiplayer mode
  }

  /**
   * Start a race with specified configuration
   */
  startRace({ trackId, carId, difficulty = 'medium', laps = 3, opponents = 5, isMultiplayer = false, remotePlayer = null }) {
    this.cleanup();
    this.raceConfig = { trackId, carId, difficulty, laps, opponents, isMultiplayer };

    // 1. Load Track
    const quality = storage.settings.graphicsQuality || 'high';
    this.currentTrackMesh = this.trackManager.loadTrack(trackId, quality);
    this.minimap.setTrackPoints(this.currentTrackMesh.curvePoints);
    this.particleSystem.initSnow(trackId === 'russia_snow');

    // 2. Setup Checkpoints
    this.checkpointSystem = new CheckpointSystem(this.currentTrackMesh, laps);

    // 3. Spawn Player Vehicle at Grid Slot 1
    this.playerVehicle = new Vehicle(this.scene, carId, true);
    const startPoint = this.currentTrackMesh.curvePoints[0];
    const startTangent = this.currentTrackMesh.tangents[0];
    const startHeading = Math.atan2(startTangent.x, startTangent.z);

    // Position player slightly to right of center on pole position
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(startTangent, up).normalize();
    const playerStartPos = startPoint.clone().addScaledVector(normal, 3.2);

    this.playerVehicle.respawn(playerStartPos, startHeading);
    this.cameraFollow.setTarget(this.playerVehicle.group);
    this.cameraFollow.setMode(storage.settings.cameraDistance || 'close');

    // 4. Setup AI Opponents (if single-player)
    if (!isMultiplayer) {
      this.aiController = new AIController(this.scene, this.currentTrackMesh, difficulty, opponents);
      this.aiController.spawnOnGrid(playerStartPos, startHeading);
    } else {
      this.remoteOpponent = remotePlayer;
    }

    // 5. Start HUD & Countdown Sequence
    this.ui.showHUD();
    this.isActive = true;
    this.isCountdown = true;
    this.raceTime = 0;

    audio.startEngine();
    this.runCountdown();
  }

  runCountdown() {
    this.countdownStep = 3;
    this.ui.showCountdown(3);
    audio.playCountdown(false);

    const timer = setInterval(() => {
      if (!this.isActive) {
        clearInterval(timer);
        return;
      }

      this.countdownStep -= 1;
      if (this.countdownStep > 0) {
        this.ui.showCountdown(this.countdownStep);
        audio.playCountdown(false);
      } else if (this.countdownStep === 0) {
        this.ui.showCountdown('GO!');
        audio.playCountdown(true);
        this.isCountdown = false;
        clearInterval(timer);
      }
    }, 1000);
  }

  update(dt) {
    if (!this.isActive) return;

    if (!this.isCountdown) {
      this.raceTime += dt;
    }

    // 1. Gather player controls (disabled during countdown)
    let controls = { throttle: 0, brake: 0, steer: 0, handbrake: false, nitro: false };
    if (!this.isCountdown) {
      controls = {
        throttle: input.getThrottle(),
        brake: input.getBrake(),
        steer: input.getSteer(),
        handbrake: input.isHandbrake(),
        nitro: input.isNitro()
      };
    }

    // Reset vehicle shortcut key 'R'
    if (input.isReset()) {
      const curCP = this.checkpointSystem.checkpoints[this.playerVehicle.currentCheckpoint];
      const heading = Math.atan2(curCP.tangent.x, curCP.tangent.z);
      this.playerVehicle.respawn(curCP.position.clone().add(new THREE.Vector3(0, 0.5, 0)), heading);
    }

    // 2. Offroad detection for player
    const playerPos = this.playerVehicle.position;
    const curve = this.currentTrackMesh.curve;
    const roadHalfWidth = this.currentTrackMesh.roadWidth * 0.5;

    // Approximate distance to track spline
    const uApprox = (this.playerVehicle.currentCheckpoint / this.checkpointSystem.checkpointCount);
    const closestTrackPt = curve.getPointAt(uApprox);
    const distFromTrack = playerPos.distanceTo(closestTrackPt);
    const isOffroad = distFromTrack > (roadHalfWidth + 2.0);

    // 3. Update Player Vehicle physics
    this.playerVehicle.update(dt, controls, { isOffroad });

    // 4. Update Engine & Squeal Audio
    const rpmRatio = Math.abs(this.playerVehicle.speed) / (this.playerVehicle.maxSpeed || 200);
    audio.updateEngine(rpmRatio, controls.throttle > 0);
    audio.updateTireSqueal(this.playerVehicle.slipRatio);
    audio.setNitroSound(this.playerVehicle.isNitroActive);

    // 5. Update AI Opponents
    if (this.aiController) {
      this.aiController.update(dt, this.playerVehicle, !this.isCountdown);
    }

    // 6. Vehicle-to-Vehicle Collisions
    const allVehicles = [this.playerVehicle];
    if (this.aiController) {
      this.aiController.opponents.forEach(o => allVehicles.push(o.vehicle));
    }
    if (this.remoteOpponent) {
      allVehicles.push(this.remoteOpponent);
    }

    this.handleVehicleCollisions(allVehicles);

    // 7. Update Checkpoints & Progress
    allVehicles.forEach(v => {
      this.checkpointSystem.updateVehicle(v, this.raceTime);
    });

    // 8. Calculate real-time positions
    const standings = this.checkpointSystem.calculatePositions(allVehicles, this.playerVehicle);
    const playerStanding = standings.find(s => s.isPlayer) || { pos: 1 };

    // 9. Update Particles
    if (this.playerVehicle.isNitroActive) {
      this.particleSystem.emitNitroFlames(this.playerVehicle.nitroExhaustEmitters, this.playerVehicle.heading);
    }
    if (this.playerVehicle.isDrifting) {
      this.particleSystem.emitTireSmoke(this.playerVehicle.position);
    }
    this.particleSystem.update(dt, this.playerVehicle.position);

    // 10. Update Camera
    this.cameraFollow.update(dt, this.playerVehicle.speed, this.playerVehicle.isNitroActive);

    // 11. Update Minimap
    const aiList = this.aiController ? this.aiController.opponents.map(o => o.vehicle) : [];
    this.minimap.draw(this.playerVehicle, aiList, this.remoteOpponent);

    // 12. Update Racing HUD
    this.ui.updateHUD({
      speed: this.playerVehicle.speed,
      gear: this.playerVehicle.gear,
      nitroPercent: (this.playerVehicle.currentNitro / this.playerVehicle.nitroCapacity) * 100,
      pos: playerStanding.pos,
      totalRacers: standings.length,
      lap: Math.min(this.playerVehicle.currentLap, this.checkpointSystem.totalLaps),
      totalLaps: this.checkpointSystem.totalLaps,
      raceTime: this.raceTime,
      bestLapTime: this.playerVehicle.bestLapTime
    });

    // 13. Check Race Completion
    if (this.playerVehicle.isFinished && !this.isFinishing) {
      this.onPlayerFinishedRace(standings, playerStanding.pos);
    }
  }

  handleVehicleCollisions(vehicles) {
    const carRadius = 1.6;
    for (let i = 0; i < vehicles.length; i++) {
      for (let j = i + 1; j < vehicles.length; j++) {
        const vA = vehicles[i];
        const vB = vehicles[j];
        const delta = vB.position.clone().sub(vA.position);
        delta.y = 0;
        const dist = delta.length();

        if (dist < carRadius * 2 && dist > 0.01) {
          // Push cars apart
          const overlap = (carRadius * 2) - dist;
          const normal = delta.clone().normalize();

          vA.position.addScaledVector(normal, -overlap * 0.5);
          vB.position.addScaledVector(normal, overlap * 0.5);

          // Impulse & speed equalization
          const avgSpeed = (vA.speed + vB.speed) * 0.48;
          vA.speed = avgSpeed;
          vB.speed = avgSpeed;

          if (vA === this.playerVehicle || vB === this.playerVehicle) {
            audio.playCollision(0.7);
            this.cameraFollow.addShake(0.6);
          }
        }
      }
    }
  }

  onPlayerFinishedRace(standings, playerPos) {
    this.isFinishing = true;
    const playerWon = playerPos === 1;

    // Record race stats and process 3-win streak
    const streakResult = storage.recordRaceResult({
      won: playerWon,
      difficulty: this.raceConfig.difficulty,
      trackId: this.raceConfig.trackId,
      bestLap: this.playerVehicle.bestLapTime,
      topSpeed: this.playerVehicle.maxSpeed
    });

    setTimeout(() => {
      audio.stopEngine();
      this.ui.showResults({
        playerWon,
        playerPos,
        totalRacers: standings.length,
        raceTime: this.raceTime,
        bestLap: this.playerVehicle.bestLapTime,
        topSpeed: this.playerVehicle.maxSpeed,
        streakResult,
        standings
      });
      this.isActive = false;
      this.isFinishing = false;
    }, 1800);
  }

  cleanup() {
    this.isActive = false;
    this.isFinishing = false;
    this.isCountdown = false;
    audio.stopEngine();

    if (this.playerVehicle) {
      this.playerVehicle.dispose();
      this.playerVehicle = null;
    }
    if (this.aiController) {
      this.aiController.dispose();
      this.aiController = null;
    }
    this.remoteOpponent = null;
    this.particleSystem.dispose();
  }
}
