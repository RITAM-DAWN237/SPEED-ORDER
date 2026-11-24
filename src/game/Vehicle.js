/**
 * Vehicle.js - Need for Speed Tuner with Underglow Neon,
 * Turbo Blow-Off, Drift Mechanics, and Active Glow Brake Discs
 */

import * as THREE from 'three';
import { getCarById } from './CarCatalog.js';

export class Vehicle {
  constructor(scene, carId = 'nissan_skyline', isPlayer = false) {
    this.scene = scene;
    this.carConfig = getCarById(carId);
    this.isPlayer = isPlayer;

    // Physics parameters
    this.position = new THREE.Vector3(0, 0, 0);
    this.heading = 0; // Yaw angle in radians

    this.speed = 0; // km/h
    this.maxSpeed = this.carConfig.stats.topSpeed;
    this.accelRate = this.carConfig.stats.acceleration;
    this.brakingRate = this.carConfig.stats.braking;
    this.handlingRate = this.carConfig.stats.handling;
    this.nitroCapacity = this.carConfig.stats.nitroCapacity;
    this.nitroBoost = this.carConfig.stats.nitroBoost;

    this.currentNitro = this.nitroCapacity;
    this.isNitroActive = false;
    this.isBraking = false;
    this.isReversing = false;
    this.isDrifting = false;
    this.steerAngle = 0;
    this.slipRatio = 0;
    this.gear = 1;
    this.rpmRatio = 0; // 0 to 1

    // Drift Scoring
    this.driftScore = 0;
    this.currentDriftPoints = 0;
    this.driftTimer = 0;

    // Turbo blow-off tracking
    this.prevThrottle = 0;
    this.onTurboBlowoff = null;

    // Race progress state
    this.currentLap = 1;
    this.currentCheckpoint = 0;
    this.lapTimes = [];
    this.currentLapStartTime = 0;
    this.bestLapTime = null;
    this.isFinished = false;
    this.totalRaceTime = 0;
    this.raceProgressScore = 0;

    // 3D Objects
    this.group = new THREE.Group();
    this.wheels = [];
    this.frontWheelMeshes = [];
    this.brakeLightMesh = null;
    this.brakeLightMaterial = null;
    this.underglowMesh = null;
    this.underglowMaterial = null;
    this.nitroExhaustEmitters = [];

    this.buildVehicleMesh();
    this.scene.add(this.group);
  }

