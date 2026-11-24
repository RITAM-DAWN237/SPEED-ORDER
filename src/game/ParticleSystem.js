/**
 * ParticleSystem.js - Manages dynamic nitro flames, exhaust smoke,
 * tire smoke on handbrake drift, and ambient snow weather particles
 */

import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.snowSystem = null;

    // Shared geometry and materials
    this.smokeGeo = new THREE.PlaneGeometry(0.6, 0.6);
    this.smokeMat = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });

    this.nitroGeo = new THREE.ConeGeometry(0.2, 0.9, 6);
    this.nitroGeo.rotateX(Math.PI / 2);
    this.nitroMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85
    });
  }

  /**
   * Spawn exhaust puff / nitro flame
   */
  emitNitroFlames(emitters, heading) {
    emitters.forEach(emitter => {
      const worldPos = new THREE.Vector3();
      emitter.getWorldPosition(worldPos);

      const flame = new THREE.Mesh(this.nitroGeo, this.nitroMat);
      flame.position.copy(worldPos);
      flame.rotation.y = heading + Math.PI;

      this.scene.add(flame);
      this.particles.push({
        mesh: flame,
        lifetime: 0.12,
        maxLife: 0.12,
        scaleSpeed: 4.0,
        fadeSpeed: 7.0
      });
    });
  }

  /**
   * Spawn tire smoke during drift or burnout
   */
  emitTireSmoke(pos) {
    const smoke = new THREE.Mesh(this.smokeGeo, this.smokeMat.clone());
    smoke.position.set(pos.x, 0.25, pos.z);
    smoke.rotation.x = -Math.PI / 2;
    smoke.rotation.z = Math.random() * Math.PI;

    this.scene.add(smoke);
    this.particles.push({
      mesh: smoke,
      lifetime: 0.45,
      maxLife: 0.45,
      scaleSpeed: 2.5,
      fadeSpeed: 2.2
    });
  }

  /**
   * Setup ambient falling snow for winter tracks
   */
  initSnow(active = true) {
    if (this.snowSystem) {
      this.scene.remove(this.snowSystem);
      this.snowSystem.geometry.dispose();
      this.snowSystem.material.dispose();
      this.snowSystem = null;
    }

    if (!active) return;

    const count = 1200;
    const geo = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < count; i++) {
      positions.push(
        (Math.random() - 0.5) * 400,
        Math.random() * 80,
        (Math.random() - 0.5) * 400
      );
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      transparent: true,
      opacity: 0.8
    });

    this.snowSystem = new THREE.Points(geo, mat);
    this.scene.add(this.snowSystem);
  }

  update(dt, playerPos) {
    // Update snow around player
    if (this.snowSystem && playerPos) {
      const posAttr = this.snowSystem.geometry.attributes.position;
      const arr = posAttr.array;

      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] -= 18 * dt; // Fall down
        arr[i] += Math.sin(arr[i + 1] * 0.05) * 3 * dt; // Drift in wind

        // Reset if below ground
        if (arr[i + 1] < 0) {
          arr[i + 1] = 60 + Math.random() * 20;
          arr[i] = playerPos.x + (Math.random() - 0.5) * 300;
          arr[i + 2] = playerPos.z + (Math.random() - 0.5) * 300;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Update transient smoke/nitro particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifetime -= dt;

      if (p.lifetime <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      } else {
        p.mesh.scale.multiplyScalar(1 + p.scaleSpeed * dt);
        if (p.mesh.material) {
          p.mesh.material.opacity = Math.max(0, p.mesh.material.opacity - p.fadeSpeed * dt);
        }
      }
    }
  }

  dispose() {
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];
    if (this.snowSystem) {
      this.scene.remove(this.snowSystem);
      this.snowSystem = null;
    }
  }
}
