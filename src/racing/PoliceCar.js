import * as THREE from 'three';
import { circuitSpline } from './TrackSpline.js';
import { audio } from '../core/Audio.js';

/**
 * PoliceCarModel: Procedural Police Cruiser with:
 * - High-visibility 3D overhead floating badge label (e.g. "🚔 COP 1")
 * - Numbered decals on doors, hood, and roof ("01", "02", etc.)
 * - Alternating red & blue strobe lights
 * - Low-poly flat shaded retro pixel arcade style
 */
class PoliceCarModel {
  constructor(name = 'COP 1', num = '01') {
    this.name = name;
    this.num = num;
    this.mesh = new THREE.Group();
    this.strobeTimer = 0;

    const blackMat = new THREE.MeshLambertMaterial({ color: 0x111622, flatShading: true });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee, flatShading: true });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x112233, flatShading: true });

    // Chassis
    const chassisGeo = new THREE.BoxGeometry(2.1, 0.46, 4.4);
    const chassis = new THREE.Mesh(chassisGeo, blackMat);
    chassis.position.y = 0.44;
    this.mesh.add(chassis);

    // Front Bull Bar
    const bull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 0.3), blackMat);
    bull.position.set(0, 0.45, 2.25);
    this.mesh.add(bull);

    // White Doors with Cop Number
    this.createDoorDecals(num);

    // Hood with large Cop Number
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.22, 1.5), blackMat);
    hood.position.set(0, 0.56, 1.35);
    this.mesh.add(hood);
    this.createHoodDecal(num);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.46, 2.3), glassMat);
    cabin.position.set(0, 0.82, -0.2);
    this.mesh.add(cabin);

    // Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.06, 1.6), whiteMat);
    roof.position.set(0, 1.08, -0.25);
    this.mesh.add(roof);

    // Emergency Strobe Lightbar
    this.redLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.blueLightMat = new THREE.MeshBasicMaterial({ color: 0x0044ff });

    this.redBulb = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.24), this.redLightMat);
    this.redBulb.position.set(-0.3, 1.2, -0.2);
    this.mesh.add(this.redBulb);

    this.blueBulb = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.24), this.blueLightMat);
    this.blueBulb.position.set(0.3, 1.2, -0.2);
    this.mesh.add(this.blueBulb);

    this.createWheels();
    this.createRoofMarker(name);
    this.createOverheadBadge(name);
  }

  createDoorDecals(num) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = '#111622';
    ctx.font = '900 38px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(num, 64, 32);

    const tex = new THREE.CanvasTexture(canvas);
    const doorMat = new THREE.MeshBasicMaterial({ map: tex });

    // Left Door
    const doorL = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.42), doorMat);
    doorL.position.set(-1.06, 0.46, 0);
    doorL.rotation.y = -Math.PI / 2;
    this.mesh.add(doorL);

    // Right Door
    const doorR = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.42), doorMat);
    doorR.position.set(1.06, 0.46, 0);
    doorR.rotation.y = Math.PI / 2;
    this.mesh.add(doorR);
  }

  createHoodDecal(num) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111622';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#ffcc00';
    ctx.font = '900 80px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(num, 64, 64);

    const tex = new THREE.CanvasTexture(canvas);
    const hoodMat = new THREE.MeshBasicMaterial({ map: tex });
    const hoodDecal = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), hoodMat);
    hoodDecal.position.set(0, 0.68, 1.35);
    hoodDecal.rotation.x = -Math.PI / 2;
    this.mesh.add(hoodDecal);
  }

  createRoofMarker(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0e18';
    ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 64, 32);

    const tex = new THREE.CanvasTexture(canvas);
    const markerMat = new THREE.MeshBasicMaterial({ map: tex });
    const marker = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), markerMat);
    marker.position.set(0, 1.15, -0.25);
    marker.rotation.x = -Math.PI / 2;
    this.mesh.add(marker);
  }

  // 3D Floating Overhead Badge above car (THREE.Sprite auto-faces camera)
  createOverheadBadge(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 72;
    const ctx = canvas.getContext('2d');

    // Badge pill background
    ctx.fillStyle = 'rgba(8, 14, 28, 0.95)';
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 64, 12);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ff0055';
    ctx.stroke();

    ctx.fillStyle = '#ffd60a';
    ctx.font = '900 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🚔 ${name}`, 128, 36);

    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.2, 0.9, 1.0);
    sprite.position.set(0, 2.45, 0);
    this.badgeMesh = sprite;
    this.mesh.add(sprite);
  }

  createWheels() {
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 10);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222, flatShading: true });

    const wheelPositions = [
      [-1.0, 0.38, 1.3],
      [1.0, 0.38, 1.3],
      [-1.0, 0.38, -1.3],
      [1.0, 0.38, -1.3]
    ];

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(...pos);
      this.mesh.add(wheel);
    });
  }

  update(deltaTime, speed) {
    this.strobeTimer += deltaTime * 12;
    const isRed = Math.floor(this.strobeTimer) % 2 === 0;
    this.redLightMat.color.setHex(isRed ? 0xff0044 : 0x330000);
    this.blueLightMat.color.setHex(isRed ? 0x001133 : 0x0088ff);
  }
}

