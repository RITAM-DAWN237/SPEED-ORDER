/**
 * Vehicle.js - Procedural 3D Sports Car with Arcade Physics,
 * Steering, Wheel Rotation, Lights, and Collision Handling
 */

import * as THREE from 'three';
import { getCarById } from './CarCatalog.js';

export class Vehicle {
  constructor(scene, carId = 'viper_gtr', isPlayer = false) {
    this.scene = scene;
    this.carConfig = getCarById(carId);
    this.isPlayer = isPlayer;

    // Physics parameters
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.heading = 0; // Yaw angle in radians

    this.speed = 0; // in km/h
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
    this.steerAngle = 0; // Current front wheel turn angle
    this.slipRatio = 0;
    this.gear = 1;

    // Race progress state
    this.currentLap = 1;
    this.currentCheckpoint = 0;
    this.lapTimes = [];
    this.currentLapStartTime = 0;
    this.bestLapTime = null;
    this.isFinished = false;
    this.totalRaceTime = 0;
    this.raceProgressScore = 0; // For position ranking

    // 3D Objects
    this.group = new THREE.Group();
    this.wheels = [];
    this.frontWheelMeshes = [];
    this.brakeLightMesh = null;
    this.headlightMeshes = [];
    this.nitroExhaustEmitters = [];

    this.buildVehicleMesh();
    this.scene.add(this.group);
  }