  buildVehicleMesh() {
    const primaryColor = new THREE.Color(this.carConfig.color);
    const secondaryColor = new THREE.Color(this.carConfig.secondaryColor || '#111111');
    const underglowColor = new THREE.Color(this.carConfig.underglowColor || '#00f0ff');

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.9,
      roughness: 0.2,
      envMapIntensity: 1.5
    });

    const carbonMaterial = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      metalness: 0.6,
      roughness: 0.4
    });

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x090c14,
      metalness: 0.95,
      roughness: 0.05,
      transparent: true,
      opacity: 0.88
    });

    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.8 });
    const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.95, roughness: 0.1 });

    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.2
    });

    this.brakeLightMaterial = new THREE.MeshStandardMaterial({
      color: 0x660000,
      emissive: 0x330000,
      emissiveIntensity: 0.3
    });

    // 1. Aerodynamic Lower Body
    const chassisGeo = new THREE.BoxGeometry(1.9, 0.45, 4.4);
    const chassisMesh = new THREE.Mesh(chassisGeo, bodyMaterial);
    chassisMesh.position.y = 0.45;
    chassisMesh.castShadow = true;
    chassisMesh.receiveShadow = true;
    this.group.add(chassisMesh);

    // Front Splitter
    const splitterGeo = new THREE.BoxGeometry(1.95, 0.08, 0.9);
    const splitter = new THREE.Mesh(splitterGeo, carbonMaterial);
    splitter.position.set(0, 0.24, 2.25);
    this.group.add(splitter);

    // 2. Cockpit Cabin
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.48, 2.2);
    const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
    cabin.position.set(0, 0.82, -0.2);
    this.group.add(cabin);

    // Carbon Roof
    const roofGeo = new THREE.BoxGeometry(1.35, 0.08, 1.6);
    const roof = new THREE.Mesh(roofGeo, carbonMaterial);
    roof.position.set(0, 1.08, -0.3);
    this.group.add(roof);

    // 3. Huge Rear Street Wing (NFS Tuner Style)
    const wingGeo = new THREE.BoxGeometry(2.0, 0.08, 0.45);
    const wing = new THREE.Mesh(wingGeo, carbonMaterial);
    wing.position.set(0, 1.15, -2.05);
    this.group.add(wing);

    const wingPostGeo = new THREE.BoxGeometry(0.08, 0.45, 0.18);
    const postL = new THREE.Mesh(wingPostGeo, carbonMaterial);
    postL.position.set(-0.65, 0.9, -2.05);
    const postR = postL.clone();
    postR.position.x = 0.65;
    this.group.add(postL);
    this.group.add(postR);

    // 4. Headlights (Bright Xenon)
    const hlGeo = new THREE.BoxGeometry(0.38, 0.12, 0.15);
    const hlL = new THREE.Mesh(hlGeo, headlightMaterial);
    hlL.position.set(-0.7, 0.52, 2.21);
    const hlR = hlL.clone();
    hlR.position.x = 0.7;
    this.group.add(hlL);
    this.group.add(hlR);

    // 5. Rear Brake Light Bar
    const blGeo = new THREE.BoxGeometry(1.65, 0.12, 0.12);
    this.brakeLightMesh = new THREE.Mesh(blGeo, this.brakeLightMaterial);
    this.brakeLightMesh.position.set(0, 0.56, -2.21);
    this.group.add(this.brakeLightMesh);

    // 6. Dual Exhausts
    const exhaustGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.22, 12);
    exhaustGeo.rotateX(Math.PI / 2);
    const exMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.95 });
    const exL = new THREE.Mesh(exhaustGeo, exMat);
    exL.position.set(-0.5, 0.3, -2.22);
    const exR = exL.clone();
    exR.position.x = 0.5;
    this.group.add(exL);
    this.group.add(exR);
    this.nitroExhaustEmitters.push(exL, exR);

    // 7. Four Street Wheels
    const wheelRadius = 0.38;
    const wheelThickness = 0.28;
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 20);
    tireGeo.rotateZ(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelThickness + 0.01, 16);
    rimGeo.rotateZ(Math.PI / 2);

    const wheelPositions = [
      { x: -0.98, y: wheelRadius, z: 1.4, isFront: true },
      { x: 0.98, y: wheelRadius, z: 1.4, isFront: true },
      { x: -1.0, y: wheelRadius, z: -1.4, isFront: false },
      { x: 1.0, y: wheelRadius, z: -1.4, isFront: false }
    ];

    wheelPositions.forEach((wp) => {
      const wheelAssembly = new THREE.Group();
      wheelAssembly.position.set(wp.x, wp.y, wp.z);

      const tire = new THREE.Mesh(tireGeo, wheelMaterial);
      tire.castShadow = true;
      const rim = new THREE.Mesh(rimGeo, rimMaterial);

      const spinningGroup = new THREE.Group();
      spinningGroup.add(tire);
      spinningGroup.add(rim);

      wheelAssembly.add(spinningGroup);
      this.group.add(wheelAssembly);

      this.wheels.push(spinningGroup);
      if (wp.isFront) this.frontWheelMeshes.push(wheelAssembly);
    });

    // 8. Underglow Neon Light Plane
    const underglowGeo = new THREE.PlaneGeometry(2.6, 5.2);
    underglowGeo.rotateX(-Math.PI / 2);
    this.underglowMaterial = new THREE.MeshBasicMaterial({
      color: underglowColor,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    this.underglowMesh = new THREE.Mesh(underglowGeo, this.underglowMaterial);
    this.underglowMesh.position.y = 0.04;
    this.group.add(this.underglowMesh);
  }

  setUnderglowColor(hexColor) {
    if (this.underglowMaterial) {
      this.underglowMaterial.color.set(hexColor);
    }
  }

  update(dt, controls = {}, trackInfo = {}) {
    if (this.isFinished) {
      this.speed = Math.max(0, this.speed - 35 * dt);
      controls = { throttle: 0, brake: 0.3, steer: 0, handbrake: false, nitro: false };
    }

    const throttle = controls.throttle || 0;
    const brake = controls.brake || 0;
    const steerInput = controls.steer || 0;
    const handbrake = !!controls.handbrake;
    const wantNitro = !!controls.nitro;

    // Turbo blow-off valve detection (releasing gas after high boost)
    if (this.prevThrottle > 0.8 && throttle < 0.2 && this.speed > 80) {
      if (this.onTurboBlowoff) this.onTurboBlowoff();
    }
    this.prevThrottle = throttle;

    // NOS Nitrous System
    if (wantNitro && this.currentNitro > 0 && throttle > 0 && this.speed > 25) {
      this.isNitroActive = true;
      this.currentNitro = Math.max(0, this.currentNitro - 38 * dt);
    } else {
      this.isNitroActive = false;
      if (!wantNitro && this.currentNitro < this.nitroCapacity) {
        this.currentNitro = Math.min(this.nitroCapacity, this.currentNitro + 9 * dt);
      }
    }

    const effectiveMaxSpeed = this.isNitroActive ? (this.maxSpeed + this.nitroBoost) : this.maxSpeed;
    const currentAccel = (this.isNitroActive ? this.accelRate * 1.6 : this.accelRate);
    const surfaceDrag = trackInfo.isOffroad ? 0.45 : 1.0;

    // 1. Acceleration & Braking
    if (throttle > 0) {
      if (this.speed < effectiveMaxSpeed * surfaceDrag) {
        this.speed += currentAccel * throttle * surfaceDrag * dt;
      }
      this.isReversing = false;
      this.isBraking = false;
    } else if (brake > 0) {
      if (this.speed > 6) {
        this.speed -= this.brakingRate * brake * dt;
        this.isBraking = true;
        this.isReversing = false;
      } else {
        this.speed -= 22 * brake * dt;
        this.speed = Math.max(-50, this.speed);
        this.isReversing = true;
        this.isBraking = true;
      }
    } else {
      this.isBraking = false;
      this.isReversing = false;
      const rollFriction = handbrake ? 55 : 18;
      if (this.speed > 0) this.speed = Math.max(0, this.speed - rollFriction * dt);
      else if (this.speed < 0) this.speed = Math.min(0, this.speed + rollFriction * dt);
    }

    // 2. Steering & Drift Mechanics
    const targetSteerAngle = -steerInput * 0.58;
    this.steerAngle += (targetSteerAngle - this.steerAngle) * Math.min(1, 15 * dt);

    this.frontWheelMeshes.forEach(w => {
      w.rotation.y = this.steerAngle;
    });

    const speedRatio = Math.abs(this.speed) / (this.maxSpeed || 220);
    const turnSensitivity = (0.75 + (1.0 - Math.min(0.8, speedRatio)) * 0.65) * this.handlingRate;
    const steerDir = this.speed >= 0 ? 1 : -1;

    let turnRate = this.steerAngle * turnSensitivity * steerDir * (Math.abs(this.speed) > 1 ? 1 : 0);

    // Controlled Power Slide / Drift
    const isDriftAction = (handbrake || (brake > 0 && Math.abs(steerInput) > 0.4)) && Math.abs(this.speed) > 35;
    if (isDriftAction) {
      this.isDrifting = true;
      turnRate *= 1.75;
      this.slipRatio = Math.min(1, this.slipRatio + 3.5 * dt);

      // Accumulate drift points
      this.currentDriftPoints += Math.round(Math.abs(this.speed) * 8 * dt);
      this.driftTimer = 0.5;
    } else {
      this.isDrifting = false;
      this.slipRatio = Math.max(0, this.slipRatio - 4 * dt);
      if (this.driftTimer > 0) {
        this.driftTimer -= dt;
        if (this.driftTimer <= 0 && this.currentDriftPoints > 0) {
          this.driftScore += this.currentDriftPoints;
          this.currentDriftPoints = 0;
        }
      }
    }

    this.heading += turnRate * dt;

    // 3. Movement
    const speedMs = (this.speed * 1000) / 3600;
    this.position.x += Math.sin(this.heading) * speedMs * dt;
    this.position.z += Math.cos(this.heading) * speedMs * dt;

    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;

    // Chassis roll during cornering
    const rollAngle = -this.steerAngle * speedRatio * 0.09;
    this.group.rotation.z = rollAngle;

    // 4. Wheels spin
    const wheelRadius = 0.38;
    const spinDelta = (speedMs / wheelRadius) * dt;
    this.wheels.forEach(w => {
      w.rotation.x += spinDelta;
    });

    // 5. Brake light glow
    if (this.brakeLightMesh) {
      if (this.isBraking || handbrake) {
        this.brakeLightMaterial.emissive.setHex(0xff0033);
        this.brakeLightMaterial.emissiveIntensity = 1.2;
      } else {
        this.brakeLightMaterial.emissive.setHex(0x330000);
        this.brakeLightMaterial.emissiveIntensity = 0.25;
      }
    }

    // 6. Gears & RPM
    this.rpmRatio = THREE.MathUtils.clamp((Math.abs(this.speed) % 55) / 55 + (throttle * 0.2), 0.15, 1.0);
    if (this.speed < 45) this.gear = 1;
    else if (this.speed < 90) this.gear = 2;
    else if (this.speed < 140) this.gear = 3;
    else if (this.speed < 195) this.gear = 4;
    else if (this.speed < 250) this.gear = 5;
    else this.gear = 6;
  }

  respawn(pos, heading) {
    this.position.copy(pos);
    this.position.y = 0;
    this.heading = heading;
    this.speed = 0;
    this.group.position.copy(this.position);
    this.group.rotation.set(0, this.heading, 0);
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse(child => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      }
    });
  }
}
