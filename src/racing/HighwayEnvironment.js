import * as THREE from 'three';

/**
 * HighwayEnvironment: Exact reproduction of the Traffic Racer highway:
 * - Straight 4-lane highway (width: 16m, 4 lanes of 4m each)
 * - White dashed lane lines, solid white center line & edge lines
 * - Corrugated metal Armco guardrails on left and right borders
 * - Savanna / desert grass roadside terrain with trees and boulders
 * - Seamless infinite scrolling chunks as player travels forward
 */
export class HighwayEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.roadWidth = 16.0;
    this.laneWidth = 4.0;
    this.numLanes = 4;

    // Chunk management
    this.chunkLength = 200;
    this.numChunks = 4;
    this.chunks = [];

    // Lane centers in X coordinates (-6m, -2m, +2m, +6m)
    this.laneCenters = [-6.0, -2.0, 2.0, 6.0];

    this.initAssets();
    this.buildInitialChunks();
  }

  initAssets() {
    // Road materials
    this.roadMat = new THREE.MeshLambertMaterial({ color: 0x5a5e66 });
    this.whiteMarkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Terrain material (Savanna grass matching screenshot)
    this.terrainMat = new THREE.MeshLambertMaterial({ color: 0x8a9942 });

    // Metal Guardrail material (Armco steel)
    this.guardrailMat = new THREE.MeshLambertMaterial({ color: 0x9098a3 });
    this.postMat = new THREE.MeshLambertMaterial({ color: 0x50555e });

    // Nature assets
    this.trunkMat = new THREE.MeshLambertMaterial({ color: 0x3d2818 });
    this.foliageMat = new THREE.MeshLambertMaterial({ color: 0x245722 });
    this.rockMat = new THREE.MeshLambertMaterial({ color: 0x6e685f });
  }

  createChunk(zOffset) {
    const chunkGroup = new THREE.Group();
    chunkGroup.position.z = zOffset;

    // 1. Road Surface (16m wide, chunkLength long)
    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.chunkLength);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMesh = new THREE.Mesh(roadGeo, this.roadMat);
    roadMesh.position.set(0, 0, this.chunkLength / 2);
    chunkGroup.add(roadMesh);

    // 2. Road Markings
    // Solid white edge lines at x = -7.6 and x = +7.6
    const edgeGeo = new THREE.PlaneGeometry(0.22, this.chunkLength);
    edgeGeo.rotateX(-Math.PI / 2);
    const edgeL = new THREE.Mesh(edgeGeo, this.whiteMarkMat);
    edgeL.position.set(-7.6, 0.02, this.chunkLength / 2);
    chunkGroup.add(edgeL);

    const edgeR = new THREE.Mesh(edgeGeo, this.whiteMarkMat);
    edgeR.position.set(7.6, 0.02, this.chunkLength / 2);
    chunkGroup.add(edgeR);

    // Solid white center divider line at x = 0
    const centerLineGeo = new THREE.PlaneGeometry(0.28, this.chunkLength);
    centerLineGeo.rotateX(-Math.PI / 2);
    const centerLine = new THREE.Mesh(centerLineGeo, this.whiteMarkMat);
    centerLine.position.set(0, 0.02, this.chunkLength / 2);
    chunkGroup.add(centerLine);

    // Dashed lines dividing Lane 1 & 2 (x = -4.0) and Lane 3 & 4 (x = +4.0)
    const dashLength = 4.0;
    const dashGap = 4.0;
    const dashGeo = new THREE.PlaneGeometry(0.2, dashLength);
    dashGeo.rotateX(-Math.PI / 2);

    for (let z = 0; z < this.chunkLength; z += dashLength + dashGap) {
      const dashL = new THREE.Mesh(dashGeo, this.whiteMarkMat);
      dashL.position.set(-4.0, 0.02, z + dashLength / 2);
      chunkGroup.add(dashL);

      const dashR = new THREE.Mesh(dashGeo, this.whiteMarkMat);
      dashR.position.set(4.0, 0.02, z + dashLength / 2);
      chunkGroup.add(dashR);
    }

    // 3. Metal Guardrails along borders (Left at x = -8.6, Right at x = +8.6)
    [-8.6, 8.6].forEach(gx => {
      const railGeo = new THREE.BoxGeometry(0.35, 0.75, this.chunkLength);
      const rail = new THREE.Mesh(railGeo, this.guardrailMat);
      rail.position.set(gx, 0.7, this.chunkLength / 2);
      chunkGroup.add(rail);

      // Support posts every 6m
      for (let pz = 3; pz < this.chunkLength; pz += 6) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), this.postMat);
        post.position.set(gx, 0.45, pz);
        chunkGroup.add(post);
      }
    });

    // 4. Savanna Grass Terrain on both sides
    const terrainWidth = 140;
    const terrainGeo = new THREE.PlaneGeometry(terrainWidth, this.chunkLength);
    terrainGeo.rotateX(-Math.PI / 2);

    const terrainL = new THREE.Mesh(terrainGeo, this.terrainMat);
    terrainL.position.set(-this.roadWidth / 2 - terrainWidth / 2, -0.05, this.chunkLength / 2);
    chunkGroup.add(terrainL);

    const terrainR = new THREE.Mesh(terrainGeo, this.terrainMat);
    terrainR.position.set(this.roadWidth / 2 + terrainWidth / 2, -0.05, this.chunkLength / 2);
    chunkGroup.add(terrainR);

    // 5. Roadside Trees and Rocks matching Traffic Racer screenshot
    // Plant trees along the roadside (12 to 18m from road)
    for (let tz = 12; tz < this.chunkLength - 10; tz += 22 + Math.random() * 14) {
      [-1, 1].forEach(side => {
        const tx = side * (12.0 + Math.random() * 20.0);
        const tree = this.createTree();
        tree.position.set(tx, 0, tz);
        chunkGroup.add(tree);

        // Occasionally spawn a roadside rock/boulder
        if (Math.random() < 0.45) {
          const rx = side * (9.5 + Math.random() * 8.0);
          const rz = tz + (Math.random() - 0.5) * 10;
          const rock = this.createRock();
          rock.position.set(rx, 0.5, rz);
          chunkGroup.add(rock);
        }
      });
    }

    this.scene.add(chunkGroup);
    return { group: chunkGroup, zOffset };
  }

  createTree() {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 4.0, 6), this.trunkMat);
    trunk.position.y = 2.0;
    group.add(trunk);

    // Foliage crown (conical pine/deciduous blend)
    const crown = new THREE.Mesh(new THREE.ConeGeometry(2.4, 6.0, 7), this.foliageMat);
    crown.position.y = 5.5;
    group.add(crown);

    const crown2 = new THREE.Mesh(new THREE.ConeGeometry(1.8, 4.5, 7), this.foliageMat);
    crown2.position.y = 7.5;
    group.add(crown2);

    return group;
  }

  createRock() {
    const size = 0.8 + Math.random() * 0.8;
    const geo = new THREE.DodecahedronGeometry(size);
    const mesh = new THREE.Mesh(geo, this.rockMat);
    mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    mesh.scale.set(1.2, 0.7, 1.0);
    return mesh;
  }

  buildInitialChunks() {
    for (let i = -1; i < this.numChunks - 1; i++) {
      const chunk = this.createChunk(i * this.chunkLength);
      this.chunks.push(chunk);
    }
  }

  update(playerZ) {
    // If player has progressed past the oldest chunk, recycle it to the front
    const oldestChunk = this.chunks[0];
    if (playerZ - oldestChunk.zOffset > this.chunkLength * 1.5) {
      this.chunks.shift();
      const newestChunk = this.chunks[this.chunks.length - 1];
      const newZ = newestChunk.zOffset + this.chunkLength;
      oldestChunk.group.position.z = newZ;
      oldestChunk.zOffset = newZ;
      this.chunks.push(oldestChunk);
    }
  }

  clear() {
    this.chunks.forEach(c => this.scene.remove(c.group));
    this.chunks = [];
  }
}
