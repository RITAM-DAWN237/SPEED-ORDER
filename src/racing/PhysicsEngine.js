import * as THREE from 'three';
import { audio } from '../core/Audio.js';
import { circuitSpline } from './TrackSpline.js';

/**
 * Arcade Physics Engine locked strictly to the Circuit Spline:
 * - Progression s (distance along track in meters)
 * - Lateral offset d (meters left/right from track center, wider road)
 * - 3D track elevation (overpass bridges & underpasses)
 * - Border ramp jumping physics (vertical airborne velocity, gravity, stunt landing)
 * - Drifting, nitro, collisions with obstacles and 7 police cruisers
 */
export class PhysicsEngine {
  constructor(carModel, trackEnv, obstacleSystem, policeSystem = null) {
    this.carModel = carModel;
    this.trackEnv = trackEnv;
    this.obstacleSystem = obstacleSystem;
    this.policeSystem = policeSystem;
    this.spline = circuitSpline;

    // Track coordinates
    this.s = 30; // Meters along track from start line
    this.d = 0;  // Lateral lane offset
    this.position = new THREE.Vector3();
    this.heading = 0;
    this.speed = 0;
    this.maxSpeed = 270;
    this.boostSpeed = 335;
    this.reverseMaxSpeed = 45;

    this.steerAngle = 0;
    this.isDrifting = false;
    this.nitroActive = false;
    this.nitroFuel = 100;
    this.lapCompletedTrigger = false;
    this.controlsLocked = true; // Locked during 5s countdown

    // Stunt Jump Airborne Physics
    this.isAirborne = false;
    this.jumpHeight = 0;
    this.verticalVel = 0;
    this.rampCooldown = 0;

    this.currentCamPos = new THREE.Vector3();
  }