/**
 * PoliceSystem: Manages 7 Pursuit Units (COP 1 to COP 7).
 * - Reduced top speeds so they can be outrun realistically by the player!
 * - Prominent 3D overhead badges and door number decals (01 to 07)
 * - Imperfect movement accuracy with obstacle & ramp collisions
 */
export class PoliceSystem {
  constructor(scene, obstacleSystem = null, trackEnv = null) {
    this.scene = scene;
    this.obstacleSystem = obstacleSystem;
    this.trackEnv = trackEnv;
    this.spline = circuitSpline;
    this.cops = [];
    this.active = false;
    this.starsEarned = 0;
    this.onCopOutrun = null;
  }

  spawnPursuitUnits(playerS, trackLength) {
    this.clear();
    this.starsEarned = 0;
    this.active = false;

    // 7 Police units with reduced top speeds for balanced, fun arcade chasing
    const copConfigs = [
      { name: 'COP 1', num: '01', sOffset: -30, d: -4.0, speed: 145 },
      { name: 'COP 2', num: '02', sOffset: -50, d: 4.0,  speed: 148 },
      { name: 'COP 3', num: '03', sOffset: -75, d: -2.0, speed: 150 },
      { name: 'COP 4', num: '04', sOffset: 45,  d: -5.0, speed: 130 },
      { name: 'COP 5', num: '05', sOffset: 85,  d: 5.0,  speed: 134 },
      { name: 'COP 6', num: '06', sOffset: 130, d: -3.0, speed: 138 },
      { name: 'COP 7', num: '07', sOffset: 175, d: 3.0,  speed: 140 },
    ];

    copConfigs.forEach((cfg, idx) => {
      const cop = new PoliceCarModel(cfg.name, cfg.num);
      this.scene.add(cop.mesh);

      const initialS = playerS + cfg.sOffset;
      this.cops.push({
        id: idx,
        name: cfg.name,
        num: cfg.num,
        model: cop,
        s: initialS,
        d: cfg.d,
        targetD: cfg.d,
        speed: cfg.speed,
        baseSpeed: cfg.speed,
        pos: new THREE.Vector3(),
        outrunTriggered: false,
        hitCooldown: 0,
        // Imperfect AI attributes
        wobblePhase: Math.random() * Math.PI * 2,
        offsetError: (Math.random() - 0.5) * 3.5,
        errorTimer: Math.random() * 2.0,
        spinAngle: 0,
        // Airborne jump physics
        isAirborne: false,
        jumpHeight: 0,
        verticalVel: 0
      });
    });

    this.updateCopPositions();
  }