  buildVehicleMesh() {
    const primaryColor = new THREE.Color(this.carConfig.color);
    const secondaryColor = new THREE.Color(this.carConfig.secondaryColor || '#111111');

    // Materials
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.85,
      roughness: 0.22,
      envMapIntensity: 1.2
    });

    const carbonMaterial = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      metalness: 0.6,
      roughness: 0.5
    });

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x111625,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85
    });

    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.2
    });

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.95,
      roughness: 0.15
    });

    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.9,
      roughness: 0.1
    });

    this.brakeLightMaterial = new THREE.MeshStandardMaterial({
      color: 0x660000,
      emissive: 0x330000,
      emissiveIntensity: 0.2,
      roughness: 0.3
    });

    // 1. Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(1.85, 0.45, 4.3);
    const chassisMesh = new THREE.Mesh(chassisGeo, bodyMaterial);
    chassisMesh.position.y = 0.45;
    chassisMesh.castShadow = true;
    chassisMesh.receiveShadow = true;
    this.group.add(chassisMesh);

    // Front Bumper / Splitter
    const splitterGeo = new THREE.BoxGeometry(1.9, 0.1, 0.8);
    const splitterMesh = new THREE.Mesh(splitterGeo, carbonMaterial);
    splitterMesh.position.set(0, 0.25, 2.2);
    splitterMesh.castShadow = true;
    this.group.add(splitterMesh);

    // 2. Cockpit / Cabin
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.45, 2.1);
    const cabinMesh = new THREE.Mesh(cabinGeo, glassMaterial);
    cabinMesh.position.set(0, 0.8, -0.2);
    cabinMesh.castShadow = true;
    this.group.add(cabinMesh);

    // Cabin Roof Cover
    const roofGeo = new THREE.BoxGeometry(1.35, 0.08, 1.6);
    const roofMesh = new THREE.Mesh(roofGeo, bodyMaterial);
    roofMesh.position.set(0, 1.05, -0.3);
    roofMesh.castShadow = true;
    this.group.add(roofMesh);

    // 3. Rear GT Wing / Spoiler
    const wingGeo = new THREE.BoxGeometry(1.9, 0.08, 0.4);
    const wingMesh = new THREE.Mesh(wingGeo, carbonMaterial);
    wingMesh.position.set(0, 1.05, -2.0);
    wingMesh.castShadow = true;
    this.group.add(wingMesh);

    const wingPostGeo = new THREE.BoxGeometry(0.08, 0.35, 0.15);
    const postL = new THREE.Mesh(wingPostGeo, carbonMaterial);
    postL.position.set(-0.6, 0.85, -2.0);
    const postR = postL.clone();
    postR.position.set(0.6, 0.85, -2.0);
    this.group.add(postL);
    this.group.add(postR);

    // 4. Headlights
    const hlGeo = new THREE.BoxGeometry(0.35, 0.1, 0.15);
    const hlL = new THREE.Mesh(hlGeo, headlightMaterial);
    hlL.position.set(-0.7, 0.5, 2.16);
    const hlR = hlL.clone();
    hlR.position.set(0.7, 0.5, 2.16);
    this.group.add(hlL);
    this.group.add(hlR);
    this.headlightMeshes.push(hlL, hlR);

    // 5. Rear Brake Light Bar
    const blGeo = new THREE.BoxGeometry(1.6, 0.1, 0.1);
    this.brakeLightMesh = new THREE.Mesh(blGeo, this.brakeLightMaterial);
    this.brakeLightMesh.position.set(0, 0.55, -2.16);
    this.group.add(this.brakeLightMesh);

    // 6. Exhausts (for Nitro particles)
    const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 12);
    exhaustGeo.rotateX(Math.PI / 2);
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 });
    const exL = new THREE.Mesh(exhaustGeo, exhaustMat);
    exL.position.set(-0.45, 0.3, -2.18);
    const exR = exL.clone();
    exR.position.set(0.45, 0.3, -2.18);
    this.group.add(exL);
    this.group.add(exR);
    this.nitroExhaustEmitters.push(exL, exR);

    // 7. Four Wheels (Tires + Rims)
    const wheelRadius = 0.38;
    const wheelThickness = 0.28;
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 20);
    tireGeo.rotateZ(Math.PI / 2);

    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelThickness + 0.01, 16);
    rimGeo.rotateZ(Math.PI / 2);

    const wheelPositions = [
      { x: -0.96, y: wheelRadius, z: 1.35, isFront: true },   // Front Left
      { x: 0.96, y: wheelRadius, z: 1.35, isFront: true },    // Front Right
      { x: -0.98, y: wheelRadius, z: -1.35, isFront: false }, // Rear Left
      { x: 0.98, y: wheelRadius, z: -1.35, isFront: false }   // Rear Right
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
      if (wp.isFront) {
        this.frontWheelMeshes.push(wheelAssembly);
      }
    });

    // 8. Soft Ground Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(2.4, 5.0);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = 0.02;
    this.group.add(shadowMesh);
  }

  /**
   * Update vehicle physics each frame
   * @param {number} dt Delta time in seconds
   * @param {Object} controls { throttle, brake, steer, handbrake, nitro }
   * @param {Object} trackInfo { isOffroad, roadBounds }
   */
  update(dt, controls = {}, trackInfo = {}) {
    if (this.isFinished) {
      // Slow down to gentle cruise
      this.speed = Math.max(0, this.speed - 30 * dt);
      controls = { throttle: 0, brake: 0.3, steer: 0, handbrake: false, nitro: false };
    }

    const throttle = controls.throttle || 0;
    const brake = controls.brake || 0;
    const steerInput = controls.steer || 0;
    const handbrake = !!controls.handbrake;
    const wantNitro = !!controls.nitro;

    // Nitro logic
    if (wantNitro && this.currentNitro > 0 && throttle > 0 && this.speed > 20) {
      this.isNitroActive = true;
      this.currentNitro = Math.max(0, this.currentNitro - 35 * dt);
    } else {
      this.isNitroActive = false;
      // Passive nitro refill over time when not boosting
      if (!wantNitro && this.currentNitro < this.nitroCapacity) {
        this.currentNitro = Math.min(this.nitroCapacity, this.currentNitro + 8 * dt);
      }
    }

    const effectiveMaxSpeed = this.isNitroActive ? (this.maxSpeed + this.nitroBoost) : this.maxSpeed;
    const currentAccel = (this.isNitroActive ? this.accelRate * 1.5 : this.accelRate);

    // Surface friction multiplier
    const surfaceDrag = trackInfo.isOffroad ? 0.45 : 1.0;

    // 1. Acceleration & Braking
    if (throttle > 0) {
      if (this.speed < effectiveMaxSpeed * surfaceDrag) {
        this.speed += currentAccel * throttle * surfaceDrag * dt;
      }
      this.isReversing = false;
    } else if (brake > 0) {
      if (this.speed > 5) {
        // Braking while going forward
        this.speed -= this.brakingRate * brake * dt;
        this.isBraking = true;
        this.isReversing = false;
      } else {
        // Reverse
        this.speed -= 20 * brake * dt;
        this.speed = Math.max(-45, this.speed);
        this.isReversing = true;
        this.isBraking = true;
      }
    } else {
      this.isBraking = false;
      this.isReversing = false;
      // Rolling friction
      const rollFriction = handbrake ? 45 : 15;
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - rollFriction * dt);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + rollFriction * dt);
      }
    }

    // 2. Steering & Drift
    const targetSteerAngle = -steerInput * 0.55;
    this.steerAngle += (targetSteerAngle - this.steerAngle) * Math.min(1, 14 * dt);

    // Front wheels visual steer
    this.frontWheelMeshes.forEach(w => {
      w.rotation.y = this.steerAngle;
    });

    const speedRatio = Math.abs(this.speed) / (this.maxSpeed || 200);
    // Steering agility scales smoothly with speed
    const turnSensitivity = (0.7 + (1.0 - Math.min(0.8, speedRatio)) * 0.6) * this.handlingRate;
    const steerDirection = this.speed >= 0 ? 1 : -1;

    let turnRate = this.steerAngle * turnSensitivity * steerDirection * (Math.abs(this.speed) > 1 ? 1 : 0);

    if (handbrake && Math.abs(this.speed) > 30) {
      this.isDrifting = true;
      turnRate *= 1.6; // Exaggerate drift yaw
      this.slipRatio = Math.min(1, this.slipRatio + 3 * dt);
    } else {
      this.isDrifting = false;
      this.slipRatio = Math.max(0, this.slipRatio - 4 * dt);
    }

    this.heading += turnRate * dt;

    // 3. Move along heading
    const speedMs = (this.speed * 1000) / 3600; // km/h to m/s
    this.position.x += Math.sin(this.heading) * speedMs * dt;
    this.position.z += Math.cos(this.heading) * speedMs * dt;

    // Apply to 3D mesh
    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;

    // Subtle chassis roll during sharp cornering
    const rollAngle = -this.steerAngle * speedRatio * 0.08;
    this.group.rotation.z = rollAngle;

    // 4. Spin wheels
    const wheelRadius = 0.38;
    const spinDelta = (speedMs / wheelRadius) * dt;
    this.wheels.forEach(w => {
      w.rotation.x += spinDelta;
    });

    // 5. Update brake lights emissive glow
    if (this.brakeLightMesh) {
      if (this.isBraking || handbrake) {
        this.brakeLightMaterial.emissive.setHex(0xff0022);
        this.brakeLightMaterial.emissiveIntensity = 1.0;
      } else {
        this.brakeLightMaterial.emissive.setHex(0x330000);
        this.brakeLightMaterial.emissiveIntensity = 0.2;
      }
    }

    // 6. Calculate approximate gear
    if (this.speed < 40) this.gear = 1;
    else if (this.speed < 85) this.gear = 2;
    else if (this.speed < 135) this.gear = 3;
    else if (this.speed < 190) this.gear = 4;
    else if (this.speed < 240) this.gear = 5;
    else this.gear = 6;
  }

  /**
   * Reset car to a specific checkpoint position & rotation
   */
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
