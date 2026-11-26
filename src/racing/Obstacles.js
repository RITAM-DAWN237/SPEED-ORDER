import * as THREE from 'three';
import { circuitSpline } from './TrackSpline.js';

/**
 * ObstacleSystem: Interactive racetrack hazards along the circuit spline:
 * - Heavy Concrete Jersey Barriers with yellow/black hazard chevrons & warning lights
 * - Construction Cones and Heavy Orange Barrels (fly into air as dynamic 3D physics debris)
 * - Tire Wall chicanes on corner exits
 * - Holographic Nitrous Boost Pads
 * Both Player and Police Cruisers collide with these obstacles!
 */
export class ObstacleSystem {
  constructor(scene) {
    this.scene = scene;
    this.spline = circuitSpline;
    this.obstacles = [];
    this.dynamicDebris = [];

    this.initAssets();
  }

  initAssets() {
    // 1. Concrete Barrier
    this.barrierGeo = new THREE.BoxGeometry(2.4, 1.1, 0.85);
    this.barrierMat = new THREE.MeshLambertMaterial({ color: 0x68707a });
    this.stripeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

    // 2. Construction Orange Barrel
    this.barrelGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.3, 10);
    this.barrelMat = new THREE.MeshLambertMaterial({
      color: 0xff5500,
      emissive: 0xff3300,
      emissiveIntensity: 0.25
    });
    this.whiteBandMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // 3. Traffic Cone
    this.coneGeo = new THREE.ConeGeometry(0.35, 0.9, 8);
    this.coneMat = new THREE.MeshLambertMaterial({
      color: 0xff4400,
      emissive: 0xff2200,
      emissiveIntensity: 0.3
    });