  update(inputs, deltaTime, camera) {
    const dt = Math.min(deltaTime, 0.05);

    if (this.controlsLocked) {
      this.speed = 0;
      this.updateMeshAndCamera(camera, dt);
      return;
    }

    if (this.rampCooldown > 0) this.rampCooldown -= dt;

    // 1. Nitrous Boost
    if (inputs.nitro && this.nitroFuel > 0 && this.speed > 20) {
      this.nitroActive = true;
      this.nitroFuel = Math.max(0, this.nitroFuel - 24 * dt);
    } else {
      this.nitroActive = false;
      this.nitroFuel = Math.min(100, this.nitroFuel + 8 * dt);
    }

    // 2. Throttle & Brake
    const effectiveMaxSpeed = this.nitroActive ? this.boostSpeed : this.maxSpeed;
    const accelRate = this.nitroActive ? 135 : 72;
    const brakeRate = 145;
    const dragRate = 18;

    if (inputs.throttle) {
      if (this.speed < effectiveMaxSpeed) this.speed += accelRate * dt;
    } else if (inputs.brake) {
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - brakeRate * dt);
      } else {
        this.speed = Math.max(-this.reverseMaxSpeed, this.speed - (accelRate * 0.6) * dt);
      }
    } else {
      if (this.speed > 0) this.speed = Math.max(0, this.speed - dragRate * dt);
      else if (this.speed < 0) this.speed = Math.min(0, this.speed + dragRate * dt);
    }

    // 3. Drifting & Steering
    this.isDrifting = inputs.handbrake && Math.abs(this.speed) > 35;
    const steerSpeed = 2.8;
    const maxSteer = this.isDrifting ? 0.58 : 0.44;

    if (inputs.steerLeft) {
      this.steerAngle = Math.min(maxSteer, this.steerAngle + steerSpeed * dt);
    } else if (inputs.steerRight) {
      this.steerAngle = Math.max(-maxSteer, this.steerAngle - steerSpeed * dt);
    } else {
      this.steerAngle *= Math.pow(0.001, dt);
    }

    // 4. Move along Spline
    const speedMS = (this.speed * 1000) / 3600;
    this.s += speedMS * dt;

    // Check lap completion
    if (this.s >= this.spline.totalLength) {
      this.s -= this.spline.totalLength;
      this.lapCompletedTrigger = true;
    } else {
      this.lapCompletedTrigger = false;
    }

    // Lateral movement across wider road
    const turnMult = this.isDrifting ? 1.6 : 1.0;
    const lateralSpeed = (this.speed / 100) * 13 * turnMult;
    this.d += this.steerAngle * lateralSpeed * dt;

    // Road limits for 20m wide track (bounds roughly -8.8m to +8.8m)
    const roadLimit = (this.trackEnv.roadWidth / 2) - 1.2;
    if (this.d < -roadLimit) {
      this.d = -roadLimit;
      this.speed *= 0.88;
    } else if (this.d > roadLimit) {
      this.d = roadLimit;
      this.speed *= 0.88;
    }

    // 5. Border Stunt Ramps Collision & Airborne Jump
    if (this.trackEnv.ramps && this.rampCooldown <= 0) {
      for (let ramp of this.trackEnv.ramps) {
        const ds = Math.abs(this.s - ramp.s);
        const dd = Math.abs(this.d - ramp.d);
        if (ds < 3.2 && dd < 2.2 && !this.isAirborne && this.speed > 50) {
          this.isAirborne = true;
          this.verticalVel = 11.5 + (this.speed / 270) * 8.5;
          this.jumpHeight = 0.2;
          this.rampCooldown = 1.8;
          this.nitroFuel = Math.min(100, this.nitroFuel + 30);
          audio.playNitroSound();
          break;
        }
      }
    }

    // Airborne physics handling
    if (this.isAirborne) {
      this.verticalVel -= 28.0 * dt; // Gravity
      this.jumpHeight += this.verticalVel * dt;
      if (this.jumpHeight <= 0) {
        this.jumpHeight = 0;
        this.isAirborne = false;
        this.verticalVel = 0;
      }
    }

    // 6. Obstacle Collisions
    if (this.obstacleSystem) {
      const obsRes = this.obstacleSystem.checkVehicleCollisions(this.position, this.speed);
      if (obsRes.hasCollision) {
        this.speed *= obsRes.speedMultiplier;
        this.d += (obsRes.pushX || 0) * 0.45;
        if (obsRes.boostTriggered) {
          this.nitroFuel = Math.min(100, this.nitroFuel + 40);
          this.speed = Math.min(this.boostSpeed, this.speed + 55);
          audio.playNitroSound();
        }
        if (obsRes.soundEffect === 'crash') audio.playCrashSound();
      }
    }

    // 7. Police Cruisers Collision
    if (this.policeSystem) {
      const copCol = this.policeSystem.checkCollision(this.position, this.speed);
      if (copCol.hit) {
        this.speed *= (copCol.speedMult || 0.7);
        this.d += (copCol.pushX || 0) * 0.45;
        audio.playCrashSound();
      }
    }

    this.updateMeshAndCamera(camera, dt);
  }

  updateMeshAndCamera(camera, dt) {
    // Evaluate 3D Spline position & tangent
    const t = this.spline.distToT(this.s);
    const centerPt = this.spline.getPointAt(t);
    const tangent = this.spline.getTangentAt(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // Actual 3D car position including spline elevation + jump height
    this.position.copy(centerPt).addScaledVector(normal, this.d);
    this.position.y = centerPt.y + 0.05 + this.jumpHeight;

    // Heading matches spline curve tangent + steering deviation
    const trackAngle = Math.atan2(tangent.x, tangent.z);
    this.heading = trackAngle + this.steerAngle * 0.35;

    // Update Car Model Mesh
    this.carModel.mesh.position.copy(this.position);
    this.carModel.mesh.rotation.y = this.heading;
    this.carModel.mesh.rotation.z = -this.steerAngle * 0.12;
    // Pitch forward/up during jump airtime
    this.carModel.mesh.rotation.x = this.isAirborne ? -0.16 : 0;

    this.carModel.updateVisuals(this.speed, this.steerAngle, false, false);

    // Follow Camera (Semi-3D Retro Arcade low-slung chase angle)
    if (camera) {
      const dist = 7.6;
      const height = 3.6;
      const targetCamX = this.position.x - Math.sin(this.heading) * dist;
      const targetCamZ = this.position.z - Math.cos(this.heading) * dist;
      const targetCamY = this.position.y + height;

      const lerpRate = Math.min(1.0, 11 * dt);
      this.currentCamPos.x += (targetCamX - this.currentCamPos.x) * lerpRate;
      this.currentCamPos.y += (targetCamY - this.currentCamPos.y) * lerpRate;
      this.currentCamPos.z += (targetCamZ - this.currentCamPos.z) * lerpRate;

      camera.position.copy(this.currentCamPos);
      camera.lookAt(
        this.position.x + Math.sin(this.heading) * 12,
        this.position.y + 0.75,
        this.position.z + Math.cos(this.heading) * 12
      );

      // Dynamic FOV speed stretch for arcade velocity sensation
      const targetFov = this.nitroActive ? 65 : (56 + (this.speed / 270) * 6);
      camera.fov += (targetFov - camera.fov) * 5 * dt;
      camera.updateProjectionMatrix();
    }
  }
}
