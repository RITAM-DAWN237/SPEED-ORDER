import * as THREE from 'three';
import { circuitSpline } from './TrackSpline.js';

export class TrafficSystem {
  constructor(scene) {
    this.scene = scene;
    this.spline = circuitSpline;
    this.vehicles = [];
    this.initAssets();
  }

  initAssets() {
    this.truckGeo = new THREE.BoxGeometry(2.4, 2.0, 5.2);
    this.truckMat = new THREE.MeshLambertMaterial({ color: 0x4361ee });
    this.truckCabGeo = new THREE.BoxGeometry(2.3, 1.5, 1.6);
    this.truckCabMat = new THREE.MeshLambertMaterial({ color: 0xddeeff });

    this.sedanGeo = new THREE.BoxGeometry(2.0, 0.7, 4.2);
    this.sedanMat = new THREE.MeshLambertMaterial({ color: 0xe63946 });

    this.bikeGeo = new THREE.BoxGeometry(0.8, 1.0, 2.0);
    this.bikeMat = new THREE.MeshLambertMaterial({ color: 0xffb703 });
  }

  spawnTraffic(playerS, trackLength) {
    this.clear();
    const totalL = this.spline.totalLength;
    const types = ['TRUCK', 'SEDAN', 'BIKE'];
    const laneOffsets = [-4.0, -1.5, 1.5, 4.0];

    for (let s = 120; s < totalL - 80; s += 140) {
      const type = types[Math.floor(Math.random() * types.length)];
      const d = laneOffsets[Math.floor(Math.random() * laneOffsets.length)];
      const group = new THREE.Group();
      let speed = 90;

      if (type === 'TRUCK') {
        const body = new THREE.Mesh(this.truckGeo, this.truckMat);
        body.position.y = 1.2;
        group.add(body);
        const cab = new THREE.Mesh(this.truckCabGeo, this.truckCabMat);
        cab.position.set(0, 0.9, 2.2);
        group.add(cab);
        speed = 85;
      } else if (type === 'SEDAN') {
        const body = new THREE.Mesh(this.sedanGeo, this.sedanMat);
        body.position.y = 0.55;
        group.add(body);
        speed = 110;
      } else {
        const bike = new THREE.Mesh(this.bikeGeo, this.bikeMat);
        bike.position.y = 0.6;
        group.add(bike);
        speed = 125;
      }

      this.scene.add(group);
      this.vehicles.push({
        type,
        group,
        s,
        d,
        speed,
        pos: new THREE.Vector3(),
        hitCooldown: 0
      });
    }

    this.updateVehiclePositions();
  }

  update(deltaTime, playerPos, trackLength) {
    const totalL = this.spline.totalLength;
    this.vehicles.forEach(v => {
      if (v.hitCooldown > 0) v.hitCooldown -= deltaTime;
      const speedMS = (v.speed * 1000) / 3600;
      v.s += speedMS * deltaTime;
      if (v.s >= totalL) v.s -= totalL;
    });
    this.updateVehiclePositions();
  }

  updateVehiclePositions() {
    this.vehicles.forEach(v => {
      const t = this.spline.distToT(v.s);
      const centerPt = this.spline.getPointAt(t);
      const tangent = this.spline.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      v.pos.copy(centerPt).addScaledVector(normal, v.d);
      v.pos.y = 0.05;

      v.group.position.copy(v.pos);
      v.group.rotation.y = Math.atan2(tangent.x, tangent.z);
    });
  }

  checkCollision(playerPos, playerSpeed) {
    for (let v of this.vehicles) {
      if (v.hitCooldown > 0) continue;
      const dist = Math.hypot(playerPos.x - v.pos.x, playerPos.z - v.pos.z);
      if (dist < 2.5) {
        v.hitCooldown = 0.8;
        return {
          hit: true,
          pushX: (playerPos.x >= v.pos.x ? 1 : -1) * 3.0,
          speedMult: 0.65
        };
      }
    }
    return { hit: false };
  }

  clear() {
    this.vehicles.forEach(v => this.scene.remove(v.group));
    this.vehicles = [];
  }
}