  update(deltaTime, playerS, playerD, playerSpeed) {
    if (!this.active) {
      this.cops.forEach(cop => cop.model.update(deltaTime, 0));
      return;
    }

    const totalL = this.spline.totalLength;

    this.cops.forEach((cop) => {
      if (cop.hitCooldown > 0) cop.hitCooldown -= deltaTime;

      // Update cop imperfect error timer
      cop.errorTimer -= deltaTime;
      if (cop.errorTimer <= 0) {
        cop.offsetError = (Math.random() - 0.5) * 4.0;
        cop.errorTimer = 1.8 + Math.random() * 2.5;
      }
      cop.wobblePhase += deltaTime * (1.1 + cop.id * 0.25);
      const wobble = Math.sin(cop.wobblePhase) * 1.6;

      // Delta distance along spline
      let ds = cop.s - playerS;
      if (ds > totalL / 2) ds -= totalL;
      if (ds < -totalL / 2) ds += totalL;

      // Check if outrun (player pulled 25m ahead)
      if (ds < -25 && !cop.outrunTriggered) {
        cop.outrunTriggered = true;
        this.starsEarned++;
        if (this.onCopOutrun) this.onCopOutrun(cop.name, this.starsEarned);
      }

      // 1. Chasing Behind (Reduced top speed cap: 175 km/h max!)
      if (ds < 0) {
        const targetSpeed = Math.min(175, Math.max(125, playerSpeed + 3));
        cop.speed += (targetSpeed - cop.speed) * 1.1 * deltaTime;

        // Imperfect lateral tracking
        const targetD = playerD + wobble + cop.offsetError;
        const dd = targetD - cop.d;
        cop.d += Math.sign(dd) * Math.min(Math.abs(dd), 1.5 * deltaTime);
      }
      // 2. Interceptor Ahead (Reduced speed: 115 - 138 km/h)
      else {
        cop.speed = Math.max(115, Math.min(138, cop.baseSpeed));
        const targetD = playerD + wobble * 0.8 + cop.offsetError;
        const dd = targetD - cop.d;
        if (Math.abs(dd) < 2.5 && ds < 40) {
          cop.d += Math.sign(dd) * Math.min(Math.abs(dd), 1.2 * deltaTime);
        }
      }

      // 3. Check Cops Colliding with Obstacles
      if (this.obstacleSystem && cop.hitCooldown <= 0) {
        const obsCol = this.obstacleSystem.checkCopCollision(cop.pos, cop.speed);
        if (obsCol.hit) {
          cop.speed *= obsCol.speedMult;
          cop.d += obsCol.pushX * 0.5;
          cop.spinAngle = (Math.random() > 0.5 ? 1 : -1) * 0.55;
          cop.hitCooldown = 1.2;
          if (Math.abs(ds) < 35) audio.playCrashSound();
        }
      }

      // 4. Check Cops hitting Border Stunt Ramps
      if (this.trackEnv && this.trackEnv.ramps && !cop.isAirborne) {
        for (let ramp of this.trackEnv.ramps) {
          if (Math.abs(cop.s - ramp.s) < 3.0 && Math.abs(cop.d - ramp.d) < 2.2 && cop.speed > 60) {
            cop.isAirborne = true;
            cop.verticalVel = 9.5 + (cop.speed / 200) * 6.5;
            cop.jumpHeight = 0.2;
            break;
          }
        }
      }

      // Airborne physics for cops
      if (cop.isAirborne) {
        cop.verticalVel -= 28.0 * deltaTime;
        cop.jumpHeight += cop.verticalVel * deltaTime;
        if (cop.jumpHeight <= 0) {
          cop.jumpHeight = 0;
          cop.isAirborne = false;
          cop.verticalVel = 0;
        }
      }

      // Decay spin angle after collisions
      cop.spinAngle *= Math.pow(0.02, deltaTime);

      // Move along track spline
      const speedMS = (cop.speed * 1000) / 3600;
      cop.s += speedMS * deltaTime;
      if (cop.s >= totalL) cop.s -= totalL;
      if (cop.s < 0) cop.s += totalL;

      // Keep within road width limits (-8.5m to +8.5m)
      cop.d = Math.max(-8.5, Math.min(8.5, cop.d));
      cop.model.update(deltaTime, cop.speed);

      // Repositioning loop if player leaves cop far behind
      if (ds < -200) {
        cop.s = playerS + 180 + Math.random() * 70;
        cop.d = (Math.random() - 0.5) * 12;
        cop.speed = 125 + Math.random() * 20;
        cop.outrunTriggered = false;
      }
    });

    this.updateCopPositions();
  }

  updateCopPositions() {
    this.cops.forEach((cop) => {
      const t = this.spline.distToT(cop.s);
      const centerPt = this.spline.getPointAt(t);
      const tangent = this.spline.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      cop.pos.copy(centerPt).addScaledVector(normal, cop.d);
      cop.pos.y = centerPt.y + 0.05 + cop.jumpHeight;

      cop.model.mesh.position.copy(cop.pos);
      const trackAngle = Math.atan2(tangent.x, tangent.z);
      cop.model.mesh.rotation.y = trackAngle + cop.spinAngle;
      cop.model.mesh.rotation.x = cop.isAirborne ? -0.15 : 0;
    });
  }

  checkCollision(playerPos, playerSpeed) {
    for (let cop of this.cops) {
      if (cop.hitCooldown > 0) continue;
      const dx = playerPos.x - cop.pos.x;
      const dz = playerPos.z - cop.pos.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 2.5) {
        cop.hitCooldown = 0.6;
        cop.spinAngle = (dx >= 0 ? -1 : 1) * 0.45;
        return {
          hit: true,
          pushX: dx >= 0 ? 3.0 : -3.0,
          speedMult: 0.68
        };
      }
    }
    return { hit: false };
  }

  clear() {
    this.cops.forEach(c => this.scene.remove(c.model.mesh));
    this.cops = [];
  }
}