    // 4. Tire Wall
    this.tireGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 8);
    this.tireGeo.rotateX(Math.PI / 2);
    this.tireMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    // 5. Holographic Nitrous Boost Pad
    this.boostGeo = new THREE.PlaneGeometry(3.5, 5.0);
    this.boostGeo.rotateX(-Math.PI / 2);
    this.boostMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
  }

  spawnTrackObstacles() {
    this.clear();
    const totalL = this.spline.totalLength;

    // Distribute obstacles along circuit spline
    // Start after finish line straight (s > 100) and before end
    for (let s = 110; s < totalL - 90; s += 68) {
      const t = this.spline.distToT(s);
      const pt = this.spline.getPointAt(t);
      const tangent = this.spline.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const rand = Math.random();
      // Lane offsets within wider 20m road (-7m to +7m)
      const laneOffsets = [-6.0, -3.2, 0, 3.2, 6.0];
      const d = laneOffsets[Math.floor(Math.random() * laneOffsets.length)];

      const pos = pt.clone().addScaledVector(normal, d);
      pos.y = pt.y + 0.05;

      const trackAngle = Math.atan2(tangent.x, tangent.z);

      if (rand < 0.32) {
        // Construction Cone & Barrel Slalom
        this.createBarrelCluster(pos, trackAngle, s, d);
      } else if (rand < 0.65) {
        // Concrete Jersey Barrier
        this.createJerseyBarrier(pos, trackAngle, s, d);
      } else if (rand < 0.82) {
        // Tire Wall
        this.createTireWall(pos, trackAngle, s, d);
      } else {
        // Boost Pad
        this.createBoostPad(pos, trackAngle, s, d);
      }
    }
  }

  createJerseyBarrier(pos, angle, s, d) {
    const group = new THREE.Group();
    group.position.copy(pos);
    group.position.y += 0.55;
    group.rotation.y = angle;

    const base = new THREE.Mesh(this.barrierGeo, this.barrierMat);
    group.add(base);

    // Diagonal hazard stripes
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.3, 0.88), this.stripeMat);
    stripe.position.y = 0.12;
    group.add(stripe);

    // Blinking amber beacon
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
    bulb.position.set(0, 0.72, 0);
    group.add(bulb);

    this.scene.add(group);
    this.obstacles.push({
      type: 'BARRIER',
      group,
      radius: 1.6,
      hitCooldown: 0,
      pos: group.position,
      s,
      d
    });
  }

  createBarrelCluster(pos, angle, s, d) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Spawn 1 heavy barrel and 2 cones
    const barrel = new THREE.Mesh(this.barrelGeo, this.barrelMat);
    barrel.position.set(0, 0.65, 0);
    group.add(barrel);

    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.35, 10), this.whiteBandMat);
    band.position.set(0, 0.65, 0);
    group.add(band);

    const coneL = new THREE.Mesh(this.coneGeo, this.coneMat);
    coneL.position.set(-1.1, 0.45, 0.4);
    group.add(coneL);

    const coneR = new THREE.Mesh(this.coneGeo, this.coneMat);
    coneR.position.set(1.1, 0.45, -0.4);
    group.add(coneR);

    this.scene.add(group);
    this.obstacles.push({
      type: 'BARREL',
      group,
      barrelMesh: barrel,
      cones: [coneL, coneR],
      radius: 1.5,
      hitCooldown: 0,
      pos: group.position,
      s,
      d,
      isDebris: false
    });
  }

  createTireWall(pos, angle, s, d) {
    const group = new THREE.Group();
    group.position.copy(pos);
    group.position.y += 0.35;
    group.rotation.y = angle;

    for (let i = -1; i <= 1; i++) {
      const t1 = new THREE.Mesh(this.tireGeo, this.tireMat);
      t1.position.set(i * 0.9, 0, 0);
      group.add(t1);

      const t2 = new THREE.Mesh(this.tireGeo, this.tireMat);
      t2.position.set(i * 0.9, 0.5, 0);
      group.add(t2);
    }

    this.scene.add(group);
    this.obstacles.push({
      type: 'TIRES',
      group,
      radius: 1.6,
      hitCooldown: 0,
      pos: group.position,
      s,
      d
    });
  }

  createBoostPad(pos, angle, s, d) {
    const boost = new THREE.Mesh(this.boostGeo, this.boostMat);
    boost.position.copy(pos);
    boost.position.y += 0.05;
    boost.rotation.y = angle;
    this.scene.add(boost);

    this.obstacles.push({
      type: 'BOOST_PAD',
      mesh: boost,
      radius: 2.2,
      hitCooldown: 0,
      pos: boost.position,
      s,
      d
    });
  }

  checkVehicleCollisions(carPos, carSpeed) {
    const results = {
      speedMultiplier: 1.0,
      pushBackZ: 0,
      pushX: 0,
      hasCollision: false,
      soundEffect: null,
      boostTriggered: false
    };

    const carRadius = 1.4;
    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      if (obs.hitCooldown && obs.hitCooldown > 0) continue;

      const dx = carPos.x - obs.pos.x;
      const dz = carPos.z - obs.pos.z;
      const distSq = dx * dx + dz * dz;
      const minDist = carRadius + obs.radius;

      if (distSq < minDist * minDist) {
        results.hasCollision = true;

        if (obs.type === 'BARRIER' || obs.type === 'TIRES') {
          obs.hitCooldown = 0.8;
          results.speedMultiplier = 0.45;
          results.pushX = (dx >= 0 ? 1 : -1) * 3.5;
          results.soundEffect = 'crash';
          if (obs.group) {
            obs.group.position.x += (dx > 0 ? -0.5 : 0.5);
          }
        } else if (obs.type === 'BARREL') {
          obs.hitCooldown = 1.2;
          results.speedMultiplier = 0.75;
          results.soundEffect = 'crash';

          // Spawn flying physics debris
          if (!obs.isDebris && obs.group) {
            obs.isDebris = true;
            this.launchDebris(obs.group.clone(), carSpeed, dx, dz);
            obs.group.visible = false;
          }
        } else if (obs.type === 'BOOST_PAD') {
          obs.hitCooldown = 2.0;
          results.boostTriggered = true;
          results.speedMultiplier = 1.35;
        }
      }
    }
    return results;
  }

  // Police collision test: allows police cars to hit obstacles and spin out!
  checkCopCollision(copPos, copSpeed) {
    const carRadius = 1.3;
    for (let obs of this.obstacles) {
      if (obs.hitCooldown && obs.hitCooldown > 0) continue;
      const dx = copPos.x - obs.pos.x;
      const dz = copPos.z - obs.pos.z;
      if (dx * dx + dz * dz < (carRadius + obs.radius) * (carRadius + obs.radius)) {
        obs.hitCooldown = 0.9;
        if (obs.type === 'BARREL' && !obs.isDebris && obs.group) {
          obs.isDebris = true;
          this.launchDebris(obs.group.clone(), copSpeed, dx, dz);
          obs.group.visible = false;
        }
        return {
          hit: true,
          type: obs.type,
          pushX: (dx >= 0 ? 1 : -1) * 3.2,
          speedMult: obs.type === 'BOOST_PAD' ? 1.25 : 0.5
        };
      }
    }
    return { hit: false };
  }

  launchDebris(meshGroup, speed, dx, dz) {
    this.scene.add(meshGroup);
    this.dynamicDebris.push({
      group: meshGroup,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 8 + (dx > 0 ? 6 : -6),
        7 + Math.random() * 5,
        (Math.random() - 0.5) * 8 + (dz > 0 ? 6 : -6)
      ),
      rotVel: new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14
      ),
      life: 3.5
    });
  }

  update(deltaTime) {
    // Cooldown decrement
    for (let obs of this.obstacles) {
      if (obs.hitCooldown > 0) obs.hitCooldown -= deltaTime;
    }

    // Dynamic debris tumbling and bouncing
    for (let i = this.dynamicDebris.length - 1; i >= 0; i--) {
      const item = this.dynamicDebris[i];
      item.life -= deltaTime;
      item.vel.y -= 24 * deltaTime; // Gravity
      item.group.position.addScaledVector(item.vel, deltaTime);
      item.group.rotation.x += item.rotVel.x * deltaTime;
      item.group.rotation.y += item.rotVel.y * deltaTime;
      item.group.rotation.z += item.rotVel.z * deltaTime;

      // Ground bounce
      if (item.group.position.y < 0.25) {
        item.group.position.y = 0.25;
        item.vel.y *= -0.38;
        item.vel.x *= 0.6;
        item.vel.z *= 0.6;
      }

      if (item.life <= 0) {
        this.scene.remove(item.group);
        this.dynamicDebris.splice(i, 1);
      }
    }
  }

  clear() {
    this.obstacles.forEach(obs => {
      if (obs.group) this.scene.remove(obs.group);
      if (obs.mesh) this.scene.remove(obs.mesh);
    });
    this.dynamicDebris.forEach(deb => {
      if (deb.group) this.scene.remove(deb.group);
    });
    this.obstacles = [];
    this.dynamicDebris = [];
  }
}
